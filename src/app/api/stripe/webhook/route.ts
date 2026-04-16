import Stripe from "stripe";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mapSubscriptionStatus(status: Stripe.Subscription.Status) {
  if (status === "active" || status === "trialing") {
    return "active";
  }

  if (status === "canceled" || status === "unpaid" || status === "past_due") {
    return "canceled";
  }

  return "inactive";
}

function mapPlan(status: string) {
  return status === "active" ? "PREMIUM" : "FREE";
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
  return typeof currentPeriodEnd === "number" ? new Date(currentPeriodEnd * 1000) : undefined;
}

async function updateUserSubscription(input: {
  userId?: string;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus: string;
}) {
  const where = input.userId
    ? { id: input.userId }
    : input.stripeCustomerId
      ? { stripeCustomerId: input.stripeCustomerId }
      : input.subscriptionId
        ? { subscriptionId: input.subscriptionId }
        : null;

  if (!where) {
    return;
  }

  await db.user.update({
    where,
    data: {
      stripeCustomerId: input.stripeCustomerId ?? undefined,
      subscriptionId: input.subscriptionId ?? undefined,
      subscriptionStatus: input.subscriptionStatus,
      plan: mapPlan(input.subscriptionStatus),
    },
  });
}

async function syncSubscriptionRecord(input: {
  userId?: string;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus: string;
  currentPeriodEnd?: Date;
}) {
  if (!input.userId || !input.subscriptionId || !input.stripeCustomerId) {
    return;
  }

  await db.subscription.upsert({
    where: {
      stripeSubscriptionId: input.subscriptionId,
    },
    update: {
      stripeCustomerId: input.stripeCustomerId,
      status: input.subscriptionStatus,
      currentPeriodEnd: input.currentPeriodEnd,
      tier: input.subscriptionStatus === "active" ? "STANDARD" : "FREE",
    },
    create: {
      userId: input.userId,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.subscriptionId,
      status: input.subscriptionStatus,
      currentPeriodEnd: input.currentPeriodEnd,
      tier: input.subscriptionStatus === "active" ? "STANDARD" : "FREE",
      monthlyLimit: input.subscriptionStatus === "active" ? 20 : 2,
    },
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new Response("Missing Stripe webhook configuration", { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return new Response(
      `Webhook signature verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const stripeCustomerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        if (userId) {
          const subscription = subscriptionId
            ? await stripe.subscriptions.retrieve(subscriptionId)
            : null;

          await updateUserSubscription({
            userId,
            stripeCustomerId,
            subscriptionId,
            subscriptionStatus: "active",
          });

          await syncSubscriptionRecord({
            userId,
            stripeCustomerId,
            subscriptionId,
            subscriptionStatus: "active",
            currentPeriodEnd: subscription ? getCurrentPeriodEnd(subscription) : undefined,
          });
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await db.user.findFirst({
          where: {
            OR: [
              { stripeCustomerId: String(subscription.customer) },
              { subscriptionId: subscription.id },
            ],
          },
          select: {
            id: true,
          },
        });

        await updateUserSubscription({
          stripeCustomerId: String(subscription.customer),
          subscriptionId: subscription.id,
          subscriptionStatus: mapSubscriptionStatus(subscription.status),
        });

        await syncSubscriptionRecord({
          userId: user?.id,
          stripeCustomerId: String(subscription.customer),
          subscriptionId: subscription.id,
          subscriptionStatus: mapSubscriptionStatus(subscription.status),
          currentPeriodEnd: getCurrentPeriodEnd(subscription),
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await db.user.findFirst({
          where: {
            OR: [
              { stripeCustomerId: String(subscription.customer) },
              { subscriptionId: subscription.id },
            ],
          },
          select: {
            id: true,
          },
        });

        await updateUserSubscription({
          stripeCustomerId: String(subscription.customer),
          subscriptionId: subscription.id,
          subscriptionStatus: "canceled",
        });

        await syncSubscriptionRecord({
          userId: user?.id,
          stripeCustomerId: String(subscription.customer),
          subscriptionId: subscription.id,
          subscriptionStatus: "canceled",
          currentPeriodEnd: getCurrentPeriodEnd(subscription),
        });

        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handling failed.", error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
