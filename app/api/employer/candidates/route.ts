import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

    // MVP: generate mock candidates based on the required skills
    // In production: query UserSkill table to find real matches
    const mockCandidates = generateMockCandidates(
      requiredSkills || [],
      optionalSkills || []
    );

    void logEvent("employer_candidate_search", {
      role: role || null,
      requiredSkillCount: (requiredSkills || []).length,
      optionalSkillCount: (optionalSkills || []).length,
      requiredSkills: (requiredSkills || []).slice(0, 12),
      candidatesReturned: mockCandidates.length,
      perfectMatches: mockCandidates.filter((c) => c.matchScore >= 90).length,
      durationMs: Date.now() - startTime,
      isEmpty: mockCandidates.length === 0,
    });

    return NextResponse.json({ candidates: mockCandidates });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown";
    void logEvent("employer_candidate_search", {
      error: errMsg,
      durationMs: Date.now() - startTime,
    });
    return NextResponse.json({ candidates: [] });
  }
}

function generateMockCandidates(required: string[], optional: string[]) {
  // Generate syllable-based handles like PayRanker
  const syllables = [
    "kee",
    "joo",
    "mee",
    "too",
    "noo",
    "bee",
    "zee",
    "loo",
    "poo",
    "roo",
    "ka",
    "to",
    "bu",
    "mi",
    "ze",
    "ri",
  ];
  function handle() {
    const s1 = syllables[Math.floor(Math.random() * syllables.length)];
    const s2 = syllables[Math.floor(Math.random() * syllables.length)];
    return `${s1}${s2}${Math.floor(100 + Math.random() * 900)}`;
  }

  const count = Math.min(required.length * 15, 200);
  const candidates = [];

  for (let i = 0; i < count; i++) {
    // Vary match quality: some match all, some match most
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
    });
  }

  // Sort by match score descending
  candidates.sort((a, b) => b.matchScore - a.matchScore);

  return candidates.slice(0, 50); // Return top 50
}
