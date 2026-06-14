"use client";

// The natal wheel as an instrument that draws itself in — ring by ring, the way
// the constellations traced in on Your Sky. Reuses the validated geometry
// (lib/atlas/natal-wheel-geometry) the PDF and the reading reveal already use;
// only the markup differs: each layer is its own group, revealed in sequence
// when `cast` flips true. Gold line-work on the night ground. No new math.
import { natalWheel, type NatalWheelInput } from "@/lib/atlas/natal-wheel-geometry";
import { GLYPHS } from "@/lib/atlas/glyph-paths";

const GOLD = "#c2a25f", GOLD_BRIGHT = "#e3c884", GOLD_DEEP = "#8a7140";
const EASE = "cubic-bezier(.165,.84,.44,1)";

export default function ChartWheel({ input, cast, className }: { input: NatalWheelInput; cast: boolean; className?: string }) {
  const w = natalWheel({ ...input, size: input.size ?? 760 });
  return (
    <svg className={`cw${cast ? " cast" : ""}${className ? " " + className : ""}`} viewBox={`0 0 ${w.size} ${w.size}`} role="img"
      aria-label={w.hasHouses ? "The natal chart — houses drawn from the hour of birth" : "The natal chart — hour unknown, drawn without its horizon"}>
      <style>{`
        .cw .cw-lyr{opacity:0;transition:opacity 1.15s ${EASE}}
        .cw.cast .cw-lyr{opacity:1}
        .cw.cast .l-rings{transition-delay:.05s}
        .cw.cast .l-ticks{transition-delay:.35s}
        .cw.cast .l-signs{transition-delay:.72s}
        .cw.cast .l-houses{transition-delay:1.05s}
        .cw.cast .l-axes{transition-delay:1.35s}
        .cw.cast .l-planets{transition-delay:1.62s}
        .cw.cast .l-dots{transition-delay:1.62s}
        .cw.cast .l-chords{transition-delay:2.0s}
        @media(prefers-reduced-motion:reduce){.cw .cw-lyr{opacity:1!important;transition:none}}
      `}</style>

      <g className="cw-lyr l-rings">
        {w.rings.map((r, i) => <circle key={i} cx={r.cx} cy={r.cy} r={r.r} fill="none" stroke={GOLD} strokeWidth={r.w} opacity={r.opacity} />)}
      </g>
      <g className="cw-lyr l-ticks">
        {w.ticks.map((t, i) => <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={GOLD} strokeWidth={t.w} opacity={t.opacity} />)}
      </g>
      <g className="cw-lyr l-signs">
        {w.signGlyphs.map((g, i) => (
          <g key={i} transform={`translate(${g.x - 12 * g.scale} ${g.y - 12 * g.scale}) scale(${g.scale})`} opacity={g.opacity}>
            {GLYPHS[g.key].paths.map((d, j) => <path key={j} d={d} fill="none" stroke={GOLD_DEEP} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />)}
          </g>
        ))}
      </g>
      <g className="cw-lyr l-houses">
        {w.houseLines.map((h, i) => <line key={i} x1={h.x1} y1={h.y1} x2={h.x2} y2={h.y2} stroke={GOLD} strokeWidth={h.w} opacity={h.opacity} />)}
      </g>
      <g className="cw-lyr l-axes">
        {w.axes.map((a) => (
          <g key={a.label}>
            <line x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke={GOLD} strokeWidth={0.9} opacity={0.65} />
            <text x={a.lx} y={a.ly - 6} fill={GOLD} fontSize={w.size / 44} textAnchor="middle" style={{ fontFamily: "var(--font-mono, monospace)", letterSpacing: 1.5 }}>{a.label}</text>
          </g>
        ))}
      </g>
      <g className="cw-lyr l-chords">
        {w.chords.map((ch, i) => (
          <line key={i} x1={ch.x1} y1={ch.y1} x2={ch.x2} y2={ch.y2}
            stroke={ch.bright ? GOLD_BRIGHT : GOLD} strokeWidth={ch.bright ? 1.2 : 0.5} opacity={ch.bright ? 0.9 : 0.3} />
        ))}
      </g>
      <g className="cw-lyr l-dots">
        {w.planetDots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={GOLD_BRIGHT} opacity={0.9} />)}
      </g>
      <g className="cw-lyr l-planets">
        {w.planetGlyphs.map((g, i) => (
          <g key={i} transform={`translate(${g.x - 12 * g.scale} ${g.y - 12 * g.scale}) scale(${g.scale})`} opacity={g.opacity}>
            {GLYPHS[g.key].paths.map((d, j) => <path key={j} d={d} fill="none" stroke={GOLD_BRIGHT} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />)}
            {GLYPHS[g.key].dot && <circle cx={GLYPHS[g.key].dot!.cx} cy={GLYPHS[g.key].dot!.cy} r={GLYPHS[g.key].dot!.r} fill={GOLD_BRIGHT} />}
          </g>
        ))}
      </g>
    </svg>
  );
}
