"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "./Header";
import AtlasChrome from "./AtlasChrome";
import SkyTonight, { type Bind } from "./SkyTonight";
import { SIGN_NAME, SIGN_KEY } from "@/lib/chart";
import { PLANET_GLYPH, SIGN_NAMES } from "@/lib/sky";
import { useSkyTonight } from "@/lib/atlas/use-sky-tonight";

const PHASE_NAME = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];

// The observatory front door — the engraved wheel laid asymmetric, deliberately
// cropped off the left edge like a chart half under another paper on the desk,
// with THE SKY TONIGHT observation panel at its right. The wheel is alive:
// a slow sidereal drift (one degree per four minutes), a small eased rotation
// at each planetary-hour boundary, a live medallion at the plate, and a faint
// warm breath on the wedges currently above the visitor's horizon.
//
// wheel.png seats Aries at upper-left (a dividing line at 12 o'clock), so the
// sectors are offset −105° to land precisely on each engraved wedge.
const C = 600, RI = 225, RO = 584;
const P = (r: number, a: number): [number, number] => [C + r * Math.cos(a), C + r * Math.sin(a)];
function doorPath(i: number) {
  // half-angle 15.5°: each lit wedge laps a touch over the divider lines so
  // there's no hairline on the radial sides; neighbours aren't lit, so the overlap shows nothing.
  const c = ((i * 30 - 105) * Math.PI) / 180, a0 = c - (15.5 * Math.PI) / 180, a1 = c + (15.5 * Math.PI) / 180;
  const [ix0, iy0] = P(RI, a0), [ox0, oy0] = P(RO, a0), [ox1, oy1] = P(RO, a1), [ix1, iy1] = P(RI, a1);
  return `M${ix0.toFixed(1)} ${iy0.toFixed(1)} L${ox0.toFixed(1)} ${oy0.toFixed(1)} A${RO} ${RO} 0 0 1 ${ox1.toFixed(1)} ${oy1.toFixed(1)} L${ix1.toFixed(1)} ${iy1.toFixed(1)} A${RI} ${RI} 0 0 0 ${ix0.toFixed(1)} ${iy0.toFixed(1)} Z`;
}

export default function AtlasHome() {
  const router = useRouter();
  const [hover, setHover] = useState<number | null>(null);
  const [bind, setBind] = useState<Bind>(null);
  const [hop, setHop] = useState(0);
  const sky = useSkyTonight();
  const go = (i: number) => router.push(`/atlas?sign=${SIGN_KEY[i]}`);

  // at the planetary-hour boundary the wheel turns a few degrees with a slow
  // ease, and the medallion glyph crossfades to the next ruler (key remount)
  const hourEnd = sky.hour?.end ? +sky.hour.end : 0;
  useEffect(() => {
    if (!hourEnd) return;
    const ms = hourEnd - Date.now();
    if (ms <= 0 || ms > 12 * 3600e3) return;
    const id = setTimeout(() => setHop((h) => h + 4), ms + 800);
    return () => clearTimeout(id);
  }, [hourEnd]);

  // panel↔wheel binding: the moon entry lights the Moon's wedge, today lights the Sun's
  const lit = bind === "moon" ? sky.moon.signIdx : bind === "sun" ? sky.sun.signIdx : null;

  return (
    <>
      <AtlasChrome />
      <Header />
      <main className="home">
        <div className="wheel-side">
          <div className="wheel-wrap">
            <div className="wheel-drift">
              <div className="wheel-hop" style={{ transform: `rotate(${hop}deg)` }}>
                {/* v2: the raster's center plate (frozen sample data) is ERASED in the
                    image itself — the live medallion writes on clean ground */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="wheel-img" src="/wheel-1200-v2.webp"
                  srcSet="/wheel-820-v2.webp 820w, /wheel-1200-v2.webp 1200w"
                  sizes="(max-width: 860px) 86vw, 60vw"
                  width={1200} height={1200} fetchPriority="high" decoding="async"
                  alt="The AstroLab wheel — the twelve signs and the day and hour of the sky" />
                <svg className="wheel-doors" viewBox="0 0 1200 1200" aria-label="Choose a sign to descend">
                  {Array.from({ length: 12 }, (_, i) => (
                    <path key={i}
                      className={`door${sky.horizon?.[i] ? " up" : ""}${lit === i ? " lit" : ""}`}
                      d={doorPath(i)} role="link" tabIndex={0} aria-label={`Descend into ${SIGN_NAME[i]}`}
                      onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                      onClick={() => go(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") go(i); }} />
                  ))}
                </svg>
              </div>
            </div>
            {/* the live medallion on the clean plate — DAY · HOUR OF / glyph / · ruler · /
                MOON IN SIGN / phase name (the design's hierarchy, computed live) */}
            <div className={`medallion${bind === "hour" ? " pulse" : ""}`} key={sky.hour.ruler} aria-hidden>
              <span className="med-k">Day · Hour of</span>
              <span className="med-glyph">{PLANET_GLYPH[sky.hour.ruler]}</span>
              <span className="med-name">· {sky.hour.ruler} ·</span>
              <span className="med-moon">Moon in {SIGN_NAMES[sky.moon.signIdx]}</span>
              <span className="med-phase">{PHASE_NAME[sky.moon.phaseIdx]}</span>
            </div>
          </div>
          <p className={`invite${hover != null ? " lit" : ""}`}>
            {hover != null ? <>Descend into {SIGN_NAME[hover]}<span className="arr">→</span></> : "Choose a sign to descend."}
          </p>
        </div>
        <SkyTonight sky={sky} onBind={setBind} />
      </main>
      <footer className="home-foot">The AstroLab Atlas <b>·</b> Catalogued from the observed sky <b>·</b> {new Date().getFullYear()}</footer>
    </>
  );
}
