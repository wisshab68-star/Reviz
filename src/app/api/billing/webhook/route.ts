import Stripe from "stripe";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { syncUserPlan, upsertSubscriptionFromStripe } from "@/services/billing-service";

export const runtime = "nodejs";

function getPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return typeof periodEnd === "number" ? new Date(periodEnd * 1000) : undefined;
}

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

  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created"
  ) {
    const object = event.data.object;

    if (event.type === "checkout.session.completed") {
      const session = object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;

      if (userId && subscriptionId && customerId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await upsertSubscriptionFromStripe({
          userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: getPeriodEnd(subscription),
        });
        await syncUserPlan(userId, subscription.status);
      }
    } else {
      const subscription = object as Stripe.Subscription;
      const subscriptionRecord = await db.subscription.findFirst({
        where: {
          stripeSubscriptionId: subscription.id,
        },
      });

      if (subscriptionRecord) {
        await upsertSubscriptionFromStripe({
          userId: subscriptionRecord.userId,
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: getPeriodEnd(subscription),
        });
        await syncUserPlan(subscriptionRecord.userId, subscription.status);
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionRecord = await db.subscription.findFirst({
      where: {
        stripeSubscriptionId: subscription.id,
      },
    });

    if (subscriptionRecord) {
      await upsertSubscriptionFromStripe({
        userId: subscriptionRecord.userId,
        stripeCustomerId: String(subscription.customer),
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: getPeriodEnd(subscription),
      });
      await syncUserPlan(subscriptionRecord.userId, subscription.status);
    }
  }

  return new Response("ok", { status: 200 });
}
