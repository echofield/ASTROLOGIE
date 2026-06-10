// Client dialogue helper. Memory is local-first: localStorage always holds the
// thread; Supabase mirrors it when configured.

import type { ChatMessage } from "./llm/types";
import { pullMessages, pushMessage } from "./cloud";

const LS = "astrolabe.messages";
export const DAILY_EXCHANGE_LIMIT = 3;

export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function messageDay(m: ChatMessage): string | null {
  if (!m.createdAt) return null;
  const d = new Date(m.createdAt);
  return Number.isNaN(d.getTime()) ? null : dayKey(d);
}

function localGet(): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(LS);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function localSet(msgs: ChatMessage[]): void {
  try {
    window.localStorage.setItem(LS, JSON.stringify(msgs.slice(-100)));
  } catch {}
}

function stamped(m: ChatMessage): ChatMessage {
  return { ...m, createdAt: m.createdAt ?? new Date().toISOString() };
}

/** Load the thread: cloud if available, else local. */
export async function loadMessages(): Promise<ChatMessage[]> {
  const remote = await pullMessages();
  if (remote && remote.length) {
    localSet(remote);
    return remote;
  }
  return localGet();
}

/** Persist one message locally immediately, then cloud best-effort. */
export function appendMessage(m: ChatMessage): ChatMessage {
  const next = stamped(m);
  localSet([...localGet(), next]);
  void pushMessage(next);
  return next;
}

export function clearMessages(): void {
  try {
    window.localStorage.removeItem(LS);
  } catch {}
}

/** The quota belongs to the Genius's REPLIES — journaling is unlimited and free. */
export function exchangesToday(messages: ChatMessage[], day = dayKey()): number {
  return messages.filter((m) => m.role === "assistant" && messageDay(m) === day).length;
}

export function remainingExchanges(messages: ChatMessage[]): number {
  return Math.max(0, DAILY_EXCHANGE_LIMIT - exchangesToday(messages));
}

/** The Genius's lines only (legacy view). */
export function journalEntries(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .filter((m) => m.role === "assistant" && m.content.trim())
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
}

/** The day's record proper: user lines AND Genius lines, newest first. */
export function recordEntries(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .filter((m) => m.content.trim())
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
}

export interface GeniusContext {
  star?: { name: string; must: string; ruler?: string };
  archetype?: { name: string; essence: string };
  natal?: string;
  reach?: { gap: number; days: number; phase: string };
  language?: "English" | "French";
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
