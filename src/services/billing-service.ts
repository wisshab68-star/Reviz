import { db } from "@/lib/db";
import { PRICING_TIERS, tierFromPriceId, type TierKey } from "@/lib/stripe/pricing-config";
import type { SubscriptionTier } from "@prisma/client";

/** @deprecated Use syncSubscriptionFromStripe in lib/stripe/subscription-service instead */
export async function upsertSubscriptionFromStripe(input: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodEnd?: Date;
  priceId?: string;
}) {
  const tierKey = input.priceId ? tierFromPriceId(input.priceId) : "STANDARD";
  const config = PRICING_TIERS[tierKey as TierKey];
  const isActive = input.status === "active" || input.status === "trialing";

  return db.subscription.upsert({
    where: { userId: input.userId },
    update: {
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      status: input.status,
      currentPeriodEnd: input.currentPeriodEnd,
      tier: (isActive ? tierKey : "FREE") as SubscriptionTier,
      monthlyLimit: isActive ? config.monthlyLimit : PRICING_TIERS.FREE.monthlyLimit,
    },
    create: {
      userId: input.userId,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      status: input.status,
      currentPeriodEnd: input.currentPeriodEnd,
      tier: (isActive ? tierKey : "FREE") as SubscriptionTier,
      monthlyLimit: isActive ? config.monthlyLimit : PRICING_TIERS.FREE.monthlyLimit,
    },
  });
}

/** @deprecated Use downgradeToFree or syncSubscriptionFromStripe instead */
export async function syncUserPlan(userId: string, status: string) {
  const isActive = status === "active" || status === "trialing";
  return db.user.update({
    where: { id: userId },
    data: {
      plan: isActive ? "PREMIUM" : "FREE",
      subscriptionStatus: isActive ? "active" : "canceled",
    },
  });
}
