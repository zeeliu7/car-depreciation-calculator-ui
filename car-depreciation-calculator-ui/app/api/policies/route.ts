import { NextResponse } from "next/server";
import { callClaudeWithWebSearch } from "@/lib/claude";

export const maxDuration = 60;

const PROMPT = `Search the web for the most impactful current U.S. government policies affecting auto prices. Return a concise markdown summary:

- List up to 5 bullet points covering tariffs, EV incentives, and emissions rules
- Each bullet: **Policy name** — one sentence on its direct price effect
- End with one sentence on the overall near-term market impact

Keep the total response under 200 words.`;

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const result = await callClaudeWithWebSearch(PROMPT, 512);
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
