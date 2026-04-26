import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { createCheckoutSession, createPromoCheckoutSession } from "@/lib/stripe/subscription-service";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let tier: string;
  let gaClientId: string | undefined;
  let affiliateCode: string | undefined;
  try {
    const body = await request.json() as { tier?: string; gaClientId?: string };
    tier = body.tier ?? "STANDARD";
    gaClientId = typeof body.gaClientId === "string" && body.gaClientId.length < 64
      ? body.gaClientId
      : undefined;
    // Read affiliate code from cookie
    const cookieStore = await cookies();
    const refCookie = cookieStore.get("reviz_ref")?.value;
    affiliateCode = refCookie && /^[A-Z0-9]{4,20}$/.test(refCookie) ? refCookie : undefined;
  } catch {
    tier = "STANDARD";
  }

  try {
    let stripeSession;

    if (tier === "EXAM_PROMO_20" || tier === "EXAM_PROMO_40") {
      stripeSession = await createPromoCheckoutSession(
        session.user.id,
        session.user.email,
        tier,
        gaClientId,
      );
    } else if (tier === "STANDARD" || tier === "STANDARD_ANNUAL" || tier === "PRO") {
      stripeSession = await createCheckoutSession(
        session.user.id,
        session.user.email,
        tier,
        gaClientId,
        affiliateCode,
      );
    } else {
      return NextResponse.json({ success: false, error: "Tier invalide." }, { status: 400 });
    }

    return NextResponse.json({ success: true, url: stripeSession.url });
  } catch (error) {
    console.error("[CHECKOUT]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur Stripe." },
      { status: 400 },
    );
  }
}
