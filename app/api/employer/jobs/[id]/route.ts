import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/employer/jobs/[id]
 *
 * Caroline 6/27 Round 4: manual close-job with reason capture.
 * Also used for editing other job fields if needed.
 *
 * Body shapes:
 *   { action: "close", reason: string }
 *   { action: "reopen" }
 *   { title?, payMin?, payMax?, location?, description? } — partial edit
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { action, reason, ...rest } = body;

    if (action === "close") {
      if (!reason || typeof reason !== "string") {
        return NextResponse.json(
          { error: "reason required when closing" },
          { status: 400 }
        );
      }
      await prisma.job.update({
        where: { id: params.id },
        data: {
          isActive: false,
          closedAt: new Date(),
          closedReason: reason,
        },
      });
      // Analytics: capture the close + reason for the product loop.
      await prisma.analyticsEvent
        .create({
          data: {
            event: "employer_job_closed",
            metadata: JSON.stringify({
              jobId: params.id,
              reason,
            }),
          },
        })
        .catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (action === "reopen") {
      await prisma.job.update({
        where: { id: params.id },
        data: { isActive: true, closedAt: null, closedReason: null },
      });
      return NextResponse.json({ ok: true });
    }

    // Partial edit
    const allowed: Record<string, unknown> = {};
    for (const k of [
      "title",
      "payMin",
      "payMax",
      "location",
      "description",
      "shiftType",
    ]) {
      if (rest[k] !== undefined) allowed[k] = rest[k];
    }
    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "no editable fields" }, { status: 400 });
    }
    await prisma.job.update({ where: { id: params.id }, data: allowed });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "unknown";
    console.error("PATCH job error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
