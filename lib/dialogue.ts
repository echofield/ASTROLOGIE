// Client dialogue helper. Memory is local-first: localStorage always holds the
// thread (instant, offline); when Supabase is configured it also syncs there so
// the conversation follows you across devices. The reply comes from the
// provider-agnostic /api/genius/chat route (dormant → null → no reply added).

import type { ChatMessage } from "./llm/types";
import { pullMessages, pushMessage } from "./cloud";

const LS = "astrolabe.messages";

function localGet(): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(LS);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}
function localSet(msgs: ChatMessage[]): void {
  try { window.localStorage.setItem(LS, JSON.stringify(msgs.slice(-100))); } catch {}
}

/** Load the thread — cloud if available, else local. */
export async function loadMessages(): Promise<ChatMessage[]> {
  const remote = await pullMessages();
  if (remote && remote.length) {
    localSet(remote);
    return remote;
  }
  return localGet();
}

/** Persist one message (local immediately, cloud best-effort). */
export function appendMessage(m: ChatMessage): void {
  localSet([...localGet(), m]);
  void pushMessage(m);
}

export interface GeniusContext {
  star?: { name: string; must: string; ruler?: string };
  archetype?: { name: string; essence: string };
  natal?: string;
  reach?: { gap: number; days: number; phase: string };
}

/** Ask the Genius. Returns its reply, or null if the model is dormant/offline. */
export async function askGenius(
  history: ChatMessage[],
  ctx: GeniusContext,
): Promise<string | null> {
  try {
    const res = await fetch("/api/genius/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ history, ...ctx }),
    });
    const data: { reply?: string | null } = await res.json();
    return data?.reply ?? null;
  } catch {
    return null;
  }
}
