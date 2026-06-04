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

export const NIGHT: Palette = {
  theme: "night",
  bg: "radial-gradient(130% 100% at 50% 8%, #1A2150 0%, #121838 44%, #080C20 100%)",
  ink: "#ECE4D0", inkSoft: "#9698BC", brass: "#CBA456", brassHi: "#EAD08A",
  accent: "#D9694B", silver: "#C5C8E8", line: "rgba(203,164,86,0.55)",
  core: "rgba(120,140,255,0.015)", coreHi: "rgba(90,110,220,0.18)", star: "#F3ECD8",
  starCore: "#FBF4E6", starHalo: "#9DB0FF", panel: "rgba(255,255,255,0.05)", panelLine: "rgba(203,164,86,0.28)",
  btnInk: "#140E28", star2: "#F3ECD8",
};

// Font CSS variables (set in layout via next/font).
export const FD = "var(--font-display)"; // Cormorant Garamond
export const FT = "var(--font-text)"; // Spectral
export const FG = "var(--font-glyph)"; // Noto Sans Symbols 2
export const FN = "var(--font-num)"; // Spectral, tabular
