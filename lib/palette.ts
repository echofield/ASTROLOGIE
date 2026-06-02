// Diurnal palette — the whole surface breathes with the hour of day.
// Ported and typed from the prototype. Returns CSS variable values to apply.

interface Pal {
  h: number;
  bg: string;
  bg2: string;
  ink: string;
  soft: string;
  card: string;
  accent: string;
  planet: string;
  harm: string;
  hard: string;
}

const PAL: Pal[] = [
  { h: 0,  bg: "#10163a", bg2: "#1f2c5e", ink: "#e9e3d0", soft: "#aab0c8", card: "#212a52", accent: "#caa55b", planet: "#cdd2e6", harm: "#7ea6d8", hard: "#c97a6a" },
  { h: 6,  bg: "#e2c9a6", bg2: "#c5895f", ink: "#2c2018", soft: "#74604a", card: "#f0e2cd", accent: "#b35e35", planet: "#3a2d1f", harm: "#5f7faa", hard: "#9a4632" },
  { h: 12, bg: "#ece3d0", bg2: "#ddd0b4", ink: "#241d15", soft: "#5e5140", card: "#efe7d6", accent: "#a8852f", planet: "#26315c", harm: "#33508a", hard: "#6f2a20" },
  { h: 18, bg: "#c9a890", bg2: "#5e4566", ink: "#2a1d24", soft: "#6a4f5c", card: "#d8c2b4", accent: "#c2613a", planet: "#2a1d3a", harm: "#6a5a9a", hard: "#a0463a" },
];
const PALX: Pal[] = [...PAL, { ...PAL[0], h: 24 }];

const KEYS = ["bg", "bg2", "ink", "soft", "card", "accent", "planet", "harm", "hard"] as const;
type Key = (typeof KEYS)[number];

type RGB = [number, number, number];

function hx(h: string): RGB {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
const lp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (c1: RGB, c2: RGB, t: number): RGB => [
  Math.round(lp(c1[0], c2[0], t)),
  Math.round(lp(c1[1], c2[1], t)),
  Math.round(lp(c1[2], c2[2], t)),
];
const rgb = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`;
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export interface PaletteFrame {
  vars: Record<string, string>;
  colors: Record<Key, RGB>;
  star: number;
  phase: string;
  glyph: string;
}

export function paletteAt(hour: number): PaletteFrame {
  hour = ((hour % 24) + 24) % 24;
  let i = 0;
  for (; i < PALX.length - 1; i++) if (PALX[i + 1].h > hour) break;
  const a = PALX[i];
  const b = PALX[i + 1];
  const t = (hour - a.h) / (b.h - a.h);

  const colors = {} as Record<Key, RGB>;
  const vars: Record<string, string> = {};
  for (const k of KEYS) {
    const c = mix(hx(a[k]), hx(b[k]), t);
    colors[k] = c;
    vars[`--${k}`] = rgb(c);
  }
  vars["--faint"] = rgba(colors.ink, 0.42);
  vars["--line"] = rgba(colors.ink, 0.16);
  vars["--ring"] = rgba(colors.ink, 0.5);
  vars["--glow"] = rgba(colors.accent, 0.5);

  const night = (Math.cos((hour / 24) * 2 * Math.PI) + 1) / 2;
  const star = +(night * night).toFixed(2);
  vars["--star"] = String(star);

  let phase: string, glyph: string;
  if (hour < 5 || hour >= 21) { phase = "Night"; glyph = "☽"; }
  else if (hour < 9) { phase = "Dawn"; glyph = "☉"; }
  else if (hour < 16) { phase = "Day"; glyph = "☉"; }
  else if (hour < 19) { phase = "Dusk"; glyph = "☽"; }
  else { phase = "Evening"; glyph = "☽"; }

  return { vars, colors, star, phase, glyph };
}

export const rgbaOf = rgba;
export const rgbOf = rgb;
