import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { PRICING_TIERS, EXAM_PROMO_DATES, isExamPromoActive, tierFromPriceId, type TierKey } from "./pricing-config";
import type { SubscriptionTier } from "@prisma/client";

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns (or lazily creates) a Subscription row for the given user.
 */
export async function getOrCreateSubscription(userId: string) {
  const existing = await db.subscription.findUnique({ where: { userId } });
  if (existing) return existing;

  return db.subscription.create({
    data: {
      userId,
      tier: "FREE",
      monthlyLimit: PRICING_TIERS.FREE.monthlyLimit,
      sheetsUsedMonth: 0,
    },
  });
}

// ── Quota ──────────────────────────────────────────────────────────────────

/**
 * Check if the user may generate another sheet.
 * Also resets the monthly counter when the billing period rolls over.
 */
export async function canGenerateSheet(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  remaining: number;
  limit: number;
}> {
  const sub = await getOrCreateSubscription(userId);

  // Ambassadors get unlimited access until their expiry date
  const now = new Date();
  if (sub.isAmbassador && sub.ambassadorExpiresAt && sub.ambassadorExpiresAt > now) {
    return { allowed: true, remaining: 999, limit: 999 };
  }

  // Reset if the period ended
  let sheetsUsed = sub.sheetsUsedMonth;

  if (sub.currentPeriodEnd && now > sub.currentPeriodEnd) {
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    await db.subscription.update({
      where: { userId },
      data: {
        sheetsUsedMonth: 0,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    });
    sheetsUsed = 0;
  }

  const remaining = sub.monthlyLimit - sheetsUsed;

  if (remaining <= 0) {
    const tierName = PRICING_TIERS[sub.tier as TierKey]?.name ?? sub.tier;
    return {
      allowed: false,
      reason:
        sub.tier === "FREE"
          ? "Tu as utilisé tes 2 fiches gratuites. Passe en Standard ou Pro pour continuer."
          : sub.tier === "STANDARD" || sub.tier === "STANDARD_ANNUAL"
          ? `Limite mensuelle atteinte (${sub.monthlyLimit} fiches ${tierName}). Passe au plan Pro pour générer jusqu'à 50 fiches/mois.`
          : `Limite mensuelle atteinte (${sub.monthlyLimit} fiches ${tierName}). Réessaie le mois prochain.`,
      remaining: 0,
      limit: sub.monthlyLimit,
    };
  }

  return { allowed: true, remaining, limit: sub.monthlyLimit };
}

/**
 * Increment the monthly sheet counter after a successful generation.
 */
export async function incrementSheetCount(userId: string) {
  await db.subscription.update({
    where: { userId },
    data: { sheetsUsedMonth: { increment: 1 } },
  });
}

// ── Checkout ───────────────────────────────────────────────────────────────

/**
 * Create a Stripe Checkout session for a recurring subscription (STANDARD | PRO).
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  tier: "STANDARD" | "PRO" | "STANDARD_ANNUAL",
  gaClientId?: string,
) {
  const sub = await getOrCreateSubscription(userId);
  const config = PRICING_TIERS[tier];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (!config.stripePriceId) {
    throw new Error(`Price ID non configuré pour ${tier} — ajoutez STRIPE_PRICE_${tier} à .env`);
  }

  const session = await stripe.checkout.sessions.create({
    customer: sub.stripeCustomerId ?? undefined,
    customer_email: sub.stripeCustomerId ? undefined : userEmail,
    payment_method_types: ["card"],
    line_items: [{ price: config.stripePriceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${appUrl}/pricing?success=true`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { userId, tier, ...(gaClientId ? { gaClientId } : {}) },
  });

  return session;
}

/**
 * Create a Stripe Checkout session for a one-time promo purchase.
 */
export async function createPromoCheckoutSession(
  userId: string,
  userEmail: string,
  promoTier: "EXAM_PROMO_20" | "EXAM_PROMO_40",
  gaClientId?: string,
) {
  const sub = await getOrCreateSubscription(userId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (sub.tier === "FREE") {
    throw new Error("La promo examen est réservée aux abonnés Standard ou Pro.");
  }

  if (!isExamPromoActive()) {
    throw new Error("Offre promo non disponible actuellement.");
  }

  const config = PRICING_TIERS[promoTier];

  if (!config.stripePriceId) {
    throw new Error(`Price ID non configuré pour ${promoTier}`);
  }

  const session = await stripe.checkout.sessions.create({
    customer: sub.stripeCustomerId ?? undefined,
    customer_email: sub.stripeCustomerId ? undefined : userEmail,
    payment_method_types: ["card"],
    line_items: [{ price: config.stripePriceId, quantity: 1 }],
    mode: "payment",
    success_url: `${appUrl}/pricing?promo_success=true`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { userId, tier: promoTier, isPromoExam: "true", ...(gaClientId ? { gaClientId } : {}) },
  });

  return session;
}

// ── Sync from Stripe ───────────────────────────────────────────────────────

/**
 * Update the local Subscription from a Stripe subscription object.
 */
export async function syncSubscriptionFromStripe(
  userId: string,
  stripeCustomerId: string,
  stripeSubId: string,
  priceId: string,
  status: string,
  periodStart?: number,
  periodEnd?: number,
) {
  const tierKey = tierFromPriceId(priceId) as TierKey;
  const config = PRICING_TIERS[tierKey];

  // Update legacy User.plan + subscriptionStatus for backward-compat
  const isActive = status === "active" || status === "trialing";
  await db.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: isActive ? "active" : "canceled",
      plan: isActive ? "PREMIUM" : "FREE",
    },
  });

  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      tier: tierKey as SubscriptionTier,
      status,
      monthlyLimit: config.monthlyLimit,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubId,
      stripePriceId: priceId,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : undefined,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
    },
    update: {
      tier: tierKey as SubscriptionTier,
      status,
      monthlyLimit: config.monthlyLimit,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubId,
      stripePriceId: priceId,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : undefined,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
    },
  });
}

/**
 * Downgrade to FREE when a subscription is deleted.
 */
export async function downgradeToFree(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { plan: "FREE", subscriptionStatus: "canceled" },
  });

  await db.subscription.update({
    where: { userId },
    data: {
      tier: "FREE",
      status: "canceled",
      monthlyLimit: PRICING_TIERS.FREE.monthlyLimit,
      cancelledAt: new Date(),
    },
  });
}

/**
 * Handle a successful one-time promo purchase.
 */
export async function handlePromoPurchase(
  userId: string,
  promoTier: "EXAM_PROMO_20" | "EXAM_PROMO_40",
) {
  const config = PRICING_TIERS[promoTier];
  const promoOption = promoTier === "EXAM_PROMO_20" ? 20 : 40;

  // Add fiches to current month allowance
  await db.subscription.update({
    where: { userId },
    data: { monthlyLimit: { increment: promoOption } },
  });

  await db.promoExamAccess.upsert({
    where: { userId },
    create: {
      userId,
      promoOption,
      promoPrice: config.price,
      purchased: true,
      purchasedAt: new Date(),
      validFrom: EXAM_PROMO_DATES.startDate,
      validUntil: EXAM_PROMO_DATES.endDate,
    },
    update: {
      promoOption,
      purchased: true,
      purchasedAt: new Date(),
    },
  });
}
