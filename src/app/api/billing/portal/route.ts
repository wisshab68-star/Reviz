import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const subscription = await db.subscription.findFirst({
    where: {
      userId: session.user.id,
      stripeCustomerId: {
        not: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json(
      { success: false, error: "No Stripe customer found." },
      { status: 404 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { success: false, error: "NEXT_PUBLIC_APP_URL is not configured." },
      { status: 500 },
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl}/settings`,
  });

  return NextResponse.json({
    success: true,
    url: portalSession.url,
  });
}
