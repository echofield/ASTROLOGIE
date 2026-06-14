// The model selector. `getProvider()` returns the configured brain, or null if
// none is set up (so callers fall back to templated text). Default is Anthropic
// (Claude — best voice), chosen via GENIUS_PROVIDER. Add OpenAI / local impls
// here later without touching any caller.

import Anthropic from "@anthropic-ai/sdk";
import type { CompleteOptions, LLMProvider, ProviderName } from "./types";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  private client: Anthropic;
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }
  async complete(opts: CompleteOptions): Promise<string> {
    const msg = await this.client.messages.create({
      model: opts.model || process.env.GENIUS_MODEL || DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? 300,
      // temperature only when set — some models (Opus 4.8) reject the param entirely
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      // adaptive thinking — opt-in: Opus omits it by default, unlike Fable's always-on
      ...(opts.thinking ? { thinking: { type: "adaptive" as const } } : {}),
      // effort depth — Opus/Sonnet 4.6+ only; never set on the Haiku default (it 400s)
      ...(opts.effort ? { output_config: { effort: opts.effort } } : {}),
      // cache the standing persona across calls (prompt caching) — impl detail
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    return msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();
  }
}

export function getProvider(): LLMProvider | null {
  const which = (process.env.GENIUS_PROVIDER as ProviderName) || "anthropic";
  if (which === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    return key ? new AnthropicProvider(key) : null;
  }
  // openai / local impls slot in here later — same interface, no caller changes.
  return null;
}
