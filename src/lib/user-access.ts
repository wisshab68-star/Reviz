import { Plan } from "@prisma/client";

import { auth } from "@/auth";
import { db } from "@/lib/db";

function getDisplayName(name: string | null | undefined, email: string | null | undefined) {
  const trimmedName = name?.trim();

  if (trimmedName) {
    return trimmedName.split(/\s+/)[0] ?? "Invite";
  }

  const emailPrefix = email?.split("@")[0]?.trim();
  return emailPrefix || "Invite";
}

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  const trimmedName = name?.trim();

  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean).slice(0, 2);
    const initials = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
    if (initials) {
      return initials;
    }
  }

  const emailPrefix = email?.split("@")[0]?.trim();
  return emailPrefix?.slice(0, 1).toUpperCase() || "R";
}

export type CurrentUserAccess = {
  userId: string;
  email: string | null;
  name: string | null;
  image: string | null;
  plan: Plan;
  subscriptionStatus: string | null;
  sheetCount: number;
  hasSeenDemo: boolean;
  isPremium: boolean;
  displayName: string;
  initials: string;
  welcomeName: string;
};

export async function getCurrentUserAccess(): Promise<CurrentUserAccess | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      plan: true,
      subscriptionStatus: true,
      hasSeenDemo: true,
      _count: {
        select: {
          studySheets: {
            where: {
              status: {
                not: "FAILED",
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const displayName = getDisplayName(user.name, user.email);

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    plan: user.plan ?? session.user.plan ?? Plan.FREE,
    subscriptionStatus: user.subscriptionStatus ?? null,
    sheetCount: user._count.studySheets,
    hasSeenDemo: user.hasSeenDemo,
    isPremium: user.subscriptionStatus === "active",
    displayName,
    initials: getInitials(user.name, user.email),
    welcomeName: displayName,
  };
}
