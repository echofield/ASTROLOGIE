// The geometry of the hour a person was born — pure computation, no React.
// One module feeds three surfaces (the PDF plate, the Cabinet chart shelf, the
// Genius dial) so the wheel a reader holds in print is the wheel on screen.
//
// Convention: with a known hour, the Ascendant sits at the left (the horizon)
// and longitudes increase counter-clockwise — the classical chart. With the
// hour unknown there is no horizon: 0° Aries takes the left, planets ride the
// ecliptic ring only, no houses, no angles.
import { GLYPHS, PLANET_KEY, ZODIAC_KEYS, type GlyphKey } from "./glyph-paths";

export interface WheelAspect { a: string; b: string; named?: boolean }
export interface NatalWheelInput {
  /** Planet name → true ecliptic longitude (degrees). ASC/MC included via asc/mc. */
  planets: Record<string, number>;
  asc?: number | null;
  mc?: number | null;
  hasHouses?: boolean;
  /** Aspect pairs by name ("Sun"/"ASC"/"MC"); named ones draw bright. */
  aspects?: WheelAspect[];
  size?: number;
}

export interface GlyphPlacement { key: GlyphKey; x: number; y: number; scale: number; opacity: number }
export interface Stroke { x1: number; y1: number; x2: number; y2: number; w: number; opacity: number }
export interface Ring { cx: number; cy: number; r: number; w: number; opacity: number }
export interface Chord { x1: number; y1: number; x2: number; y2: number; bright: boolean }

export interface WheelPrimitives {
  size: number;
  rings: Ring[];
  ticks: Stroke[];
  houseLines: Stroke[];
  axes: { x1: number; y1: number; x2: number; y2: number; label: "ASC" | "MC"; lx: number; ly: number }[];
  signGlyphs: GlyphPlacement[];
  planetGlyphs: GlyphPlacement[];
  planetDots: { cx: number; cy: number; r: number }[];
  chords: Chord[];
  hasHouses: boolean;
}

const RAD = Math.PI / 180;

export function natalWheel(input: NatalWheelInput): WheelPrimitives {
  const size = input.size ?? 480;
  const c = size / 2;
  const hasHouses = Boolean(input.hasHouses && input.asc != null);
  const rot = hasHouses ? (input.asc as number) : 0;

  // screen position for an ecliptic longitude: rot at the left, CCW increase
  const pt = (lon: number, r: number): [number, number] => {
    const a = (180 - (lon - rot)) * RAD;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };

  const rOuter = c * 0.97;        // outer rim
  const rZodiacIn = c * 0.80;     // inner edge of the sign band
  const rGlyph = c * 0.885;       // sign glyphs ride the band's middle
  const rPlanet = c * 0.66;       // planet glyphs
  const rChord = c * 0.52;        // aspect chords anchor ring
  const rHub = c * 0.10;

  const rings: Ring[] = [
    { cx: c, cy: c, r: rOuter, w: 1.1, opacity: 0.8 },
    { cx: c, cy: c, r: rZodiacIn, w: 0.7, opacity: 0.55 },
    { cx: c, cy: c, r: rChord, w: 0.5, opacity: 0.3 },
    { cx: c, cy: c, r: rHub, w: 0.6, opacity: 0.4 },
  ];

  // degree ticks on the outer rim: every 5° faint, every 30° (cusps) firm
  const ticks: Stroke[] = [];
  for (let d = 0; d < 360; d += 5) {
    const cusp = d % 30 === 0;
    const [x1, y1] = pt(d, rOuter);
    const [x2, y2] = pt(d, cusp ? rZodiacIn : rOuter - (d % 10 === 0 ? 9 : 5) * (size / 480));
    ticks.push({ x1, y1, x2, y2, w: cusp ? 0.8 : 0.45, opacity: cusp ? 0.6 : 0.35 });
  }

  // sign glyphs at the center of each wedge
  const signGlyphs: GlyphPlacement[] = ZODIAC_KEYS.map((key, i) => {
    const [x, y] = pt(i * 30 + 15, rGlyph);
    return { key, x, y, scale: (size / 480) * 0.78, opacity: 0.75 };
  });

  // equal houses from the ASC; the horizon and meridian drawn as full axes
  const houseLines: Stroke[] = [];
  const axes: WheelPrimitives["axes"] = [];
  if (hasHouses) {
    for (let h = 0; h < 12; h++) {
      const lon = (rot + h * 30) % 360;
      const [x1, y1] = pt(lon, rHub);
      const [x2, y2] = pt(lon, rZodiacIn);
      houseLines.push({ x1, y1, x2, y2, w: h % 3 === 0 ? 0.7 : 0.4, opacity: h % 3 === 0 ? 0.5 : 0.28 });
    }
    // axis labels sit just inside the rim — at the rim itself they clip the viewBox edge
    const rLabel = rOuter - 22 * (size / 480);
    const [ax, ay] = pt(rot, rOuter);
    const [alx, aly] = pt(rot, rLabel);
    axes.push({ x1: c, y1: c, x2: ax, y2: ay, label: "ASC", lx: alx, ly: aly });
    if (input.mc != null) {
      const [mx, my] = pt(input.mc, rOuter);
      const [mlx, mly] = pt(input.mc, rLabel);
      axes.push({ x1: c, y1: c, x2: mx, y2: my, label: "MC", lx: mlx, ly: mly });
    }
  }

  // planets at true longitude — glyph on the planet ring, a fine dot at the exact degree
  const planetGlyphs: GlyphPlacement[] = [];
  const planetDots: WheelPrimitives["planetDots"] = [];
  const anchor: Record<string, [number, number]> = {};
  for (const [name, lon] of Object.entries(input.planets)) {
    const key = PLANET_KEY[name];
    if (!key || !GLYPHS[key]) continue;
    const [x, y] = pt(lon, rPlanet);
    planetGlyphs.push({ key, x, y, scale: (size / 480) * 0.92, opacity: 0.95 });
    const [dx, dy] = pt(lon, rZodiacIn);
    planetDots.push({ cx: dx, cy: dy, r: 1.6 * (size / 480) });
    anchor[name] = pt(lon, rChord);
  }
  if (input.asc != null) anchor.ASC = pt(input.asc, rChord);
  if (input.mc != null) anchor.MC = pt(input.mc, rChord);

  // the aspects the prose names are drawn bright; the rest are hairline
  const chords: Chord[] = [];
  for (const asp of input.aspects ?? []) {
    const A = anchor[asp.a], B = anchor[asp.b];
    if (!A || !B) continue;
    chords.push({ x1: A[0], y1: A[1], x2: B[0], y2: B[1], bright: Boolean(asp.named) });
  }

  return { size, rings, ticks, houseLines, axes, signGlyphs, planetGlyphs, planetDots, chords, hasHouses };
}
