import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

/**
 * Generate a unique affiliate code from a first name.
 * e.g. "Camille" → "CAMILLE42"
 */
function generateCode(name: string): string {
  const base = name.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 10);
  const suffix = String(Math.floor(10 + Math.random() * 90));
  return `${base}${suffix}`;
}

/**
 * Create an affiliate: Stripe coupon (0% — tracking only) + DB record.
 */
export async function createAffiliateCode(name: string, email: string) {
  // Ensure unique code
  let code = generateCode(name);
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db.affiliate.findUnique({ where: { code } });
    if (!existing) break;
    code = generateCode(name);
    attempts++;
  }

  // Create Stripe coupon (0% discount — tracking only)
  const coupon = await stripe.coupons.create({
    id: code,
    percent_off: 0,
    duration: "forever",
    name: `Affiliée ${name}`,
    metadata: { affiliate_code: code, affiliate_email: email },
  });

  // Create Stripe promotion code so it can be entered at checkout
  await stripe.promotionCodes.create({
    coupon: coupon.id,
    code,
    metadata: { affiliate_code: code },
  });

  // Save to DB
  const affiliate = await db.affiliate.create({
    data: { name, email, code, stripeCouponId: coupon.id },
  });

  return affiliate;
}

/**
 * Track a completed sale for an affiliate.
 * Called from the webhook when checkout.session.completed fires.
 */
export async function trackAffiliateSale(code: string) {
  const affiliate = await db.affiliate.findUnique({ where: { code } });
  if (!affiliate) return null;

  return db.affiliate.update({
    where: { code },
    data: {
      totalSales: { increment: 1 },
      totalEarnings: { increment: 1.5 },
    },
  });
}
