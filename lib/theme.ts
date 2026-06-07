// One identity, two modes. Ported from the Claude Design handoff (palette B
// Celestial Night = night/Observatory; Refined Day = day/Cabinet).

export interface Palette {
  theme: "day" | "night";
  bg: string;
  ink: string;
  inkSoft: string;
  brass: string;
  brassHi: string;
  accent: string;
  silver: string;
  line: string;
  core: string;
  coreHi: string;
  star: string;
  starCore: string;
  starHalo: string;
  panel: string;
  panelLine: string;
  btnInk: string;
  star2: string;
}

export const DAY: Palette = {
  theme: "day",
  bg: "radial-gradient(125% 90% at 50% 16%, #F4EEDE 0%, #ECE3CD 56%, #E3D7BB 100%)",
  ink: "#2C2722", inkSoft: "#7C6F58", brass: "#9A7B33", brassHi: "#C2A050",
  accent: "#7C2E2C", silver: "#3C3F52", line: "#A6843A",
  core: "#E7DDC4", coreHi: "#F6F0E0", star: "#9A7B33",
  starCore: "#B8923C", starHalo: "#C9A24B", panel: "#E8DFC9", panelLine: "rgba(80,64,34,0.20)",
  btnInk: "#FBF4E6", star2: "#8a6f30",
};

// The gold/ivory register from The AstroLab.html — one instrument, unified with the
// front door (lib/atlas-ui GOLD). Deep-blue ground, gold the earned accent, ivory ink,
// slate the quiet structure. NIGHT is the only real mode now (the day toggle survives
// but the design is single-register).
export const NIGHT: Palette = {
  theme: "night",
  bg: "radial-gradient(150% 100% at 50% -25%, #0f1a35 0%, #0a1124 34%, #070b18 64%, #05080f 100%)",
  ink: "#ece4d2", inkSoft: "#b6b1a3", brass: "#c2a25f", brassHi: "#e3c884",
  accent: "#c2a25f", silver: "#6f7894", line: "rgba(194,162,95,0.40)",
  core: "rgba(120,140,255,0.015)", coreHi: "rgba(90,110,220,0.14)", star: "#ece4d2",
  starCore: "#f3e3bd", starHalo: "#cbb583", panel: "rgba(20,33,66,0.34)", panelLine: "rgba(194,162,95,0.18)",
  btnInk: "#05080f", star2: "#ece4d2",
};

// Font CSS variables (set in layout via next/font). Gold register: EB Garamond body,
// IBM Plex Mono labels/numerals — matching the front door.
export const FD = "var(--font-display)"; // Cormorant Garamond
export const FT = "var(--font-body), var(--font-text)"; // EB Garamond (was Spectral)
export const FG = "var(--font-glyph)"; // Noto Sans Symbols 2 (astro glyphs)
export const FN = "var(--font-mono), var(--font-text)"; // IBM Plex Mono (was Spectral)

// Semantic intent — GOLD IS FOR THE EARNED ONLY (ported from ARCHÉ's rule:
// "gold is for earned inscriptions, never base"). Reach for these intents instead
// of grabbing `brass` directly, so gold keeps meaning: a sealed Star, a discovered
// artifact, a verified proof, the one primary action. Everything structural —
// rings, dividers, schematics, metadata — stays quiet (silver / ink).
export const intent = (p: Palette) => ({
  earned: p.brass,      // sealed Star, discovered artifact, primary CTA
  earnedHi: p.brassHi,  // active / emphasis on something earned
  structure: p.silver,  // rings, dividers, schematic linework — quiet
  label: p.inkSoft,     // captions, metadata, secondary text
  body: p.ink,          // primary reading text
});
