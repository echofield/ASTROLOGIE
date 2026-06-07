"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NIGHT, FD, FT, FG } from "@/lib/theme";
import { SIGN_GLYPH, SIGN_NAME, SIGN_KEY } from "@/lib/chart";
import { TERRITORIES } from "@/data/territories";

// The atlas: generated gold wheel as the instrument, a living parallax sky
// behind it, masked to a circle so it dissolves into the page (no square seam).
// Center is a territory HUD. Enter routes into the territory itself.

const pal = NIGHT;
const WHEEL = "/wheel-clean.png";

const C = 200;
// Painted wheel has a SPOKE at top (Aries|Taurus boundary), so sign CENTERS sit
// at -90 - 15 + i*30. The -15 phase aligns hit-zones to the figures.
const ang = (i: number) => (-105 + i * 30) * (Math.PI / 180);
const pol = (a: number, r: number): [number, number] => [C + r * Math.cos(a), C + r * Math.sin(a)];
function sector(i: number, r0: number, r1: number) {
  const a0 = ang(i) - (15 * Math.PI) / 180, a1 = ang(i) + (15 * Math.PI) / 180;
  const [p1x, p1y] = pol(a0, r0), [p2x, p2y] = pol(a0, r1);
  const [p3x, p3y] = pol(a1, r1), [p4x, p4y] = pol(a1, r0);
  return `M ${p1x} ${p1y} L ${p2x} ${p2y} A ${r1} ${r1} 0 0 1 ${p3x} ${p3y} L ${p4x} ${p4y} A ${r0} ${r0} 0 0 0 ${p1x} ${p1y} Z`;
}
const R_OUT = 198;
const rnd = (s: number) => { const x = Math.sin(s * 12.9898) * 43758.5453; return x - Math.floor(x); };

function Sky({ par, n, depth, rmax, op }: { par: { x: number; y: number }; n: number; depth: number; rmax: number; op: number }) {
  const dots = useMemo(() => Array.from({ length: n }, (_, i) => ({
    x: rnd(depth * 700 + i * 3 + 1) * 100, y: rnd(depth * 700 + i * 3 + 2) * 100,
    r: rnd(depth * 700 + i * 3 + 3) * rmax + 0.3, o: rnd(depth * 700 + i * 3 + 4) * op + 0.15,
    t: rnd(depth * 700 + i * 3 + 5) * 5,
  })), [n, depth, rmax, op]);
  return (
    <svg aria-hidden style={{
      position: "fixed", inset: -40, width: "calc(100% + 80px)", height: "calc(100% + 80px)", zIndex: 0,
      transform: `translate(${par.x * depth}px, ${par.y * depth}px)`, transition: "transform .5s ease-out",
    }}>
      {dots.map((d, i) => (
        <circle key={i} cx={`${d.x}%`} cy={`${d.y}%`} r={d.r} fill={pal.star}
          opacity={d.o} className="astro-twinkle" style={{ animationDelay: `${d.t}s` }} />
      ))}
    </svg>
  );
}

export default function WheelLandingPlate() {
  const uid = useId().replace(/:/g, "");
  const router = useRouter();
  const [hover, setHover] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [par, setPar] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const focus = hover != null ? hover : selected;
  const t = focus != null ? TERRITORIES[focus] : null;

  const onMove = (e: React.MouseEvent) => {
    setPar({ x: -(e.clientX / window.innerWidth - 0.5) * 2, y: -(e.clientY / window.innerHeight - 0.5) * 2 });
  };

  return (
    <div onMouseMove={onMove} style={{
      position: "relative", minHeight: "100dvh", width: "100%",
      // matched to the wheel's own backdrop (#030b1e) so the masked edge melts in
      background: "radial-gradient(120% 105% at 50% 30%, #0A1330 0%, #050C1E 44%, #02050E 100%)",
      color: pal.ink, overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {mounted && <>
        <Sky par={par} n={90} depth={5} rmax={1.0} op={0.45} />
        <Sky par={par} n={36} depth={12} rmax={1.8} op={0.5} />
        <Sky par={par} n={10} depth={22} rmax={2.6} op={0.5} />
      </>}
      <div aria-hidden style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(40% 36% at 50% 46%, rgba(90,110,220,0.12) 0%, rgba(90,110,220,0) 70%)",
      }} />

      <div style={{ position: "relative", zIndex: 2, fontFamily: FT, fontSize: 11, letterSpacing: 6, textTransform: "uppercase", color: pal.inkSoft, marginBottom: 2 }}>
        The AstroLab · Atlas
      </div>

      <div style={{
        position: "relative", zIndex: 2, width: "min(92vw, 700px)", aspectRatio: "1",
        transform: `translate(${par.x * 2}px, ${par.y * 2}px)`, transition: "transform .5s ease-out",
      }}>
        <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
          <defs>
            {Array.from({ length: 12 }, (_, i) => (
              <clipPath key={i} id={`wedge${uid}-${i}`}><path d={sector(i, 0, R_OUT)} /></clipPath>
            ))}
            <clipPath id={`hub${uid}`}><circle cx={C} cy={C} r={92} /></clipPath>
            {/* feather: white center → transparent rim. Removes the square corners
                and melts the wheel edge into the sky — kills the "sticker" seam. */}
            <radialGradient id={`feather${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="92%" stopColor="#fff" />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
            <mask id={`wmask${uid}`}>
              <rect x="0" y="0" width="400" height="400" fill={`url(#feather${uid})`} />
            </mask>
          </defs>

          <circle cx={C} cy={C} r={196} fill="rgba(90,110,220,0.12)" style={{ filter: "blur(34px)" }} />

          {/* wheel, masked to a feathered circle */}
          <g mask={`url(#wmask${uid})`}>
            <image href={WHEEL} x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice"
              style={{ filter: "brightness(0.82) saturate(1)" }} />
            {Array.from({ length: 12 }, (_, i) => (
              <image key={`r${i}`} href={WHEEL} x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#wedge${uid}-${i})`} opacity={focus === i ? 1 : 0}
                style={{ filter: "brightness(1.5) saturate(1.25) drop-shadow(0 0 5px rgba(234,208,138,0.5))", transition: "opacity .3s ease" }} />
            ))}
          </g>

          {/* stars inside the empty hub (client-only to avoid SSR mismatch) */}
          <g clipPath={`url(#hub${uid})`}>
            {mounted && Array.from({ length: 24 }, (_, i) => (
              <circle key={i} cx={120 + rnd(i * 7 + 1) * 160} cy={120 + rnd(i * 7 + 2) * 160}
                r={rnd(i * 7 + 3) * 1.0 + 0.3} fill={pal.star} opacity={rnd(i * 7 + 4) * 0.45 + 0.18}
                className="astro-twinkle" style={{ animationDelay: `${rnd(i * 7 + 5) * 5}s` }} />
            ))}
          </g>

          {focus != null && (
            <path d={sector(focus, 0, R_OUT)} fill="none" stroke={pal.brassHi} strokeWidth={1.1} opacity={0.85} mask={`url(#wmask${uid})`} />
          )}

          {/* center territory HUD */}
          {t != null && focus != null ? (
            <g className="astro-fade" key={focus} style={{ pointerEvents: "none" }}>
              <circle cx={C} cy={C} r={86} fill="rgba(6,8,20,0.5)" />
              <text x={C} y={C - 44} textAnchor="middle" fontFamily={FG} fontSize={17} fill={pal.brassHi}>{SIGN_GLYPH[focus]}</text>
              <text x={C} y={C - 20} textAnchor="middle" fontFamily={FD} fontSize={23} fill={pal.ink}>{SIGN_NAME[focus]}</text>
              <text x={C} y={C - 4} textAnchor="middle" fontFamily={FT} fontSize={7.5} letterSpacing={3}
                fill={pal.inkSoft} style={{ textTransform: "uppercase" }}>{t.el} · {t.arch}</text>
              <line x1={C - 30} y1={C + 4} x2={C + 30} y2={C + 4} stroke={pal.line} strokeWidth={0.5} opacity={0.6} />
              <text x={C} y={C + 18} textAnchor="middle" fontFamily={FT} fontSize={7} letterSpacing={1.5}
                fill={pal.brass} style={{ textTransform: "uppercase" }}>{t.keywords.join("  ·  ")}</text>
              <text x={C} y={C + 34} textAnchor="middle" fontFamily={FT} fontSize={6.5} letterSpacing={1}
                fill={pal.inkSoft} opacity={0.85}>{t.artifacts} artifacts · theme active</text>
            </g>
          ) : (
            <text x={C} y={C + 3} textAnchor="middle" fontFamily={FD} fontStyle="italic" fontSize={17}
              fill={pal.inkSoft} opacity={0.8} style={{ pointerEvents: "none" }}>choose a territory</text>
          )}

          {Array.from({ length: 12 }, (_, i) => (
            <path key={`h${i}`} d={sector(i, 40, R_OUT)} fill="transparent" style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              onClick={() => setSelected(selected === i ? null : i)} />
          ))}
        </svg>
      </div>

      <div style={{ position: "relative", zIndex: 2, marginTop: 14, minHeight: 64, textAlign: "center" }}>
        {selected != null ? (
          <button className="astro-fade" key={selected} onClick={() => router.push(`/sign/${SIGN_KEY[selected]}`)} style={{
            fontFamily: FT, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: pal.btnInk,
            background: pal.brass, border: "none", padding: "12px 30px", borderRadius: 2, cursor: "pointer",
            boxShadow: "0 0 24px rgba(203,164,86,0.35)",
          }}>Enter the {SIGN_NAME[selected]} territory →</button>
        ) : (
          <div style={{ fontFamily: FT, fontSize: 11, letterSpacing: 2, color: pal.inkSoft, opacity: 0.8 }}>
            Hover a territory. Click to choose.
          </div>
        )}
      </div>
    </div>
  );
}
