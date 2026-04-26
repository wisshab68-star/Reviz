import { NextResponse } from "next/server";

import { createAffiliateCode } from "@/lib/stripe/affiliate-service";

// Simple secret-key protection — set ADMIN_SECRET in .env
function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const secret = process.env.ADMIN_SECRET;
  return Boolean(secret && auth === `Bearer ${secret}`);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as { name?: string; email?: string };
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: "name et email requis" }, { status: 400 });
    }

    const affiliate = await createAffiliateCode(name, email);

    return NextResponse.json({
      success: true,
      affiliate: {
        name: affiliate.name,
        email: affiliate.email,
        code: affiliate.code,
        link: `https://revizai.app?ref=${affiliate.code}`,
        dashboard: `https://revizai.app/affiliate/${affiliate.code}`,
      },
    });
  } catch (error) {
    console.error("[AFFILIATE]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 },
    );
  }
}
