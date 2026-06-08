"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "./Header";
import AtlasChrome from "./AtlasChrome";
import { SIGN_NAME, SIGN_KEY } from "@/lib/chart";

// The entry wheel — ported from AstroLab Home.html. The engraved wheel (wheel.png)
// framed, not touched: twelve invisible door sectors over it; hover lights the
// invitation; click descends into the sign's territory. Our wheel.png seats Aries
// at upper-left (a dividing line at 12 o'clock), so the sectors are offset −105°
// (not the export's −90°) to land precisely on each engraved wedge.
// RI dropped from the export's 326 (figure band only) to 225 so each sector covers
// the full sign wedge — the figure and its constellation dots — stopping just outside
// the central plate; RO stays at the rim.
const C = 600, RI = 225, RO = 584;
const P = (r: number, a: number): [number, number] => [C + r * Math.cos(a), C + r * Math.sin(a)];
function doorPath(i: number) {
  // half-angle 15.5° (not 15°): each lit wedge laps a touch over the divider lines so
  // there's no hairline on the radial sides; neighbours aren't lit, so the overlap shows nothing.
  const c = ((i * 30 - 105) * Math.PI) / 180, a0 = c - (15.5 * Math.PI) / 180, a1 = c + (15.5 * Math.PI) / 180;
  const [ix0, iy0] = P(RI, a0), [ox0, oy0] = P(RO, a0), [ox1, oy1] = P(RO, a1), [ix1, iy1] = P(RI, a1);
  return `M${ix0.toFixed(1)} ${iy0.toFixed(1)} L${ox0.toFixed(1)} ${oy0.toFixed(1)} A${RO} ${RO} 0 0 1 ${ox1.toFixed(1)} ${oy1.toFixed(1)} L${ix1.toFixed(1)} ${iy1.toFixed(1)} A${RI} ${RI} 0 0 0 ${ix0.toFixed(1)} ${iy0.toFixed(1)} Z`;
}

export default function AtlasHome() {
  const router = useRouter();
  const [hover, setHover] = useState<number | null>(null);
  const go = (i: number) => router.push(`/atlas?sign=${SIGN_KEY[i]}`);

  return (
    <>
      <AtlasChrome />
      <Header />
      <main className="home">
        <div className="wheel-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="wheel-img" src="/wheel.png" alt="The AstroLab wheel — the twelve signs and the day and hour of the sky" />
          <svg className="wheel-doors" viewBox="0 0 1200 1200" aria-label="Choose a sign to descend">
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} className="door" d={doorPath(i)} role="link" tabIndex={0} aria-label={`Descend into ${SIGN_NAME[i]}`}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                onClick={() => go(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") go(i); }} />
            ))}
          </svg>
        </div>
        <p className={`invite${hover != null ? " lit" : ""}`}>
          {hover != null ? <>Descend into {SIGN_NAME[hover]}<span className="arr">→</span></> : "Choose a sign to descend."}
        </p>
        <p className="home-thread"><Link href="/reading">Or have a Reading drawn <span className="ar">→</span></Link></p>
      </main>
      <footer className="home-foot">The AstroLab Atlas <b>·</b> Catalogued from the observed sky <b>·</b> {new Date().getFullYear()}</footer>
    </>
  );
}
