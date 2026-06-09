import { NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Customer Portal session so the recruiter can manage
 * their subscription — update payment method, change plan, cancel,
 * see invoices. We don't build any of that UI ourselves; Stripe hosts it.
 *
 * Body: { email: string }
 *
 * Returns: { url: string } — redirect target for the hosted portal.
 */
export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email: string };
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Recruiter email required" }, { status: 400 });
    }
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 501 }
      );
    }

    const sub = await prisma.subscription.findUnique({
      where: { recruiterEmail: email.toLowerCase().trim() },
    });
    if (!sub?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer on file — subscribe first" },
        { status: 404 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `https://${req.headers.get("host")}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "unknown";
    console.error("portal error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
