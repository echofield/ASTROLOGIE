// ATLAS_VISUAL §II — palette law. Four colors, hard ceiling. Single source:
// every engine layer imports from here; nothing else may name a color.
export const PALETTE = {
  ink: "#0A0E1A",     // the ground. Always.
  ivoire: "#F8F5EB",  // primary light
  argent: "#C9C5B8",  // secondary light, depth, mid-tones
  or: "#D9C98A",      // accent only — sacred marking, never dominant
} as const;

export const INK_CLEAR = 0x0a0e1a;
// The ground breathes — same Ink, lifted where the world lives, deepened at
// the edges. Not a colored ground (§II): a depth of the one ground.
export const INK_LIFT = "#111727";
export const INK_DEEP = "#05070D";
export const IVOIRE = 0xf8f5eb;
export const ARGENT = 0xc9c5b8;
export const OR = 0xd9c98a;
