// AstroLab — Meaning Layer (ported in spirit from ARCHÉ's meaning.ts).
// The single place where raw signals (ephemeris angles, star state, progress)
// become language. UI imports meaning, never raw numbers.
//
// INVARIANTS (the Genius voice):
//  - Consequence, not instruction. Observe what has shifted; never command.
//  - No numbers, scores, levels, percentages, streaks in user-facing output.
//  - State the present or what has happened, not a future promise.
//  - Gold words for the earned; plain words for the rest.

export const VOICE_RULES = [
  "Consequence, not instruction — observe what shifted, never command.",
  "No numbers, scores, levels, percentages, or streaks.",
  "Present state or what has happened — not a future promise.",
  "Reserve weight for the earned; stay plain elsewhere.",
] as const;

/** Star state → a line that honors the commitment without scoring it. */
export function interpretStar(state: { sealed: boolean; daysSince?: number; tended?: boolean }): string | null {
  if (!state.sealed) return "Your star is not yet sealed.";
  if (state.tended) return "You returned to your star. It holds.";
  const d = state.daysSince ?? 0;
  if (d <= 1) return "The seal is fresh.";
  if (d < 7) return "Your star has kept its place.";
  if (d < 30) return "Time has passed; the star still waits.";
  return "The star has waited long. It remembers.";
}

/** Moon's distance from the sealed star → humanized (never degrees). */
export function interpretMoonGap(deg: number): string {
  const g = ((deg % 360) + 360) % 360;
  if (g < 12) return "The moon stands beside your star.";
  if (g < 60) return "The moon draws near your star.";
  if (g < 120) return "The moon moves toward your star.";
  if (g < 180) return "The moon is far from your star, still turning.";
  return "The moon is on its way back to your star.";
}

/** Territory discovery → consequence, never a count. */
export function interpretDiscovery(found: number, total: number): string {
  if (found <= 0) return "This territory is unexplored.";
  if (found >= total) return "You have walked all of this territory.";
  if (found === 1) return "You found your first artifact here.";
  return "More of this territory has opened to you.";
}

/** A daily shift signal → a soft observation (the Genius's mirror). */
export type ShiftKey = "presence" | "clarity" | "shadow" | "still";
const SHIFT: Record<Exclude<ShiftKey, "still">, string> = {
  presence: "Something in your presence has steadied.",
  clarity: "A thought has grown clearer.",
  shadow: "A shadow has shifted.",
};
export function interpretShift(key: ShiftKey): string | null {
  if (key === "still") return null;
  return SHIFT[key];
}
