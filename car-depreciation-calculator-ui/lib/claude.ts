import Anthropic from "@anthropic-ai/sdk";

type TextBlock = Anthropic.TextBlock;

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n")
    .trim();
}

/**
 * Call Claude with the web_search_20250305 built-in tool.
 * Anthropic executes searches entirely server-side in a single API call —
 * no client-side tool-use loop is needed.
 */
export async function callClaudeWithWebSearch(prompt: string, maxTokens = 768): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    tools: [{ type: "web_search_20250305", name: "web_search" }] as unknown as Anthropic.Tool[],
    messages: [{ role: "user", content: prompt }],
  });

  return extractText(response.content);
}

/**
 * Call Claude without web search for the final synthesis step.
 */
export async function callClaude(prompt: string, maxTokens = 1024): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  return extractText(response.content);
}
