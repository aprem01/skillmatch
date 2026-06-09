import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/webhook
 *
 * Stripe sends every subscription lifecycle event here. We persist them
 * into the Subscription table so /api/billing/status can answer
 * "is this recruiter subscribed?" without ever talking to Stripe.
 *
 * Configure in Stripe dashboard:
 *   Endpoint URL: https://<your-host>/api/billing/webhook
 *   Listen for: checkout.session.completed,
 *               customer.subscription.updated,
 *               customer.subscription.deleted
 *   Copy the signing secret into STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    const err = e instanceof Error ? e.message : "bad signature";
    console.error("Stripe webhook verification failed:", err);
    return NextResponse.json({ error: err }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email =
          session.metadata?.recruiterEmail?.toLowerCase().trim() ||
          session.customer_email?.toLowerCase().trim();
        const plan = (session.metadata?.plan || "growth") as
          | "starter"
          | "growth"
          | "scale";
        const customerId =
          typeof session.customer === "string" ? session.customer : null;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;
        if (!email) break;

        await prisma.subscription.upsert({
          where: { recruiterEmail: email },
          create: {
            recruiterEmail: email,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan,
            status: "active",
          },
          update: {
            stripeCustomerId: customerId ?? undefined,
            stripeSubscriptionId: subscriptionId ?? undefined,
            plan,
            status: "active",
          },
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : null;
        if (!customerId) break;

        // Find by stripeCustomerId (set on first checkout)
        const existing = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        });
        if (!existing) break;

        // Stripe v22 moved current_period_end onto the first subscription
        // item rather than the top-level Subscription. Read it from there.
        const periodEndSec = sub.items?.data?.[0]?.current_period_end;
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status: sub.status,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodEnd: periodEndSec
              ? new Date(periodEndSec * 1000)
              : null,
            stripeSubscriptionId: sub.id,
          },
        });
        break;
      }

      default:
        // ignore unhandled events; Stripe expects 2xx anyway
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "unknown";
    console.error("Webhook handler error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
