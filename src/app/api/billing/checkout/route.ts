import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createCheckoutSession, createPromoCheckoutSession } from "@/lib/stripe/subscription-service";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let tier: string;
  try {
    const body = await request.json() as { tier?: string };
    tier = body.tier ?? "STANDARD";
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
      );
    } else if (tier === "STANDARD" || tier === "PRO") {
      stripeSession = await createCheckoutSession(
        session.user.id,
        session.user.email,
        tier,
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
