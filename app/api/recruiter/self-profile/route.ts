import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/recruiter/self-profile?email=<workEmail>
 * Header: x-skilmatch-login-token: <SKILMATCH_LOGIN_TOKEN>
 *
 * Gated endpoint used by the /login test-helper page to hydrate the
 * full skillmatch_verification localStorage blob. Keeps PII off the
 * public /api/recruiter/status endpoint (which any attacker could
 * enumerate emails against).
 *
 * The shared token is set in Vercel env as SKILMATCH_LOGIN_TOKEN and
 * mirrored client-side as NEXT_PUBLIC_SKILMATCH_LOGIN_TOKEN so the
 * /login page can pass it. It's not a real auth mechanism — it's a
 * "please don't accidentally leak PII via a script kiddie loop"
 * curtain until proper recruiter session auth lands.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").toLowerCase().trim();
  const supplied = req.headers.get("x-skilmatch-login-token") || "";
  const expected = process.env.SKILMATCH_LOGIN_TOKEN || "";
  if (!expected || supplied.length !== expected.length) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!email.includes("@")) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  try {
    const row = await prisma.recruiterVerification.findUnique({
      where: { workEmail: email },
    });
    if (!row) return NextResponse.json({ verified: false });
    return NextResponse.json({
      verified: row.status === "verified",
      status: row.status,
      companyName: row.companyName,
      recruiterName: row.recruiterName,
      jobTitle: row.jobTitle,
      companyWebsite: row.companyWebsite,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "db error";
    console.error("self-profile error:", errMsg);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
