// Provider-agnostic LLM seam. The Genius's brain is a config choice, never a
// hard dependency — swap the implementation in lib/llm/index.ts and nothing
// else changes. (No SDK imports here, so this file is safe to import anywhere.)

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export interface CompleteOptions {
  system: string;
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** Adaptive thinking (Opus 4.6+/Fable). Off unless set — Opus runs without it by default. */
  thinking?: boolean;
  /** Reasoning depth for thinking models. Not supported on Haiku — leave unset there. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
}

export interface LLMProvider {
  name: string;
  complete(opts: CompleteOptions): Promise<string>;
}

export type ProviderName = "anthropic" | "openai" | "local";
