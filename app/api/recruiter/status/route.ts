import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/recruiter/status?email=...
 *
 * Server-of-record for "is this recruiter verified?" Used by the
 * candidates page to refresh the cached verification state after the
 * magic-link redirect (?verified=1).
 *
 * Returns: { verified: boolean, status?: "pending" | "verified" }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ verified: false });
  }

  try {
    const row = await prisma.recruiterVerification.findUnique({
      where: { workEmail: email },
    });
    if (!row) return NextResponse.json({ verified: false });
    // Include the persisted profile fields so /login can populate the
    // full skillmatch_verification localStorage blob in one round trip.
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
    console.error("recruiter status error:", errMsg);
    return NextResponse.json({ verified: false, error: "Internal error" });
  }
}
