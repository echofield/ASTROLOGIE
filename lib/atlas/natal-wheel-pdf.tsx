import { Svg, Circle, Line, Path, G, Text as PdfText } from "@react-pdf/renderer";
import { natalWheel, type NatalWheelInput } from "./natal-wheel-geometry";
import { GLYPHS } from "./glyph-paths";

// The natal geometry in print — the PDF face of the shared renderer. Same
// primitives as the web wheel, emitted as react-pdf SVG nodes at print size.
const GOLD = "#c2a25f", GOLD_BRIGHT = "#e3c884", GOLD_DEEP = "#8a7140";

export function NatalWheelPdf({ input, width }: { input: NatalWheelInput; width: number }) {
  const w = natalWheel(input);
  return (
    <Svg width={width} height={width} viewBox={`0 0 ${w.size} ${w.size}`}>
      {w.rings.map((r, i) => (
        <Circle key={`r${i}`} cx={r.cx} cy={r.cy} r={r.r} fill="none" stroke={GOLD} strokeWidth={r.w} opacity={r.opacity} />
      ))}
      {w.ticks.map((t, i) => (
        <Line key={`t${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={GOLD} strokeWidth={t.w} opacity={t.opacity} />
      ))}
      {w.houseLines.map((h, i) => (
        <Line key={`h${i}`} x1={h.x1} y1={h.y1} x2={h.x2} y2={h.y2} stroke={GOLD} strokeWidth={h.w} opacity={h.opacity} />
      ))}
      {w.chords.map((ch, i) => (
        <Line key={`c${i}`} x1={ch.x1} y1={ch.y1} x2={ch.x2} y2={ch.y2}
          stroke={ch.bright ? GOLD_BRIGHT : GOLD} strokeWidth={ch.bright ? 1.2 : 0.5} opacity={ch.bright ? 0.9 : 0.3} />
      ))}
      {w.signGlyphs.map((g, i) => (
        <G key={`s${i}`} transform={`translate(${g.x - 12 * g.scale}, ${g.y - 12 * g.scale}) scale(${g.scale})`} opacity={g.opacity}>
          {GLYPHS[g.key].paths.map((d, j) => (
            <Path key={j} d={d} fill="none" stroke={GOLD_DEEP} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </G>
      ))}
      {w.planetGlyphs.map((g, i) => (
        <G key={`p${i}`} transform={`translate(${g.x - 12 * g.scale}, ${g.y - 12 * g.scale}) scale(${g.scale})`} opacity={g.opacity}>
          {GLYPHS[g.key].paths.map((d, j) => (
            <Path key={j} d={d} fill="none" stroke={GOLD_BRIGHT} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {GLYPHS[g.key].dot && (
            <Circle cx={GLYPHS[g.key].dot!.cx} cy={GLYPHS[g.key].dot!.cy} r={GLYPHS[g.key].dot!.r} fill={GOLD_BRIGHT} />
          )}
        </G>
      ))}
      {w.planetDots.map((d, i) => (
        <Circle key={`d${i}`} cx={d.cx} cy={d.cy} r={d.r} fill={GOLD_BRIGHT} opacity={0.9} />
      ))}
      {w.axes.map((a) => (
        <G key={a.label}>
          <Line x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke={GOLD} strokeWidth={0.9} opacity={0.65} />
          <PdfText x={a.lx} y={a.ly - 6} fill={GOLD} style={{ fontFamily: "PlexMono", fontSize: w.size / 44 }} textAnchor="middle">{a.label}</PdfText>
        </G>
      ))}
    </Svg>
  );
}

export type { NatalWheelInput };
