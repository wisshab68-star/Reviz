import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { syncSubscriptionFromStripe } from "@/lib/stripe/subscription-service";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const email = session.user.email;

  try {
    const subRecord = await db.subscription.findUnique({ where: { userId } });
    let customerId = subRecord?.stripeCustomerId ?? null;

    if (!customerId) {
      const customers = await stripe.customers.list({ email, limit: 5 });
      customerId = customers.data[0]?.id ?? null;
    }

    if (!customerId) {
      return NextResponse.json({
        synced: false,
        message: "Aucun compte Stripe trouvé pour cet email.",
        debug: { email },
      });
    }

    // Fetch ALL subscriptions for this customer
    const allSubsResult = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
    const allSubs = allSubsResult.data;

    const debugSubs = allSubs.map(s => ({
      id: s.id,
      status: s.status,
      priceId: s.items.data[0]?.price.id,
    }));

    if (allSubs.length === 0) {
      return NextResponse.json({
        synced: false,
        message: "Aucun abonnement trouvé dans Stripe pour ce compte.",
        debug: { customerId, email, subscriptions: [] },
      });
    }

    // Pick best candidate: active > trialing > past_due > incomplete > canceled
    const priority = ["active", "trialing", "past_due", "incomplete", "canceled"];
    let bestSub = allSubs[0]!;
    for (const status of priority) {
      const found = allSubs.find(s => s.status === status);
      if (found) { bestSub = found; break; }
    }

    const priceId = bestSub.items.data[0]?.price.id ?? "";

    await syncSubscriptionFromStripe(
      userId,
      customerId,
      bestSub.id,
      priceId,
      bestSub.status,
      bestSub.items.data[0]?.current_period_start,
      bestSub.items.data[0]?.current_period_end,
    );

    console.log(`[billing/sync] userId=${userId} customerId=${customerId} status=${bestSub.status} priceId=${priceId}`);

    return NextResponse.json({
      synced: true,
      status: bestSub.status,
      priceId,
      message: "Synchronisé avec succès.",
      debug: { customerId, subscriptions: debugSubs },
    });
  } catch (err) {
    console.error("[billing/sync] error:", err);
    return NextResponse.json({ error: "Erreur lors de la synchronisation.", detail: String(err) }, { status: 500 });
  }
}
