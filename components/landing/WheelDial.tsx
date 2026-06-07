"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { useGSAP } from "@gsap/react";
import { NIGHT, FD, FT, FG } from "@/lib/theme";
import { SIGN_GLYPH, SIGN_NAME, SIGN_KEY } from "@/lib/chart";
import { TERRITORIES } from "@/data/territories";
import { sec } from "@/lib/motion";
import { interpretDiscovery } from "@/lib/meaning";

// The astrolabe dial: spin the wheel like a brass rete (drag + inertia), it
// snaps a sign under the fixed pointer; click a sign to ease it to the top.
// Figures rotate (authentic instrument); the upright readout is the center HUD.

gsap.registerPlugin(Draggable, InertiaPlugin, useGSAP);

const pal = NIGHT;
const WHEEL = "/wheel-clean.png";
const C = 200;
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

// rotation (deg) at which sign i rests under the top pointer
const restFor = (i: number) => 15 - 30 * i;
const activeFromRot = (r: number) => (((Math.round((15 - r) / 30) % 12) + 12) % 12);

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
        <circle key={i} cx={`${d.x}%`} cy={`${d.y}%`} r={d.r} fill={pal.star} opacity={d.o}
          className="astro-twinkle" style={{ animationDelay: `${d.t}s` }} />
      ))}
    </svg>
  );
}

export default function WheelDial() {
  const uid = useId().replace(/:/g, "");
  const router = useRouter();
  const scope = useRef<HTMLDivElement>(null);
  const rotor = useRef<SVGGElement>(null);

  const [hover, setHover] = useState<number | null>(null);
  const [active, setActive] = useState(0);        // sign at the pointer
  const [par, setPar] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const focus = hover != null ? hover : active;
  const t = TERRITORIES[focus];

  const onMove = (e: React.MouseEvent) => {
    setPar({ x: -(e.clientX / window.innerWidth - 0.5) * 2, y: -(e.clientY / window.innerHeight - 0.5) * 2 });
  };

  useGSAP(() => {
    if (!rotor.current) return;
    gsap.set(rotor.current, { transformOrigin: "50% 50%", rotation: restFor(0) });
    const sync = () => setActive(activeFromRot(Number(gsap.getProperty(rotor.current, "rotation"))));
    const d = Draggable.create(rotor.current, {
      type: "rotation",
      inertia: true,
      snap: (v: number) => Math.round((v - 15) / 30) * 30 + 15,
      onDrag: sync,
      onThrowUpdate: sync,
      onThrowComplete: sync,
    })[0];
    return () => d.kill();
  }, { scope });

  const spinTo = (i: number) => {
    if (!rotor.current) return;
    const cur = Number(gsap.getProperty(rotor.current, "rotation"));
    let target = restFor(i);
    target += Math.round((cur - target) / 360) * 360; // nearest equivalent, no long spin
    gsap.to(rotor.current, {
      rotation: target, duration: sec("contemplative"), ease: "power3.out",
      onUpdate: () => setActive(activeFromRot(Number(gsap.getProperty(rotor.current, "rotation")))),
      onComplete: () => setActive(i),
    });
  };

  return (
    <div ref={scope} onMouseMove={onMove} style={{
      position: "relative", minHeight: "100dvh", width: "100%",
      background: "radial-gradient(120% 105% at 50% 30%, #0A1330 0%, #050C1E 44%, #02050E 100%)",
      color: pal.ink, overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {mounted && <>
        <Sky par={par} n={90} depth={5} rmax={1.0} op={0.45} />
        <Sky par={par} n={36} depth={12} rmax={1.8} op={0.5} />
        <Sky par={par} n={10} depth={22} rmax={2.6} op={0.5} />
      </>}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(40% 36% at 50% 46%, rgba(90,110,220,0.12) 0%, rgba(90,110,220,0) 70%)" }} />

      <div style={{ position: "relative", zIndex: 2, fontFamily: FT, fontSize: 11, letterSpacing: 6, textTransform: "uppercase", color: pal.inkSoft, marginBottom: 2 }}>
        The AstroLab · Atlas
      </div>

      {/* stage (parallax) */}
      <div style={{
        position: "relative", zIndex: 2, width: "min(92vw, 700px)", aspectRatio: "1",
        transform: `translate(${par.x * 2}px, ${par.y * 2}px)`, transition: "transform .5s ease-out",
      }}>
        {/* fixed pointer at top */}
        <div aria-hidden style={{
          position: "absolute", top: "-2%", left: "50%", transform: "translateX(-50%)", zIndex: 3,
          width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent",
          borderTop: `14px solid ${pal.brassHi}`, filter: "drop-shadow(0 0 5px rgba(234,208,138,0.6))",
        }} />

        <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ display: "block", overflow: "visible", touchAction: "none" }}>
          <defs>
            {Array.from({ length: 12 }, (_, i) => (
              <clipPath key={i} id={`wedge${uid}-${i}`}><path d={sector(i, 0, R_OUT)} /></clipPath>
            ))}
            <clipPath id={`hub${uid}`}><circle cx={C} cy={C} r={92} /></clipPath>
            <radialGradient id={`feather${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" /><stop offset="92%" stopColor="#fff" /><stop offset="100%" stopColor="#000" />
            </radialGradient>
            <mask id={`wmask${uid}`}><rect x="0" y="0" width="400" height="400" fill={`url(#feather${uid})`} /></mask>
          </defs>

          <circle cx={C} cy={C} r={196} fill="rgba(90,110,220,0.12)" style={{ filter: "blur(34px)" }} />

          {/* the rotor — everything that spins lives here */}
          <g ref={rotor} style={{ cursor: "grab" }}>
            <g mask={`url(#wmask${uid})`}>
              <image href={WHEEL} x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice"
                style={{ filter: "brightness(0.82) saturate(1)" }} />
              {Array.from({ length: 12 }, (_, i) => (
                <image key={`r${i}`} href={WHEEL} x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#wedge${uid}-${i})`} opacity={focus === i ? 1 : 0}
                  style={{ filter: "brightness(1.5) saturate(1.25) drop-shadow(0 0 5px rgba(234,208,138,0.5))", transition: "opacity .3s ease" }} />
              ))}
            </g>
            <path d={sector(focus, 0, R_OUT)} fill="none" stroke={pal.brassHi} strokeWidth={1.1} opacity={0.8} mask={`url(#wmask${uid})`} />
            {Array.from({ length: 12 }, (_, i) => (
              <path key={`h${i}`} d={sector(i, 40, R_OUT)} fill="transparent" style={{ cursor: "pointer" }}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                onClick={() => spinTo(i)} />
            ))}
          </g>

          {/* hub stars (do not rotate) */}
          <g clipPath={`url(#hub${uid})`}>
            {mounted && Array.from({ length: 24 }, (_, i) => (
              <circle key={i} cx={120 + rnd(i * 7 + 1) * 160} cy={120 + rnd(i * 7 + 2) * 160}
                r={rnd(i * 7 + 3) * 1.0 + 0.3} fill={pal.star} opacity={rnd(i * 7 + 4) * 0.45 + 0.18}
                className="astro-twinkle" style={{ animationDelay: `${rnd(i * 7 + 5) * 5}s` }} />
            ))}
          </g>
        </svg>

        {/* upright center readout (HTML, never rotates) */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 2,
          width: "38%", textAlign: "center", pointerEvents: "none",
        }}>
          <div key={focus} className="astro-fade">
            <div style={{ fontFamily: FG, fontSize: "clamp(18px,3.4vw,26px)", color: pal.brassHi }}>{SIGN_GLYPH[focus]}</div>
            <div style={{ fontFamily: FD, fontSize: "clamp(20px,4vw,30px)", color: pal.ink, lineHeight: 1.05 }}>{SIGN_NAME[focus]}</div>
            <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: "clamp(11px,1.7vw,14px)", color: pal.brass, marginTop: 2 }}>{t.realm}</div>
            <div style={{ width: 48, height: 1, background: pal.line, opacity: 0.5, margin: "8px auto" }} />
            <div style={{ fontFamily: FT, fontSize: 8.5, letterSpacing: 1.5, textTransform: "uppercase", color: pal.inkSoft }}>{t.keywords.join(" · ")}</div>
            <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 10, color: pal.inkSoft, opacity: 0.8, marginTop: 6 }}>{interpretDiscovery(0, t.artifacts)}</div>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2, marginTop: 14, minHeight: 64, textAlign: "center" }}>
        <button onClick={() => router.push(`/sign/${SIGN_KEY[focus]}`)} style={{
          fontFamily: FT, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: pal.btnInk,
          background: pal.brass, border: "none", padding: "12px 30px", borderRadius: 2, cursor: "pointer",
          boxShadow: "0 0 24px rgba(203,164,86,0.35)",
        }}>Descend into {t.realm} →</button>
        <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 12, color: pal.inkSoft, opacity: 0.7, marginTop: 14 }}>
          Turn the wheel. Each sign is a world.
        </div>
      </div>
    </div>
  );
}
