import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PRICING_TIERS } from "@/lib/stripe/pricing-config";

export const runtime = "nodejs";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!session?.user?.id || !email) return null;
  if (!getAdminEmails().includes(email)) return null;
  return session.user.id;
}

// POST /api/admin/ambassador — activate ambassador access
// Body: { email: string, durationMonths?: number (default 12) }
export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as { email?: unknown; durationMonths?: unknown };

  if (typeof body.email !== "string" || !body.email.includes("@")) {
    return NextResponse.json({ error: "email invalide" }, { status: 400 });
  }

  const durationMonths =
    typeof body.durationMonths === "number" && body.durationMonths > 0 && body.durationMonths <= 24
      ? body.durationMonths
      : 12;

  const email = body.email.trim().toLowerCase();

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: `Utilisateur introuvable : ${email}` }, { status: 404 });
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

  const proLimit = PRICING_TIERS.PRO.monthlyLimit;

  await db.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      tier: "PRO",
      monthlyLimit: proLimit,
      isAmbassador: true,
      ambassadorExpiresAt: expiresAt,
    },
    update: {
      tier: "PRO",
      monthlyLimit: proLimit,
      isAmbassador: true,
      ambassadorExpiresAt: expiresAt,
      status: "active",
    },
  });

  // Keep legacy User.plan in sync
  await db.user.update({ where: { id: user.id }, data: { plan: "PREMIUM" } });

  return NextResponse.json({
    ok: true,
    email,
    ambassadorUntil: expiresAt.toISOString(),
  });
}

// DELETE /api/admin/ambassador — revoke ambassador access
// Body: { email: string }
export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as { email?: unknown };

  if (typeof body.email !== "string" || !body.email.includes("@")) {
    return NextResponse.json({ error: "email invalide" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: `Utilisateur introuvable : ${email}` }, { status: 404 });
  }

  await db.subscription.update({
    where: { userId: user.id },
    data: {
      isAmbassador: false,
      ambassadorExpiresAt: null,
      tier: "FREE",
      monthlyLimit: PRICING_TIERS.FREE.monthlyLimit,
      status: "active",
    },
  });

  await db.user.update({ where: { id: user.id }, data: { plan: "FREE" } });

  return NextResponse.json({ ok: true, email, revoked: true });
}
