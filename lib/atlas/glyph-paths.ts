// The engraved glyph set — planets and zodiac as stroke paths in a 24×24 box.
// Drawn, never typed: the PDF's latin-subset fonts have no astrological glyphs,
// and a path renders identically on the web SVG and the react-pdf plate. Thin
// gold line-work, consistent with the house register (gold as a line).
//
// Each glyph is one or more path d-strings; stroke-only, round caps, no fill
// except where noted (the Sun's point).

export type GlyphKey =
  | "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn"
  | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
  | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export interface GlyphSpec { paths: string[]; dot?: { cx: number; cy: number; r: number } }

export const GLYPHS: Record<GlyphKey, GlyphSpec> = {
  // ── planets ──
  sun: { paths: ["M12 5 A7 7 0 1 0 12 19 A7 7 0 1 0 12 5"], dot: { cx: 12, cy: 12, r: 1.6 } },
  moon: { paths: ["M13.5 3.5 A9 9 0 1 0 13.5 20.5 A7 7 0 1 1 13.5 3.5"] },
  mercury: {
    paths: [
      "M12 5.5 A4.5 4.5 0 1 0 12 14.5 A4.5 4.5 0 1 0 12 5.5",
      "M12 14.5 V21", "M9 18 H15",
      "M7.5 2.5 C8.2 4.8 10 6 12 6 C14 6 15.8 4.8 16.5 2.5",
    ],
  },
  venus: { paths: ["M12 3.5 A5 5 0 1 0 12 13.5 A5 5 0 1 0 12 3.5", "M12 13.5 V21", "M8.5 17.5 H15.5"] },
  mars: { paths: ["M10.5 8 A5.5 5.5 0 1 0 10.5 19 A5.5 5.5 0 1 0 10.5 8", "M14.5 9.5 L20 4", "M15.2 4 H20 V8.8"] },
  jupiter: { paths: ["M4 8.5 C5.5 4.5 10.5 5 10.5 9 C10.5 12 7.5 13.5 4 13.5", "M4 13.5 H20.5", "M16.5 5 V20"] },
  saturn: { paths: ["M8 3.5 V16", "M5 6.5 H11", "M8 12.5 C9.5 10 13 9.8 14.5 12 C16 14.2 15 17 13 19 C12 20 12 20.8 13 21.3"] },

  // ── zodiac ──
  aries: { paths: ["M12 21 V9", "M12 9 C12 4.5 8.5 3 6.5 5 C4.5 7 5.5 10 7.5 11", "M12 9 C12 4.5 15.5 3 17.5 5 C19.5 7 18.5 10 16.5 11"] },
  taurus: { paths: ["M12 8.5 A5.5 5.5 0 1 0 12 19.5 A5.5 5.5 0 1 0 12 8.5", "M4.5 3.5 C6.5 7.5 9 9 12 9 C15 9 17.5 7.5 19.5 3.5"] },
  gemini: { paths: ["M6 4 C8 6 16 6 18 4", "M6 20 C8 18 16 18 18 20", "M9 5.3 V18.7", "M15 5.3 V18.7"] },
  cancer: {
    paths: [
      "M8.5 6.5 A3 3 0 1 0 8.5 12.5 A3 3 0 1 0 8.5 6.5", "M11.5 9.5 C11.5 5.5 6 4.5 3.5 7.5",
      "M15.5 11.5 A3 3 0 1 0 15.5 17.5 A3 3 0 1 0 15.5 11.5", "M12.5 14.5 C12.5 18.5 18 19.5 20.5 16.5",
    ],
  },
  leo: { paths: ["M8 11.8 A3.2 3.2 0 1 0 8 18.2 A3.2 3.2 0 1 0 8 11.8", "M11.2 15 C11.2 9 12.5 4.5 15.8 4.5 C18.8 4.5 19.8 7.5 18.3 10 C16.8 12.7 16.3 15.7 17.8 18.2 C18.8 19.8 20.5 19.8 21 18.8"] },
  virgo: {
    paths: [
      "M3.5 7 C4.5 5.6 6 6 6 8 V18", "M6 8 C6 6 7.7 5.6 8.7 7 C9.3 7.8 9.5 8.5 9.5 10 V18",
      "M9.5 10 C9.5 7 11.5 5.8 13 7.2 C14 8.2 14.2 9 14.2 11 V15.5 C14.2 18 15.5 19.5 17.5 19.5",
      "M14.2 13 C16.8 13.5 18 15.2 17 17.5 C16.2 19.2 14 20 12.5 19.3",
    ],
  },
  libra: { paths: ["M4 19.5 H20", "M4 15.5 H8.5", "M15.5 15.5 H20", "M8.5 15.5 C7.5 9.5 16.5 9.5 15.5 15.5"] },
  scorpio: {
    paths: [
      "M3.5 7 C4.5 5.6 6 6 6 8 V17", "M6 8 C6 6 7.7 5.6 8.7 7 C9.3 7.8 9.5 8.5 9.5 10 V17",
      "M9.5 10 C9.5 7 11.5 5.8 13 7.2 C14 8.2 14.2 9 14.2 11 V15 C14.2 18 16 19.5 18.5 19.5",
      "M18.5 19.5 L21 17", "M18.5 19.5 L16.5 21.5",
    ],
  },
  sagittarius: { paths: ["M4.5 19.5 L19.5 4.5", "M12.5 4.5 H19.5 V11.5", "M7.5 11.5 L12.5 16.5"] },
  capricorn: {
    paths: [
      "M3.5 6.5 C5.5 4.5 7.5 5.2 7.5 8 V13.5", "M7.5 8 C7.5 5.2 10.2 4.2 11.4 7 L13.6 13",
      "M13.6 13 C14.6 16.8 18.4 17.3 19.6 14.6 C20.8 11.9 18.2 9.6 15.9 11.4 C14.4 12.6 14.6 15.4 16.2 17.6 C17.2 19 18.6 19.8 20 19.8",
    ],
  },
  aquarius: { paths: ["M3.5 10 L7 6.8 L10.5 10 L14 6.8 L17.5 10 L21 6.8", "M3.5 17 L7 13.8 L10.5 17 L14 13.8 L17.5 17 L21 13.8"] },
  pisces: { paths: ["M7 3.5 C10.5 8 10.5 16 7 20.5", "M17 3.5 C13.5 8 13.5 16 17 20.5", "M5.5 12 H18.5"] },
};

/** Glyph key for a planet name from the chart payload. */
export const PLANET_KEY: Record<string, GlyphKey> = {
  Sun: "sun", Moon: "moon", Mercury: "mercury", Venus: "venus",
  Mars: "mars", Jupiter: "jupiter", Saturn: "saturn",
  sun: "sun", moon: "moon", mercury: "mercury", venus: "venus",
  mars: "mars", jupiter: "jupiter", saturn: "saturn",
};

export const ZODIAC_KEYS: GlyphKey[] = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];
