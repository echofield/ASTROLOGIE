import type { Stage } from "./types";

export const KEEPER_AT = 1; // first sealed passage
export const MYTHMAKER_AT = 5; // the constellation starts to mean something

const STAGES: Stage[] = [
  { id: "witness", index: 1, title: "Witness", motto: "The sky is alive." },
  { id: "keeper", index: 2, title: "Keeper", motto: "I tend the windows." },
  { id: "mythmaker", index: 3, title: "Mythmaker", motto: "My sky is a map of who I became." },
];

export function stageForSealed(count: number): Stage {
  if (count >= MYTHMAKER_AT) return STAGES[2];
  if (count >= KEEPER_AT) return STAGES[1];
  return STAGES[0];
}

/** Passages remaining until the next stage, or null at the top. */
export function toNextStage(count: number): { remaining: number; next: Stage } | null {
  if (count < KEEPER_AT) return { remaining: KEEPER_AT - count, next: STAGES[1] };
  if (count < MYTHMAKER_AT) return { remaining: MYTHMAKER_AT - count, next: STAGES[2] };
  return null;
}
