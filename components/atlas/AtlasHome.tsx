"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "./Header";
import { NIGHT, FD, FT, FG } from "@/lib/theme";
import { SIGN_GLYPH, SIGN_NAME, SIGN_KEY } from "@/lib/chart";
import { TERRITORIES } from "@/data/territories";
import { getMomentPlate, PLANET_GLYPH, type MomentPlate } from "@/lib/atlas/sky";

// The Atlas — the gold figure wheel as the living front door.
// Resting hub = the live sky (Moment Plate, free/computed). Hovering = the sign.
// Click = descend into the territory. Myth outside; the true sky waits inside.
const pal = NIGHT;
const WHEEL = "/wheel.png";
const C = 200;
const ang = (i: number) => (-105 + i * 30) * (Math.PI / 180); // painted spoke at top
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
    r: rnd(depth * 700 + i * 3 + 3) * rmax + 0.3, o: rnd(depth * 700 + i * 3 + 4) * op + 0.15, t: rnd(depth * 700 + i * 3 + 5) * 5,
  })), [n, depth, rmax, op]);
  return (
    <svg aria-hidden style={{ position: "fixed", inset: -40, width: "calc(100% + 80px)", height: "calc(100% + 80px)", zIndex: 0,
      transform: `translate(${par.x * depth}px, ${par.y * depth}px)`, transition: "transform .5s ease-out" }}>
      {dots.map((d, i) => <circle key={i} cx={`${d.x}%`} cy={`${d.y}%`} r={d.r} fill={pal.star} opacity={d.o} className="astro-twinkle" style={{ animationDelay: `${d.t}s` }} />)}
    </svg>
  );
}

export default function AtlasHome() {
  const uid = useId().replace(/:/g, "");
  const router = useRouter();
  const [hover, setHover] = useState<number | null>(null);
  const [par, setPar] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [plate, setPlate] = useState<MomentPlate | null>(null);

  useEffect(() => {
    setMounted(true);
    let lat: number | undefined, lon: number | undefined;
    try { const p = JSON.parse(localStorage.getItem("astrolabe.profile") || "null"); if (p) { lat = p.lat; lon = p.lon; } } catch {}
    const tick = () => setPlate(getMomentPlate(new Date(), lat, lon));
    tick();
    const id = setInterval(tick, 60_000); // hour changes on its own boundary; refresh each minute
    return () => clearInterval(id);
  }, []);

  const onMove = (e: React.MouseEvent) => setPar({ x: -(e.clientX / window.innerWidth - 0.5) * 2, y: -(e.clientY / window.innerHeight - 0.5) * 2 });
  const t = hover != null ? TERRITORIES[hover] : null;

  return (
    <main onMouseMove={onMove} style={{
      position: "relative", minHeight: "100dvh", width: "100%",
      background: "radial-gradient(120% 105% at 50% 30%, #0A1330 0%, #050C1E 44%, #02050E 100%)",
      color: pal.ink, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {mounted && <>
        <Sky par={par} n={90} depth={5} rmax={1.0} op={0.45} />
        <Sky par={par} n={36} depth={12} rmax={1.8} op={0.5} />
        <Sky par={par} n={10} depth={22} rmax={2.6} op={0.5} />
      </>}
      {/* header */}
      <Header />

      {/* the wheel */}
      <div style={{ position: "relative", zIndex: 2, width: "min(92vw, 700px)", aspectRatio: "1",
        transform: `translate(${par.x * 2}px, ${par.y * 2}px)`, transition: "transform .5s ease-out" }}>
        <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
          <defs>
            {Array.from({ length: 12 }, (_, i) => <clipPath key={i} id={`w${uid}-${i}`}><path d={sector(i, 0, R_OUT)} /></clipPath>)}
            <clipPath id={`hub${uid}`}><circle cx={C} cy={C} r={92} /></clipPath>
          </defs>
          <g>
            <image href={WHEEL} x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice" style={{ filter: "saturate(1.04)" }} />
            {Array.from({ length: 12 }, (_, i) => (
              <image key={`r${i}`} href={WHEEL} x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#w${uid}-${i})`} opacity={hover === i ? 1 : 0}
                style={{ filter: "brightness(1.5) saturate(1.25) drop-shadow(0 0 5px rgba(234,208,138,0.5))", transition: "opacity .3s ease" }} />
            ))}
          </g>
          <circle cx={C} cy={C} r={93} fill="#070b18" />
          <g clipPath={`url(#hub${uid})`}>
            {mounted && Array.from({ length: 24 }, (_, i) => (
              <circle key={i} cx={120 + rnd(i * 7 + 1) * 160} cy={120 + rnd(i * 7 + 2) * 160} r={rnd(i * 7 + 3) * 1.0 + 0.3}
                fill={pal.star} opacity={rnd(i * 7 + 4) * 0.45 + 0.18} className="astro-twinkle" style={{ animationDelay: `${rnd(i * 7 + 5) * 5}s` }} />
            ))}
          </g>
          {hover != null && <path d={sector(hover, 0, R_OUT)} fill="none" stroke={pal.brassHi} strokeWidth={1.1} opacity={0.8} />}

          {/* hit-zones */}
          {Array.from({ length: 12 }, (_, i) => (
            <path key={`h${i}`} d={sector(i, 40, R_OUT)} fill="transparent" style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => router.push(`/sign/${SIGN_KEY[i]}`)} />
          ))}
        </svg>

        {/* two-state center hub (HTML overlay, upright) */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "40%", textAlign: "center", pointerEvents: "none" }}>
          {t ? (
            <div key={hover} className="astro-fade">
              <div style={{ fontFamily: FG, fontSize: "clamp(18px,3.2vw,24px)", color: pal.brassHi }}>{SIGN_GLYPH[hover!]}</div>
              <div style={{ fontFamily: FD, fontSize: "clamp(20px,3.8vw,28px)", color: pal.ink, lineHeight: 1.05 }}>{SIGN_NAME[hover!]}</div>
              <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: "clamp(11px,1.7vw,14px)", color: pal.brass, marginTop: 2 }}>{t.realm}</div>
              <div style={{ fontFamily: FT, fontSize: 8.5, letterSpacing: 2, textTransform: "uppercase", color: pal.inkSoft, marginTop: 8 }}>{t.keywords.join(" · ")}</div>
            </div>
          ) : plate ? (
            <div style={{ fontFamily: FT, color: pal.inkSoft }}>
              <div style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", opacity: 0.7 }}>{plate.isDay ? "Day" : "Night"} · Hour of</div>
              <div style={{ fontFamily: FG, fontSize: "clamp(22px,4vw,30px)", color: pal.brassHi, margin: "2px 0" }}>{PLANET_GLYPH[plate.ruler]}</div>
              <div style={{ fontFamily: FD, fontSize: "clamp(16px,2.6vw,20px)", color: pal.ink, letterSpacing: 2 }}>{plate.ruler}</div>
              <div style={{ width: 40, height: 1, background: pal.line, opacity: 0.5, margin: "10px auto" }} />
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase" }}>Moon in {plate.moonSign}</div>
              <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 12, color: pal.brass, marginTop: 2 }}>{plate.moonPhase}</div>
              {plate.retrogrades.length > 0 && (
                <div style={{ fontSize: 8.5, letterSpacing: 1.5, textTransform: "uppercase", color: pal.accent, marginTop: 8, opacity: 0.9 }}>
                  {plate.retrogrades.join(" · ")} ℞
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2, marginTop: 16, fontFamily: FD, fontStyle: "italic", fontSize: 13, color: pal.inkSoft, opacity: 0.75 }}>
        Choose a sign to descend.
      </div>
      <Link href="/reading" style={{ position: "relative", zIndex: 2, marginTop: 18, fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: "#8a7140", textDecoration: "none", display: "inline-flex", gap: 10, alignItems: "center" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#e3c884")} onMouseLeave={(e) => (e.currentTarget.style.color = "#8a7140")}>
        Or have a Reading drawn <span>→</span>
      </Link>

      {/* footer colophon */}
      <footer style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 6, textAlign: "center", padding: "18px 24px",
        fontFamily: FT, fontSize: 9.5, letterSpacing: 3, textTransform: "uppercase", color: pal.inkSoft, opacity: 0.55 }}>
        The Astrolab Atlas · catalogued from the observed sky · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
