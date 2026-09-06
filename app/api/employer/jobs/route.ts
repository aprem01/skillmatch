import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { screenInput, BLOCK_MESSAGE_EMPLOYER } from "@/lib/safety";

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

    // Caroline 9/4 Round 9: prohibited-activity screening via the shared
    // safety module (fast-path + protective allowlist + AI context).
    // The role title is screened with the full skill list as context so
    // an innocuous title can't hide illicit required skills, and vice
    // versa. Any block rejects the posting before DB insert.
    const allSkills: string[] = [
      ...(Array.isArray(requiredSkills) ? requiredSkills : []),
      ...(Array.isArray(optionalSkills) ? optionalSkills : []),
    ].filter((t): t is string => typeof t === "string" && t.trim().length > 0);
    const roleScreen = await screenInput({
      input: role,
      context: [...allSkills, ...(description ? [String(description).slice(0, 400)] : [])],
      surface: "employer_role",
    });
    if (roleScreen.verdict !== "allow") {
      return NextResponse.json(
        {
          error: roleScreen.verdict === "block" ? "prohibited_activity" : "needs_clarification",
          message:
            roleScreen.verdict === "block"
              ? BLOCK_MESSAGE_EMPLOYER
              : roleScreen.clarifyPrompt ||
                "Please clarify the legitimate work this role describes before posting.",
        },
        { status: 422 }
      );
    }
    // Screen each skill individually with the role + other skills as context.
    for (const sk of allSkills) {
      const r = await screenInput({
        input: sk,
        context: [role, ...allSkills.filter((x) => x !== sk)],
        surface: "employer_skill",
        skipAI: true, // fast-path only per-skill; role screen above already ran AI
      });
      if (r.verdict === "block") {
        return NextResponse.json(
          { error: "prohibited_activity", message: BLOCK_MESSAGE_EMPLOYER },
          { status: 422 }
        );
      }
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
