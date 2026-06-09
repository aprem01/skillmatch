import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/recruiter/verify?token=...
 *
 * Magic-link handler. The recruiter clicks the link in the email we
 * sent from /api/recruiter/send-verification, this route validates the
 * token, marks the RecruiterVerification as verified, deletes the
 * (one-use) token, and 302-redirects back to /candidates?verified=1
 * so the modal flow picks back up.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    `https://${req.headers.get("host")}`;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/candidates?verified=0&reason=missing_token`);
  }

  try {
    const row = await prisma.verificationToken.findUnique({
      where: { token },
    });
    if (!row) {
      return NextResponse.redirect(
        `${baseUrl}/candidates?verified=0&reason=invalid_token`
      );
    }
    if (row.expires.getTime() < Date.now()) {
      // Token expired — clean it up so the table doesn't bloat.
      await prisma.verificationToken
        .delete({ where: { token } })
        .catch(() => {});
      return NextResponse.redirect(
        `${baseUrl}/candidates?verified=0&reason=expired`
      );
    }

    const email = row.identifier.toLowerCase().trim();
    await prisma.recruiterVerification.update({
      where: { workEmail: email },
      data: { status: "verified", verifiedAt: new Date() },
    });
    // One-use: drop the token regardless of outcome
    await prisma.verificationToken
      .delete({ where: { token } })
      .catch(() => {});

    return NextResponse.redirect(
      `${baseUrl}/candidates?verified=1&email=${encodeURIComponent(email)}`
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "unknown";
    console.error("verify error:", errMsg);
    return NextResponse.redirect(`${baseUrl}/candidates?verified=0&reason=server_error`);
  }
}
