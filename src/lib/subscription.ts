import { db } from "@/lib/db";

export async function isPremium(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true },
  });

  return user?.subscriptionStatus === "active";
}
