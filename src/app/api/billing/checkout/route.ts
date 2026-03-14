import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const priceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!priceId || !appUrl) {
    return NextResponse.json(
      { success: false, error: "Stripe is not configured." },
      { status: 500 },
    );
  }

  const existingSubscription = await db.subscription.findFirst({
    where: { userId: session.user.id },
  });

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: existingSubscription?.stripeCustomerId ?? undefined,
    customer_email: existingSubscription?.stripeCustomerId ? undefined : session.user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/settings?billing=success`,
    cancel_url: `${appUrl}/pricing?billing=cancelled`,
    metadata: {
      userId: session.user.id,
    },
  });

  return NextResponse.json({
    success: true,
    url: stripeSession.url,
  });
}
