import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { resend, isResendConfigured } from "@/lib/resend";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/recruiter/send-verification
 *
 * Step 1 of the recruiter trust ladder. Captures the work-email +
 * company + role, stores them under a RecruiterVerification row keyed
 * by lowercased work email, creates a one-use VerificationToken, and
 * sends a magic-link email via Resend.
 *
 * When RESEND_API_KEY isn't set, the route returns `{ fallback: true }`
 * and the modal keeps using its localStorage-only demo path so the
 * flow stays unblocked.
 *
 * Body:
 *  {
 *    companyName: string,
 *    recruiterName: string,
 *    workEmail: string,
 *    jobTitle: string,
 *    companyWebsite?: string,
 *  }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyName,
      recruiterName,
      workEmail,
      jobTitle,
      companyWebsite,
    } = body;

    if (
      !companyName?.trim() ||
      !recruiterName?.trim() ||
      !workEmail?.includes("@") ||
      !jobTitle
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const email = workEmail.toLowerCase().trim();

    // Upsert the recruiter row as `pending` even before the email goes
    // out — this is the record of the application, not the verification.
    await prisma.recruiterVerification.upsert({
      where: { workEmail: email },
      create: {
        workEmail: email,
        companyName: companyName.trim(),
        recruiterName: recruiterName.trim(),
        jobTitle,
        companyWebsite: companyWebsite?.trim() || null,
        status: "pending",
      },
      update: {
        companyName: companyName.trim(),
        recruiterName: recruiterName.trim(),
        jobTitle,
        companyWebsite: companyWebsite?.trim() || null,
        // Re-sending leaves a previously-verified recruiter verified.
      },
    });

    // Demo fallback when Resend isn't wired.
    if (!isResendConfigured()) {
      return NextResponse.json({
        ok: true,
        fallback: true,
        message: "Resend not configured — demo path active",
      });
    }

    // Create a one-use token. 24h validity.
    const token = randomBytes(24).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `https://${req.headers.get("host")}`;
    const verifyUrl = `${baseUrl}/api/recruiter/verify?token=${encodeURIComponent(token)}`;

    const from = process.env.RESEND_FROM!;
    await resend.emails.send({
      from,
      to: email,
      subject: "Verify your Skilmatch account",
      text:
        `Hi ${recruiterName.trim()},\n\n` +
        `Click the link below to verify your Skilmatch account so you can ` +
        `contact candidates at ${companyName.trim()}:\n\n` +
        `${verifyUrl}\n\n` +
        `This link is valid for 24 hours. If you didn't request this, you ` +
        `can safely ignore this email.\n\n` +
        `— Skilmatch`,
      html: `
        <p>Hi ${recruiterName.trim()},</p>
        <p>
          Click the button below to verify your Skilmatch account so you can
          contact candidates at <strong>${companyName.trim()}</strong>:
        </p>
        <p>
          <a href="${verifyUrl}" style="
            display: inline-block;
            background: #09C8C8;
            color: white;
            text-decoration: none;
            font-weight: bold;
            padding: 12px 24px;
            border-radius: 24px;
          ">Verify my account</a>
        </p>
        <p style="font-size: 13px; color: #666;">
          Or paste this URL into your browser:<br/>
          <code>${verifyUrl}</code>
        </p>
        <p style="font-size: 12px; color: #999;">
          This link is valid for 24 hours. If you didn't request this, you
          can safely ignore this email.
        </p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "unknown";
    console.error("send-verification error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
