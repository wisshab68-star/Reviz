import { Plan } from "@prisma/client";

import { db } from "@/lib/db";

export async function upsertSubscriptionFromStripe(input: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodEnd?: Date;
}) {
  return db.subscription.upsert({
    where: {
      stripeSubscriptionId: input.stripeSubscriptionId,
    },
    update: {
      stripeCustomerId: input.stripeCustomerId,
      status: input.status,
      currentPeriodEnd: input.currentPeriodEnd,
      plan: input.status === "active" ? Plan.PREMIUM : Plan.FREE,
    },
    create: {
      userId: input.userId,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      status: input.status,
      currentPeriodEnd: input.currentPeriodEnd,
      plan: input.status === "active" ? Plan.PREMIUM : Plan.FREE,
    },
  });
}

export async function syncUserPlan(userId: string, status: string) {
  return db.user.update({
    where: { id: userId },
    data: {
      plan: status === "active" ? Plan.PREMIUM : Plan.FREE,
    },
  });
}
