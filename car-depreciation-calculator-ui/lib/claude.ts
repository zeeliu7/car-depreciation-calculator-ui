import Anthropic from "@anthropic-ai/sdk";

type MessageParam = Anthropic.MessageParam;
type TextBlock = Anthropic.TextBlock;
type ToolUseBlock = Anthropic.ToolUseBlock;

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n")
    .trim();
}

/**
 * Call Claude with the web_search_20250305 built-in tool.
 * Anthropic executes searches server-side; we handle the tool-use loop
 * to allow the model to make multiple searches before producing a final answer.
 */
export async function callClaudeWithWebSearch(prompt: string, maxTokens = 768): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const messages: MessageParam[] = [{ role: "user", content: prompt }];

  for (let turn = 0; turn < 10; turn++) {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      // web_search_20250305 is a server-side built-in tool; Anthropic executes searches automatically
      tools: [{ type: "web_search_20250305", name: "web_search" }] as unknown as Anthropic.Tool[],
      messages,
    });

    if (response.stop_reason === "end_turn") {
      return extractText(response.content);
    }

    if (response.stop_reason === "tool_use") {
      // Add the full assistant turn (may include server-provided search result blocks)
      messages.push({ role: "assistant", content: response.content });

      // If the response doesn't already embed tool results (server handled them),
      // provide empty tool_result blocks so the model can continue.
      const toolUses = response.content.filter(
        (b): b is ToolUseBlock => b.type === "tool_use"
      );
      const hasEmbeddedResults = response.content.some(
        (b) => (b as { type: string }).type === "web_search_tool_result"
      );

      if (toolUses.length > 0 && !hasEmbeddedResults) {
        messages.push({
          role: "user",
          content: toolUses.map((t) => ({
            type: "tool_result" as const,
            tool_use_id: t.id,
            content: "",
          })),
        });
      }

      // If there's already substantive text in this turn, return it
      const text = extractText(response.content);
      if (text.length > 100) return text;
    }
  }

  return "Unable to complete analysis.";
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
