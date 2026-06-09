import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifySkillCluster } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

interface Candidate {
  handle: string;
  matchScore: number;
  matchedRequired: string[];
  matchedOptional: string[];
  missingRequired: string[];
  missingOptional: string[];
  totalRequired: number;
  totalOptional: number;
  /** "real" = pulled from UserSkill table; "mock" = generated for demo */
  source: "real" | "mock";
}

/** Fire-and-forget analytics log — never blocks user response */
async function logEvent(event: string, metadata: Record<string, unknown>) {
  try {
    await prisma.analyticsEvent.create({
      data: { event, metadata: JSON.stringify(metadata) },
    });
  } catch {
    // analytics never blocks the user flow
  }
}

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const { requiredSkills, optionalSkills, role } = await req.json();
    const required: string[] = requiredSkills || [];
    const optional: string[] = optionalSkills || [];

    // ── Real candidates first (Caroline 5/22 → fundable demo) ──────
    // Query the shared UserSkill pool. We match normalizedTerm
    // case-insensitively against the union of required + optional skills,
    // group by anonymousHandle, then score each user against the basket.
    const realCandidates = await queryRealCandidates(required, optional);

    // Fall back to mock data ONLY when the pool is empty (early traffic).
    // This keeps the demo working while we onboard real users; once we
    // have ≥1 matching user, every recruiter sees real candidates.
    const candidates: Candidate[] =
      realCandidates.length > 0
        ? realCandidates
        : generateMockCandidates(required, optional);

    // Cluster check on the recruiter's basket. Surfaces industry-incoherent
    // searches (e.g. "Solar Panel Installation" + "Patient Care") in
    // analytics so we can spot bad rolldefs early.
    const cluster = classifySkillCluster([...required, ...optional]);

    void logEvent("employer_candidate_search", {
      role: role || null,
      requiredSkillCount: required.length,
      optionalSkillCount: optional.length,
      requiredSkills: required.slice(0, 12),
      candidatesReturned: candidates.length,
      realCandidatesCount: realCandidates.length,
      perfectMatches: candidates.filter((c) => c.matchScore >= 90).length,
      clusterIndustry: cluster.industry,
      clusterConfidence: cluster.confidence,
      clusterOutliers: cluster.outliers,
      clusterUnknown: cluster.unknown,
      durationMs: Date.now() - startTime,
      isEmpty: candidates.length === 0,
      source: realCandidates.length > 0 ? "real" : "mock",
    });

    return NextResponse.json({
      candidates,
      cluster: {
        industry: cluster.industry,
        confidence: cluster.confidence,
      },
      source: realCandidates.length > 0 ? "real" : "mock",
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown";
    void logEvent("employer_candidate_search", {
      error: errMsg,
      durationMs: Date.now() - startTime,
    });
    return NextResponse.json({ candidates: [] });
  }
}

/**
 * Real candidates from the shared PayRanker user pool.
 *
 * Implementation: pull every UserSkill row whose normalizedTerm matches a
 * basket skill (case-insensitive via lowercased compare in JS — Prisma
 * `mode: insensitive` is Postgres-only and works, but doing it in code
 * keeps the query simple and works if anyone runs this against SQLite
 * locally). Group by user, score, sort, take top 50.
 *
 * Users without an anonymousHandle are excluded — they haven't completed
 * the profile step so they're not contactable.
 */
async function queryRealCandidates(
  required: string[],
  optional: string[]
): Promise<Candidate[]> {
  if (required.length === 0 && optional.length === 0) return [];

  const basket = [...required, ...optional];
  const basketLower = new Set(basket.map((s) => s.toLowerCase()));

  // Find every UserSkill that matches one of the basket terms.
  // Pull the user's anonymousHandle alongside.
  const userSkills = await prisma.userSkill.findMany({
    where: {
      normalizedTerm: {
        in: basket,
        mode: "insensitive",
      },
      user: {
        anonymousHandle: { not: null },
      },
    },
    select: {
      normalizedTerm: true,
      user: {
        select: { anonymousHandle: true },
      },
    },
  });

  // Group by handle, then collect each candidate's matched skills.
  const byHandle = new Map<string, Set<string>>();
  for (const row of userSkills) {
    const handle = row.user.anonymousHandle;
    if (!handle) continue;
    const lower = row.normalizedTerm.toLowerCase();
    if (!basketLower.has(lower)) continue;
    if (!byHandle.has(handle)) byHandle.set(handle, new Set());
    byHandle.get(handle)!.add(lower);
  }

  const requiredLower = required.map((s) => s.toLowerCase());
  const optionalLower = optional.map((s) => s.toLowerCase());

  const candidates: Candidate[] = [];
  byHandle.forEach((skillSet, handle) => {
    const matchedRequired = required.filter((s) =>
      skillSet.has(s.toLowerCase())
    );
    const matchedOptional = optional.filter((s) =>
      skillSet.has(s.toLowerCase())
    );
    const reqScore = required.length > 0 ? matchedRequired.length / required.length : 0;
    const optScore = optional.length > 0 ? matchedOptional.length / optional.length : 0;
    const matchScore = Math.round((reqScore * 0.7 + optScore * 0.3) * 100);

    candidates.push({
      handle,
      matchScore,
      matchedRequired,
      matchedOptional,
      missingRequired: required.filter(
        (s) => !skillSet.has(s.toLowerCase())
      ),
      missingOptional: optional.filter(
        (s) => !skillSet.has(s.toLowerCase())
      ),
      totalRequired: required.length,
      totalOptional: optional.length,
      source: "real",
    });
    void requiredLower; void optionalLower; // referenced for clarity above
  });

  candidates.sort((a, b) => b.matchScore - a.matchScore);
  return candidates.slice(0, 50);
}

function generateMockCandidates(required: string[], optional: string[]): Candidate[] {
  // Generate syllable-based handles like PayRanker
  const syllables = [
    "kee","joo","mee","too","noo","bee","zee","loo","poo","roo",
    "ka","to","bu","mi","ze","ri",
  ];
  function handle() {
    const s1 = syllables[Math.floor(Math.random() * syllables.length)];
    const s2 = syllables[Math.floor(Math.random() * syllables.length)];
    return `${s1}${s2}${Math.floor(100 + Math.random() * 900)}`;
  }

  const count = Math.min(required.length * 15, 200);
  const candidates: Candidate[] = [];

  for (let i = 0; i < count; i++) {
    const reqMatchRate =
      i < count * 0.2 ? 1.0 : i < count * 0.5 ? 0.85 : 0.7;
    const optMatchRate = Math.random() * 0.6 + 0.1;

    const matchedRequired = required.filter(() => Math.random() < reqMatchRate);
    const matchedOptional = optional.filter(() => Math.random() < optMatchRate);

    const reqScore =
      required.length > 0 ? matchedRequired.length / required.length : 0;
    const optScore =
      optional.length > 0 ? matchedOptional.length / optional.length : 0;
    const totalScore = Math.round((reqScore * 0.7 + optScore * 0.3) * 100);

    candidates.push({
      handle: handle(),
      matchScore: totalScore,
      matchedRequired,
      matchedOptional,
      missingRequired: required.filter((s) => !matchedRequired.includes(s)),
      missingOptional: optional.filter((s) => !matchedOptional.includes(s)),
      totalRequired: required.length,
      totalOptional: optional.length,
      source: "mock",
    });
  }

  candidates.sort((a, b) => b.matchScore - a.matchScore);
  return candidates.slice(0, 50);
}
