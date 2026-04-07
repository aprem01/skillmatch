import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma"; // for future real queries

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { requiredSkills, optionalSkills } = await req.json();

  // MVP: generate mock candidates based on the required skills
  // In production: query UserSkill table to find real matches

  const mockCandidates = generateMockCandidates(
    requiredSkills || [],
    optionalSkills || []
  );

  return NextResponse.json({ candidates: mockCandidates });
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
