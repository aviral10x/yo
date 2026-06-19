import Anthropic from "@anthropic-ai/sdk";

export const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY;

/**
 * Model tiers for cost control (IMPLEMENTATION_PLAN.md §7): haiku for
 * high-volume drafts/tagging, sonnet for quotes/copy, opus for the hardest
 * reasoning (e.g. audit synthesis).
 */
export const MODELS = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-8",
} as const;

export type ModelTier = keyof typeof MODELS;

let _client: Anthropic | undefined;

export function getAnthropic(): Anthropic {
  if (!_client) {
    if (!anthropicConfigured) throw new Error("ANTHROPIC_API_KEY is not set");
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _client;
}

/**
 * Generate a single text draft. Everything in VenuePilot is human-in-the-loop:
 * the owner reviews/edits before anything is sent. Bilingual (EN/HI) is handled
 * via the system prompt by the caller.
 */
export async function draftText(opts: {
  prompt: string;
  system?: string;
  tier?: ModelTier;
  maxTokens?: number;
}): Promise<string> {
  const { prompt, system, tier = "haiku", maxTokens = 1024 } = opts;
  const message = await getAnthropic().messages.create({
    model: MODELS[tier],
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  return message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
}

/**
 * Generate a structured object via Claude tool-use (forced tool_choice), so the
 * model must return JSON matching `schema` (a JSON Schema object). This is the
 * robust way to get typed output — validation happens at the tool layer.
 */
export async function generateObject<T>(opts: {
  prompt: string;
  schema: Record<string, unknown>;
  toolName: string;
  toolDescription: string;
  system?: string;
  tier?: ModelTier;
  maxTokens?: number;
}): Promise<T> {
  const {
    prompt,
    schema,
    toolName,
    toolDescription,
    system,
    tier = "sonnet",
    maxTokens = 2048,
  } = opts;
  const message = await getAnthropic().messages.create({
    model: MODELS[tier],
    max_tokens: maxTokens,
    system,
    tools: [
      {
        name: toolName,
        description: toolDescription,
        input_schema: schema as never,
      },
    ],
    tool_choice: { type: "tool", name: toolName },
    messages: [{ role: "user", content: prompt }],
  });
  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Model did not return structured output");
  }
  return toolUse.input as T;
}
