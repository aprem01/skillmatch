import { NextResponse } from "next/server";
import { stripe, PRICE_BY_PLAN, isStripeConfigured, type Plan } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/checkout
 *
 * Body: { plan: "starter" | "growth" | "scale", email: string }
 *
 * Creates a Stripe Checkout Session for the chosen plan and returns the
 * hosted-checkout URL. Caller (SubscriptionModal) redirects the browser
 * to it.
 *
 * If Stripe isn't configured (missing env vars), returns the legacy
 * localStorage-only path so the demo doesn't break — the modal will
 * still mark the user as subscribed client-side. This lets us deploy
 * the code before the Stripe dashboard is fully provisioned.
 */
export async function POST(req: Request) {
  try {
    const { plan, email } = (await req.json()) as { plan: Plan; email: string };

    if (!plan || !["starter", "growth", "scale"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Recruiter email is required" }, { status: 400 });
    }

    // Graceful fallback when Stripe isn't wired yet — keep the demo working.
    if (!isStripeConfigured()) {
      return NextResponse.json({ url: null, fallback: "localStorage" });
    }

    const price = PRICE_BY_PLAN[plan];
    if (!price) {
      return NextResponse.json(
        { error: `No Stripe price configured for plan "${plan}"` },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `https://${req.headers.get("host")}`;

    // Reuse the existing Stripe customer for this recruiter email if we
    // have one, otherwise let Checkout create a new one. The webhook
    // associates the resulting Customer ID back to our Subscription row.
    const existing = await prisma.subscription.findUnique({
      where: { recruiterEmail: email.toLowerCase().trim() },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${baseUrl}/candidates?subscribed=1`,
      cancel_url: `${baseUrl}/candidates?subscribed=0`,
      ...(existing?.stripeCustomerId
        ? { customer: existing.stripeCustomerId }
        : { customer_email: email }),
      // Carry the recruiter email through so the webhook can key on it
      // even if the Customer wasn't pre-created.
      metadata: { recruiterEmail: email.toLowerCase().trim(), plan },
      subscription_data: {
        metadata: { recruiterEmail: email.toLowerCase().trim(), plan },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Checkout error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
