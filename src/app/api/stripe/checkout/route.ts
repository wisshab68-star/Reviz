import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!priceId || !appUrl) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
    },
  });

  if (!user?.email) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  let stripeCustomerId = user.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: {
        userId: user.id,
      },
    });

    stripeCustomerId = customer.id;

    await db.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId,
      },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/app?upgraded=true`,
    cancel_url: `${appUrl}/app`,
    metadata: {
      userId: user.id,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
      },
    },
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
