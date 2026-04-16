import Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import {
  syncSubscriptionFromStripe,
  downgradeToFree,
  handlePromoPurchase,
} from "@/lib/stripe/subscription-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return new Response("Missing Stripe webhook configuration", { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    return new Response(
      `Webhook signature verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      // ── New subscription or renewal ──────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId) break;

        // One-time promo purchase
        if (session.metadata?.isPromoExam === "true") {
          const promoTier = session.metadata.tier as "EXAM_PROMO_20" | "EXAM_PROMO_40";
          if (promoTier) await handlePromoPurchase(userId, promoTier);
          break;
        }

        // Recurring subscription
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;

        if (subscriptionId && customerId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price.id ?? "";

          await syncSubscriptionFromStripe(
            userId,
            customerId,
            sub.id,
            priceId,
            sub.status,
            sub.items.data[0]?.current_period_start,
            sub.items.data[0]?.current_period_end,
          );
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const record = await db.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!record) break;

        const priceId = sub.items.data[0]?.price.id ?? "";
        await syncSubscriptionFromStripe(
          record.userId,
          String(sub.customer),
          sub.id,
          priceId,
          sub.status,
          sub.items.data[0]?.current_period_start,
          sub.items.data[0]?.current_period_end,
        );
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const record = await db.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (record) await downgradeToFree(record.userId);
        break;
      }
    }
  } catch (err) {
    console.error("[WEBHOOK] handler error:", err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
