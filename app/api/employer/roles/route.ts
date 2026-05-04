import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const client = new Anthropic();

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
  let query = "";
  try {
    const body = await req.json();
    query = body.query || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ variants: [] });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are a job classification expert. An employer typed this role: "${query}"

Return ONLY valid JSON (no markdown):
{
  "variants": [
    {
      "title": "exact role title with specialization",
      "requiredSkills": ["8-12 core skills that are MUST-HAVE for this role"],
      "optionalSkills": ["5-8 nice-to-have skills"],
      "avgPayMin": hourly rate in cents (e.g. 3400 for $34/hr),
      "avgPayMax": hourly rate in cents (e.g. 6200 for $62/hr),
      "estimatedCandidates": rough number of candidates who might match
    }
  ]
}

Rules:
- Return 3-4 variants that are specializations of the typed role
- E.g. "Design Director" → "Design Director — Advertising/Creative", "Design Director — Construction/Architecture", "Design Director — Product/Tech"
- E.g. "Nurse" → "Registered Nurse — ICU", "Registered Nurse — Pediatrics", "Licensed Practical Nurse", "Nurse Practitioner"
- Required skills should be industry-standard terms
- Optional skills should be differentiators
- Pay estimates should be realistic US market rates
- estimatedCandidates: realistic number (50-500 range)`,
        },
      ],
    });

    let text = (message.content[0] as { type: string; text: string }).text;
    text = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    let parsed: { variants?: { title: string }[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      void logEvent("employer_role_search", {
        query,
        variantCount: 0,
        parseError: true,
        durationMs: Date.now() - startTime,
      });
      return NextResponse.json({ variants: [] });
    }

    void logEvent("employer_role_search", {
      query,
      variantCount: parsed.variants?.length || 0,
      variantTitles: parsed.variants?.map((v) => v.title) || [],
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json(parsed);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown";
    void logEvent("employer_role_search", {
      query,
      error: errMsg,
      durationMs: Date.now() - startTime,
    });
    return NextResponse.json({ variants: [] });
  }
}
