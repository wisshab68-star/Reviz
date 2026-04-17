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
          if (promoTier) {
            await handlePromoPurchase(userId, promoTier);
            console.log({ event: event.type, userId, promoTier });
          }
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
          const amountPaid = session.amount_total ?? 0;
          await sendGA4Event(userId, "subscription_completed", {
            subscription_id: sub.id,
            value: amountPaid / 100,
            currency: "EUR",
          });
          console.log({ event: event.type, userId, newStatus: sub.status, priceId });
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

        // Never downgrade an active subscription due to a spurious event
        if (sub.status !== "active" && sub.status !== "trialing") {
          console.log({ event: event.type, userId: record.userId, newStatus: sub.status, priceId, action: "skipped-non-active" });
          break;
        }

        await syncSubscriptionFromStripe(
          record.userId,
          String(sub.customer),
          sub.id,
          priceId,
          sub.status,
          sub.items.data[0]?.current_period_start,
          sub.items.data[0]?.current_period_end,
        );
        console.log({ event: event.type, userId: record.userId, newStatus: sub.status, priceId });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const record = await db.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (record) {
          await downgradeToFree(record.userId);
          console.log({ event: event.type, userId: record.userId, newStatus: "FREE" });
        }
        break;
      }
    }
  } catch (err) {
    console.error("[WEBHOOK] handler error:", err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}

async function sendGA4Event(
  userId: string,
  eventName: string,
  params: Record<string, unknown>,
) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.warn("[GA4] GA4_MEASUREMENT_ID or GA4_API_SECRET not set — skipping event");
    return;
  }

  const body = {
    client_id: `server.${userId}`,
    user_id: userId,
    events: [{ name: eventName, params }],
  };

  try {
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error("[GA4] Measurement Protocol failed:", res.status, res.statusText);
    }
  } catch (err) {
    console.error("[GA4] Measurement Protocol error:", err);
  }
}
