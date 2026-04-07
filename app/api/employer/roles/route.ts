import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const client = new Anthropic();

export async function POST(req: Request) {
  const { query } = await req.json();

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

  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ variants: [] });
  }
}
