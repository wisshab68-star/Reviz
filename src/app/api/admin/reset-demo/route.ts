import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  const adminEmails = getAdminEmails();
  const sessionEmail = session?.user?.email?.toLowerCase();

  if (!session?.user?.id || !sessionEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminEmails.includes(sessionEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as { ip?: string };
  const ip = typeof body.ip === "string" ? body.ip.trim() : "";

  if (ip) {
    await db.demoRateLimit.deleteMany({ where: { ip } });
    return NextResponse.json({ reset: true, ip });
  }

  const { count } = await db.demoRateLimit.deleteMany({});
  return NextResponse.json({ reset: true, count });
}
