"use client";

import { useState } from "react";
import { NIGHT, FD, FT, FG } from "@/lib/theme";
import { SIGN_GLYPH, SIGN_NAME, SIGN_KEY } from "@/lib/chart";

// The cinematic landing wheel. The engraved plate is atmosphere; THIS is the
// instrument — crisp vector, twelve clickable sectors, gold on midnight.
// Art = texture. Mechanic = vector. Labels = real type (never the AI's).

const pal = NIGHT;

// Element + archetype per sign — evocative, not horoscope filler.
const SIGN_META: { el: string; arch: string }[] = [
  { el: "Fire", arch: "The Initiator" },
  { el: "Earth", arch: "The Keeper" },
  { el: "Air", arch: "The Messenger" },
  { el: "Water", arch: "The Guardian" },
  { el: "Fire", arch: "The Sovereign" },
  { el: "Earth", arch: "The Craftsman" },
  { el: "Air", arch: "The Arbiter" },
  { el: "Water", arch: "The Alchemist" },
  { el: "Fire", arch: "The Seeker" },
  { el: "Earth", arch: "The Architect" },
  { el: "Air", arch: "The Visionary" },
  { el: "Water", arch: "The Dreamer" },
];

const C = 200;
// top-anchored, clockwise: sector i centered at -90 + i*30
const ang = (i: number) => (-90 + i * 30) * (Math.PI / 180);
const pol = (a: number, r: number): [number, number] => [C + r * Math.cos(a), C + r * Math.sin(a)];

const R_OUT = 192;
const R_IN = 96; // inner disc edge
const R_GLYPH = 150;

function sector(i: number, r0: number, r1: number) {
  const a0 = ang(i) - (15 * Math.PI) / 180;
  const a1 = ang(i) + (15 * Math.PI) / 180;
  const [p1x, p1y] = pol(a0, r0);
  const [p2x, p2y] = pol(a0, r1);
  const [p3x, p3y] = pol(a1, r1);
  const [p4x, p4y] = pol(a1, r0);
  return `M ${p1x} ${p1y} L ${p2x} ${p2y} A ${r1} ${r1} 0 0 1 ${p3x} ${p3y} L ${p4x} ${p4y} A ${r0} ${r0} 0 0 0 ${p1x} ${p1y} Z`;
}

export default function WheelLanding() {
  const [hover, setHover] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [entered, setEntered] = useState<number | null>(null);

  const focus = hover != null ? hover : selected; // what the center reflects

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", width: "100%",
      background: pal.bg, color: pal.ink, overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* engraved plate — atmosphere only, vignetted so the wheel pops */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: "url(/wheel-plate.png)", backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.34, filter: "blur(2px) saturate(0.9)",
      }} />
      <div aria-hidden style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: "radial-gradient(70% 70% at 50% 50%, rgba(8,12,32,0.86) 0%, rgba(8,12,32,0.55) 55%, rgba(8,12,32,0.9) 100%)",
      }} />

      {/* wordmark */}
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", marginBottom: 6 }}>
        <div style={{ fontFamily: FT, fontSize: 11, letterSpacing: 6, textTransform: "uppercase", color: pal.inkSoft }}>
          The AstroLab
        </div>
      </div>

      {/* the wheel */}
      <div style={{ position: "relative", zIndex: 2, width: "min(86vw, 620px)", aspectRatio: "1" }}>
        <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
          <defs>
            <radialGradient id="wlcore" cx="50%" cy="46%" r="60%">
              <stop offset="0%" stopColor="rgba(90,110,220,0.20)" />
              <stop offset="100%" stopColor="rgba(120,140,255,0.015)" />
            </radialGradient>
            <filter id="wlglow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ambient halo */}
          <circle cx={C} cy={C} r={196} fill="rgba(90,110,220,0.10)" style={{ filter: "blur(26px)" }} />

          {/* slowly drifting outer dotted annulus — life */}
          <g className="astro-spin">
            {Array.from({ length: 72 }, (_, k) => {
              const a = (k * 5) * (Math.PI / 180);
              const [x, y] = pol(a, R_OUT + 12);
              return <circle key={k} cx={x} cy={y} r={k % 6 === 0 ? 1.1 : 0.55} fill={pal.brass} opacity={0.4} />;
            })}
          </g>

          {/* rings */}
          <circle cx={C} cy={C} r={R_OUT} fill="none" stroke={pal.brass} strokeWidth={1} opacity={0.85} />
          <circle cx={C} cy={C} r={R_OUT - 6} fill="none" stroke={pal.line} strokeWidth={0.5} opacity={0.5} />
          <circle cx={C} cy={C} r={R_IN} fill="url(#wlcore)" />
          <circle cx={C} cy={C} r={R_IN} fill="none" stroke={pal.line} strokeWidth={0.6} opacity={0.55} />

          {/* sector fills + dividers (visual layer) */}
          {Array.from({ length: 12 }, (_, i) => {
            const isHot = focus === i;
            const dim = focus != null && !isHot;
            return (
              <path key={`f${i}`} d={sector(i, R_IN, R_OUT)}
                fill={isHot ? "rgba(234,208,138,0.10)" : "transparent"}
                stroke={pal.line} strokeWidth={isHot ? 1 : 0.5}
                opacity={dim ? 0.28 : 1}
                style={{ transition: "opacity .35s ease, fill .35s ease, stroke-width .25s ease" }} />
            );
          })}

          {/* glyphs */}
          {Array.from({ length: 12 }, (_, i) => {
            const [gx, gy] = pol(ang(i), R_GLYPH);
            const isHot = focus === i;
            const dim = focus != null && !isHot;
            return (
              <text key={`g${i}`} x={gx} y={gy} textAnchor="middle" dominantBaseline="central"
                fontFamily={FG} fontSize={isHot ? 26 : 20}
                fill={isHot ? pal.brassHi : pal.brass}
                opacity={dim ? 0.3 : 0.95}
                style={{ transition: "all .3s ease", filter: isHot ? "drop-shadow(0 0 6px rgba(234,208,138,0.6))" : "none", pointerEvents: "none" }}>
                {SIGN_GLYPH[i]}
              </text>
            );
          })}

          {/* center content */}
          <g style={{ pointerEvents: "none" }}>
            {focus == null ? (
              <>
                <text x={C} y={C - 8} textAnchor="middle" fontFamily={FD} fontStyle="italic" fontSize={20} fill={pal.ink} opacity={0.92}>
                  Choose your sign
                </text>
                <text x={C} y={C + 16} textAnchor="middle" fontFamily={FT} fontSize={9.5} letterSpacing={3}
                  fill={pal.inkSoft} style={{ textTransform: "uppercase" }}>
                  enter the observatory
                </text>
              </>
            ) : (
              <g className="astro-fade" key={focus}>
                <text x={C} y={C - 22} textAnchor="middle" fontFamily={FG} fontSize={22} fill={pal.brassHi}>
                  {SIGN_GLYPH[focus]}
                </text>
                <text x={C} y={C + 6} textAnchor="middle" fontFamily={FD} fontSize={26} fill={pal.ink}>
                  {SIGN_NAME[focus]}
                </text>
                <text x={C} y={C + 26} textAnchor="middle" fontFamily={FT} fontSize={9} letterSpacing={3}
                  fill={pal.inkSoft} style={{ textTransform: "uppercase" }}>
                  {SIGN_META[focus].el} · {SIGN_META[focus].arch}
                </text>
              </g>
            )}
          </g>

          {/* hit-zones on top */}
          {Array.from({ length: 12 }, (_, i) => (
            <path key={`h${i}`} d={sector(i, R_IN, R_OUT + 14)} fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              onClick={() => setSelected(selected === i ? null : i)} />
          ))}
        </svg>
      </div>

      {/* action rail under the wheel */}
      <div style={{ position: "relative", zIndex: 2, marginTop: 18, minHeight: 70, textAlign: "center" }}>
        {selected != null ? (
          <div className="astro-fade" key={selected}>
            <button onClick={() => setEntered(selected)} style={{
              fontFamily: FT, fontSize: 12, letterSpacing: 3, textTransform: "uppercase",
              color: pal.btnInk, background: pal.brass, border: "none",
              padding: "12px 30px", borderRadius: 2, cursor: "pointer",
              boxShadow: "0 0 24px rgba(203,164,86,0.35)",
            }}>
              Enter {SIGN_NAME[selected]} ✦
            </button>
            <div style={{ fontFamily: FT, fontSize: 10.5, letterSpacing: 1, color: pal.inkSoft, marginTop: 12 }}>
              Sun · Moon · Rising are read inside. This is your gate.
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: FT, fontSize: 11, letterSpacing: 2, color: pal.inkSoft, opacity: 0.8 }}>
            Hover to listen. Click to choose.
          </div>
        )}
      </div>

      {/* prototype "room opened" confirmation overlay */}
      {entered != null && (
        <div onClick={() => setEntered(null)} style={{
          position: "fixed", inset: 0, zIndex: 10, background: "rgba(8,12,32,0.92)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 24, textAlign: "center",
        }}>
          <div className="astro-fade" style={{ maxWidth: 460 }}>
            <div style={{ fontFamily: FG, fontSize: 56, color: pal.brassHi, filter: "drop-shadow(0 0 18px rgba(234,208,138,0.5))" }}>
              {SIGN_GLYPH[entered]}
            </div>
            <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 34, color: pal.ink, marginTop: 10 }}>
              The {SIGN_NAME[entered]} room
            </div>
            <div style={{ fontFamily: FT, fontSize: 14, lineHeight: 1.6, color: pal.inkSoft, marginTop: 14 }}>
              Prototype gate. In the live product this opens the {SIGN_NAME[entered]} chamber —
              the Theme reveal, the sealed Star, the Genius. Routed to{" "}
              <span style={{ color: pal.brass }}>/sign/{SIGN_KEY[entered]}</span>.
            </div>
            <div style={{ fontFamily: FT, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: pal.inkSoft, marginTop: 26, opacity: 0.7 }}>
              click anywhere to return
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
