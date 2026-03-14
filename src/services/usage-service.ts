import { db } from "@/lib/db";
import { FREE_MONTHLY_SHEET_LIMIT, hasUnlimitedSheets } from "@/lib/plans";
import { Plan } from "@prisma/client";

export async function trackUsage(userId: string | undefined, eventType: string) {
  if (!userId) {
    return null;
  }

  return db.usageEvent.create({
    data: {
      userId,
      eventType,
      quantity: 1,
    },
  });
}

export async function getMonthlySheetUsage(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return db.usageEvent.aggregate({
    where: {
      userId,
      eventType: "sheet_generated",
      createdAt: {
        gte: startOfMonth,
      },
    },
    _sum: {
      quantity: true,
    },
  });
}

export async function assertSheetQuota(userId: string, plan: Plan) {
  if (hasUnlimitedSheets(plan)) {
    return {
      allowed: true,
      remaining: null,
      limit: null,
    };
  }

  const usage = await getMonthlySheetUsage(userId);
  const used = usage._sum.quantity ?? 0;

  if (used >= FREE_MONTHLY_SHEET_LIMIT) {
    throw new Error("Quota mensuel atteint. Passe en Premium pour generer des fiches illimitees.");
  }

  return {
    allowed: true,
    remaining: FREE_MONTHLY_SHEET_LIMIT - used,
    limit: FREE_MONTHLY_SHEET_LIMIT,
  };
}
