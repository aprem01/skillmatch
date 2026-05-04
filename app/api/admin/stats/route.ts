import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Skillmatch admin analytics endpoint.
 *
 * Auth: shared secret in Authorization header or ?key= query param.
 * Set ADMIN_SECRET env var on Vercel.
 *
 * Returns aggregated employer-side stats (role searches + candidate
 * searches) across rolling 24h / 7d / 30d windows.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") || "";
  const queryKey = url.searchParams.get("key") || "";
  const provided = auth.replace(/^Bearer\s+/i, "") || queryKey;
  const secret = process.env.ADMIN_SECRET;

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const cutoffs = {
    "24h": new Date(now - oneDay),
    "7d": new Date(now - 7 * oneDay),
    "30d": new Date(now - 30 * oneDay),
  };

  async function statsForWindow(since: Date) {
    // ─── ROLE SEARCHES ────────────────────────────────────────────
    const roleEvents = await prisma.analyticsEvent.findMany({
      where: {
        event: "employer_role_search",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
    });

    const roleQueryCounts: Record<string, number> = {};
    let roleTotal = 0;
    let roleErrors = 0;
    let roleNoResults = 0;
    let roleDuration = 0;

    for (const ev of roleEvents) {
      let m: Record<string, unknown> = {};
      try {
        m = JSON.parse(ev.metadata || "{}");
      } catch {}
      roleTotal++;
      if (m.error) roleErrors++;
      if (m.variantCount === 0) roleNoResults++;
      roleDuration += (m.durationMs as number) || 0;
      const q = String(m.query || "").toLowerCase().trim();
      if (q) roleQueryCounts[q] = (roleQueryCounts[q] || 0) + 1;
    }

    // ─── CANDIDATE SEARCHES ───────────────────────────────────────
    const candEvents = await prisma.analyticsEvent.findMany({
      where: {
        event: "employer_candidate_search",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
    });

    let candTotal = 0;
    let candErrors = 0;
    let candEmpty = 0;
    let candDuration = 0;
    let totalCandidatesReturned = 0;
    let totalPerfectMatches = 0;
    let totalRequiredSkillCount = 0;
    const candSkillCounts: Record<string, number> = {};
    const recentEmptyCandidateSearches: {
      role?: string;
      skills: string[];
      at: string;
    }[] = [];

    for (const ev of candEvents) {
      let m: Record<string, unknown> = {};
      try {
        m = JSON.parse(ev.metadata || "{}");
      } catch {}
      candTotal++;
      if (m.error) {
        candErrors++;
        continue;
      }
      const cr = (m.candidatesReturned as number) || 0;
      const pm = (m.perfectMatches as number) || 0;
      const skills = (m.requiredSkills as string[]) || [];

      candDuration += (m.durationMs as number) || 0;
      totalCandidatesReturned += cr;
      totalPerfectMatches += pm;
      totalRequiredSkillCount += (m.requiredSkillCount as number) || 0;

      for (const s of skills) {
        candSkillCounts[s] = (candSkillCounts[s] || 0) + 1;
      }

      if (m.isEmpty) {
        candEmpty++;
        if (recentEmptyCandidateSearches.length < 10) {
          recentEmptyCandidateSearches.push({
            role: (m.role as string) || undefined,
            skills: skills.slice(0, 8),
            at: ev.createdAt.toISOString(),
          });
        }
      }
    }

    const topRoleQueries = Object.entries(roleQueryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }));

    const topRequiredSkills = Object.entries(candSkillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill, count]) => ({ skill, count }));

    return {
      roles: {
        total: roleTotal,
        errors: roleErrors,
        noResultRate: roleTotal > 0 ? roleNoResults / roleTotal : 0,
        avgDurationMs: roleTotal > 0 ? Math.round(roleDuration / roleTotal) : 0,
        topQueries: topRoleQueries,
      },
      candidates: {
        total: candTotal,
        errors: candErrors,
        emptyRate: candTotal > 0 ? candEmpty / candTotal : 0,
        avgDurationMs: candTotal > 0 ? Math.round(candDuration / candTotal) : 0,
        avgCandidatesReturned:
          candTotal > 0
            ? Math.round((totalCandidatesReturned / candTotal) * 10) / 10
            : 0,
        avgPerfectMatches:
          candTotal > 0
            ? Math.round((totalPerfectMatches / candTotal) * 10) / 10
            : 0,
        avgRequiredSkillCount:
          candTotal > 0
            ? Math.round((totalRequiredSkillCount / candTotal) * 10) / 10
            : 0,
        topRequiredSkills,
        recentEmptySearches: recentEmptyCandidateSearches,
      },
    };
  }

  const [last24h, last7d, last30d] = await Promise.all([
    statsForWindow(cutoffs["24h"]),
    statsForWindow(cutoffs["7d"]),
    statsForWindow(cutoffs["30d"]),
  ]);

  // All-time event counts (across both apps — they share the DB)
  const eventCounts = await prisma.analyticsEvent.groupBy({
    by: ["event"],
    _count: true,
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    eventCounts,
    windows: { "24h": last24h, "7d": last7d, "30d": last30d },
  });
}
