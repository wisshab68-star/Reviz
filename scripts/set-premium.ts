import { Plan, PrismaClient, SubscriptionTier } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL = "wisshab68@gmail.com";
const PRO_MONTHLY_LIMIT = 50;

async function main() {
  const now = new Date();
  const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      plan: Plan.PREMIUM,
      subscriptionStatus: "active",
    },
    create: {
      email: EMAIL,
      plan: Plan.PREMIUM,
      subscriptionStatus: "active",
    },
    select: {
      id: true,
      email: true,
      plan: true,
      subscriptionStatus: true,
    },
  });

  const subscription = await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {
      tier: SubscriptionTier.PRO,
      status: "active",
      monthlyLimit: PRO_MONTHLY_LIMIT,
      sheetsUsedMonth: 0,
      currentPeriodStart: now,
      currentPeriodEnd,
      cancelledAt: null,
    },
    create: {
      userId: user.id,
      tier: SubscriptionTier.PRO,
      status: "active",
      monthlyLimit: PRO_MONTHLY_LIMIT,
      sheetsUsedMonth: 0,
      currentPeriodStart: now,
      currentPeriodEnd,
    },
    select: {
      id: true,
      userId: true,
      tier: true,
      status: true,
      monthlyLimit: true,
      sheetsUsedMonth: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        user,
        subscription,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
