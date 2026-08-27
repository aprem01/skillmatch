import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/employer/interview-request
 *
 * Caroline 8/23 Round 8 P03 gate. Employer sends an interview request
 * to a candidate. The Application row transitions to
 * status:"interview_requested". PayRanker will surface it in the
 * candidate's Messages and require the candidate to complete their
 * verified profile (first name, last name, phone, work auth) before
 * they can accept.
 *
 * Body:
 *   { recruiterEmail: string, handle: string, jobId: string, message?: string }
 *
 * We do NOT yet require a real auth handshake — this MVP endpoint
 * trusts the recruiterEmail bound to the Job row. That's a temporary
 * shortcut noted in the follow-up list.
 */
export async function POST(req: Request) {
  try {
    const { recruiterEmail, handle, jobId, message } = await req.json();
    if (!recruiterEmail || !handle || !jobId) {
      return NextResponse.json(
        { error: "recruiterEmail, handle, jobId required" },
        { status: 400 }
      );
    }
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        recruiterEmail: (recruiterEmail as string).toLowerCase().trim(),
      },
    });
    if (!job) {
      return NextResponse.json(
        { error: "job not found or not owned by this recruiter" },
        { status: 404 }
      );
    }
    const candidate = await prisma.user.findUnique({
      where: { anonymousHandle: handle as string },
    });
    if (!candidate) {
      return NextResponse.json({ error: "candidate not found" }, { status: 404 });
    }

    // If the candidate already has an Application row for this job we
    // update it; otherwise we create a fresh one. Either way we set the
    // status to interview_requested.
    const existing = await prisma.application.findFirst({
      where: { userId: candidate.id, jobId: job.id },
    });
    const app = existing
      ? await prisma.application.update({
          where: { id: existing.id },
          data: { status: "interview_requested" },
        })
      : await prisma.application.create({
          data: {
            userId: candidate.id,
            jobId: job.id,
            status: "interview_requested",
          },
        });

    try {
      await prisma.analyticsEvent.create({
        data: {
          event: "employer_interview_requested",
          metadata: JSON.stringify({
            recruiterEmail,
            candidateHandle: handle,
            jobId: job.id,
            applicationId: app.id,
            hasMessage: !!message,
          }),
        },
      });
    } catch {}

    return NextResponse.json({ ok: true, applicationId: app.id });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "unknown";
    console.error("interview-request error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
