import { natalWheel, type NatalWheelInput } from "@/lib/atlas/natal-wheel-geometry";
import { GLYPHS } from "@/lib/atlas/glyph-paths";

// The natal geometry on the web — one of the three surfaces of the shared
// renderer (PDF plate · Cabinet shelf · Genius dial). Gold line-work on the
// night ground; the aspects the prose names are the bright chords.
const GOLD = "#c2a25f", GOLD_BRIGHT = "#e3c884", GOLD_DEEP = "#8a7140";

export default function NatalWheel({ input, className }: { input: NatalWheelInput; className?: string }) {
  const w = natalWheel(input);
  return (
    <svg className={className} viewBox={`0 0 ${w.size} ${w.size}`} role="img"
      aria-label={w.hasHouses ? "The natal chart — houses drawn from the hour of birth" : "The natal chart — hour unknown, drawn without its horizon"}>
      {w.rings.map((r, i) => (
        <circle key={`r${i}`} cx={r.cx} cy={r.cy} r={r.r} fill="none" stroke={GOLD} strokeWidth={r.w} opacity={r.opacity} />
      ))}
      {w.ticks.map((t, i) => (
        <line key={`t${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={GOLD} strokeWidth={t.w} opacity={t.opacity} />
      ))}
      {w.houseLines.map((h, i) => (
        <line key={`h${i}`} x1={h.x1} y1={h.y1} x2={h.x2} y2={h.y2} stroke={GOLD} strokeWidth={h.w} opacity={h.opacity} />
      ))}
      {w.chords.map((ch, i) => (
        <line key={`c${i}`} x1={ch.x1} y1={ch.y1} x2={ch.x2} y2={ch.y2}
          stroke={ch.bright ? GOLD_BRIGHT : GOLD} strokeWidth={ch.bright ? 1.2 : 0.5} opacity={ch.bright ? 0.9 : 0.3} />
      ))}
      {w.signGlyphs.map((g, i) => (
        <g key={`s${i}`} transform={`translate(${g.x - 12 * g.scale} ${g.y - 12 * g.scale}) scale(${g.scale})`} opacity={g.opacity}>
          {GLYPHS[g.key].paths.map((d, j) => (
            <path key={j} d={d} fill="none" stroke={GOLD_DEEP} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </g>
      ))}
      {w.planetGlyphs.map((g, i) => (
        <g key={`p${i}`} transform={`translate(${g.x - 12 * g.scale} ${g.y - 12 * g.scale}) scale(${g.scale})`} opacity={g.opacity}>
          {GLYPHS[g.key].paths.map((d, j) => (
            <path key={j} d={d} fill="none" stroke={GOLD_BRIGHT} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {GLYPHS[g.key].dot && <circle cx={GLYPHS[g.key].dot!.cx} cy={GLYPHS[g.key].dot!.cy} r={GLYPHS[g.key].dot!.r} fill={GOLD_BRIGHT} />}
        </g>
      ))}
      {w.planetDots.map((d, i) => (
        <circle key={`d${i}`} cx={d.cx} cy={d.cy} r={d.r} fill={GOLD_BRIGHT} opacity={0.9} />
      ))}
      {w.axes.map((a) => (
        <g key={a.label}>
          <line x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke={GOLD} strokeWidth={0.9} opacity={0.65} />
          <text x={a.lx} y={a.ly - 6} fill={GOLD} fontSize={w.size / 44} textAnchor="middle"
            style={{ fontFamily: "var(--mono, monospace)", letterSpacing: 1.5 }}>{a.label}</text>
        </g>
      ))}
    </svg>
  );
}
