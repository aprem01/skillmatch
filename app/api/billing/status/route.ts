import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/billing/status?email=<recruiterEmail>
 *
 * Server-of-record for "is this recruiter subscribed?" The candidates
 * page calls this before any contact action (Invite / Ask / Hire / Unlock).
 *
 * Returns:
 *   { subscribed: boolean, plan?: string, status?: string, periodEnd?: ISO }
 *
 * A recruiter is considered subscribed when their row has
 * status === "active" (or "trialing"). Cancellations remain "active"
 * until period end so they can use what they've already paid for.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ subscribed: false });
  }

  try {
    const sub = await prisma.subscription.findUnique({
      where: { recruiterEmail: email },
    });
    if (!sub) return NextResponse.json({ subscribed: false });

    const active = sub.status === "active" || sub.status === "trialing";
    return NextResponse.json({
      subscribed: active,
      plan: sub.plan,
      status: sub.status,
      periodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    });
  } catch (error) {
    // DB unreachable etc — don't fail-open, but don't crash the modal either.
    const errMsg = error instanceof Error ? error.message : "db error";
    console.error("Billing status error:", errMsg);
    return NextResponse.json({ subscribed: false, error: errMsg });
  }
}
