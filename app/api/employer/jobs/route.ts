import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/employer/jobs?email=<recruiterEmail>&status=open|closed
 *
 * Returns the recruiter's jobs (open by default). Powers the
 * Skilmatch dashboard, which used to render hardcoded fixture data.
 *
 * Falls back to a demo recruiter when no email is provided so /dashboard
 * still has something to render for unauthenticated demo browsers.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "sarah@demo.attendhomecare.com")
    .toLowerCase()
    .trim();
  const status = url.searchParams.get("status") === "closed" ? "closed" : "open";

  try {
    const jobs = await prisma.job.findMany({
      where: {
        recruiterEmail: email,
        isActive: status === "open",
      },
      include: {
        requiredSkills: { select: { normalizedTerm: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { postedAt: "desc" },
    });

    const shaped = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      employer: j.employer,
      location: j.location,
      vertical: j.vertical,
      payMin: j.payMin,
      payMax: j.payMax,
      payType: j.payType,
      shiftType: j.shiftType,
      postedAt: j.postedAt.toISOString(),
      closedAt: j.closedAt?.toISOString() ?? null,
      closedReason: j.closedReason,
      requiredSkills: j.requiredSkills.map((s) => s.normalizedTerm),
      optionalSkills: j.optionalSkills,
      applicationCount: j._count.applications,
    }));

    return NextResponse.json({ jobs: shaped, count: shaped.length });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "unknown";
    console.error("list jobs error:", errMsg);
    return NextResponse.json({ jobs: [], count: 0, error: errMsg });
  }
}

/**
 * POST /api/employer/jobs
 *
 * Persists a new Job row + its required skills. Called by /post-job
 * on submission so the dashboard sees the new posting.
 *
 * Body:
 *   {
 *     recruiterEmail: string,
 *     role: string,
 *     location: string,
 *     vertical?: string,
 *     description?: string,
 *     payMin: number (hourly cents),
 *     payMax: number (hourly cents),
 *     payType: "hourly" | "salary" | "contract",
 *     shiftType: string,
 *     requiredSkills: string[],
 *     optionalSkills: string[],
 *   }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      recruiterEmail,
      role,
      employer,
      location,
      vertical,
      description,
      payMin,
      payMax,
      payType,
      shiftType,
      requiredSkills,
      optionalSkills,
    } = body;

    if (!recruiterEmail || !role || !location) {
      return NextResponse.json(
        { error: "recruiterEmail, role, location required" },
        { status: 400 }
      );
    }

    const created = await prisma.job.create({
      data: {
        title: role,
        employer: employer || "Your Company",
        location,
        vertical: vertical || "other",
        description: description || "",
        payMin: typeof payMin === "number" ? payMin : 1500,
        payMax: typeof payMax === "number" ? payMax : 2500,
        payType: payType || "hourly",
        shiftType: shiftType || "full_time",
        isActive: true,
        recruiterEmail: recruiterEmail.toLowerCase().trim(),
        optionalSkills: Array.isArray(optionalSkills) ? optionalSkills : [],
      },
    });

    if (Array.isArray(requiredSkills) && requiredSkills.length > 0) {
      await prisma.jobSkill.createMany({
        data: requiredSkills.map((s: string) => ({
          jobId: created.id,
          normalizedTerm: s,
          proficiencyLevel: "intermediate",
          isRequired: true,
        })),
      });
    }

    return NextResponse.json({ ok: true, jobId: created.id });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "unknown";
    console.error("create job error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
