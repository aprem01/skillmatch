import { NextResponse } from "next/server";
import {
  classifySkillCluster,
  needsIndustryClarification,
} from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

/**
 * POST /api/skills/clarify
 *
 * Server-side wrapper around the cluster classifier + clarification
 * check. Keeps the 900KB+ O*NET taxonomy on the server (the post-job
 * page used to import classifySkillCluster directly and the entire
 * taxonomy shipped to the browser).
 *
 * Body: { skill: string, basket: string[] }
 *   - basket is the existing required + optional skills already in the
 *     recruiter's role. We classify it to derive the industry anchor
 *     for this clarification check.
 * Returns: { candidates: string[] | null }
 */
export async function POST(req: Request) {
  try {
    const { skill, basket } = await req.json();
    if (typeof skill !== "string" || !skill.trim()) {
      return NextResponse.json({ candidates: null });
    }
    const safeBasket = Array.isArray(basket) ? basket : [];
    const anchor = classifySkillCluster(safeBasket).industry;
    const candidates = needsIndustryClarification(skill.trim(), anchor);
    return NextResponse.json({ candidates });
  } catch {
    return NextResponse.json({ candidates: null });
  }
}
