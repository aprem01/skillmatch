import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Caroline 8/26 Round 8 global rule: prohibited-activity screening on
// employer job postings. Same regex list as PayRanker's normalize
// endpoint — kept inline (rather than shared) so the two products stay
// deployable independently. If either the title, description, or any
// required/optional skill matches, the job is rejected with a 422.
const PROHIBITED_JOB_PATTERNS: RegExp[] = [
  /\b(drug|narcotics?|cocaine|meth|heroin|fentanyl|opioid)\s+(dealing|dealer|trafficking|selling|distribution)\b/i,
  /\bdrug\s+trafficker\b/i,
  /\bhuman\s+trafficking\b/i,
  /\bsex\s+trafficking\b/i,
  /\bchild\s+(exploitation|pornography|trafficking)\b/i,
  /\b(pimp(ing)?|prostitut(ion|e)|brothel|escort\s+(service|agency))\b/i,
  /\b(hit\s*man|contract\s+killing|murder\s+for\s+hire)\b/i,
  /\b(money\s+laundering|racket(eering)?)\b/i,
  /\bille?gal\s+(arms?|weapons?|firearms?)\s+(dealing|trafficking|sales?)\b/i,
  /\b(fraud|scam|ponzi|pyramid)\s+scheme\b/i,
];

function hasProhibitedContent(text: string): boolean {
  return PROHIBITED_JOB_PATTERNS.some((rx) => rx.test(text));
}

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

    // Caroline 8/26 Round 8: prohibited-activity screening. Scan the
    // title, description, and every required/optional skill. Any hit
    // rejects the posting with a neutral message.
    const screenTexts: string[] = [role, description || ""];
    if (Array.isArray(requiredSkills)) screenTexts.push(...requiredSkills);
    if (Array.isArray(optionalSkills)) screenTexts.push(...optionalSkills);
    if (screenTexts.some((t) => typeof t === "string" && hasProhibitedContent(t))) {
      return NextResponse.json(
        {
          error: "prohibited_activity",
          message:
            "This posting can't be published on Skilmatch because it references an activity we don't support. Please revise the role, description, or required skills.",
        },
        { status: 422 }
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
