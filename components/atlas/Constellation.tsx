"use client";

import { useId } from "react";
import type { AtlasStar, ConstellationData } from "@/types/atlas";

// Typed React port of the Constellation System Proof renderer (Claude Design).
// Algorithm preserved exactly: gnomonic projection centred on each field's mean
// direction (unit-vector average → RA-wrap safe), uniform-scale bbox auto-fit
// (no aspect distortion), magnitude-weighted radii relative to the field, a
// projected RA/Dec graticule that curves per field, and the entrance
// choreography (stars ink in groups of 3, cords draw on, sigil engraves last).
// Star geometry comes from data/constellations.json (HYG-sourced). No DOM port.

const D2R = Math.PI / 180;
const BOX = { w: 1000, h: 720, x0: 72, y0: 84, x1: 928, y1: 636 };
const norm180 = (a: number) => { while (a > 180) a -= 360; while (a < -180) a += 360; return a; };

type Pt = { x: number; y: number };

function buildProjector(stars: AtlasStar[]) {
  let X = 0, Y = 0, Z = 0;
  for (const s of stars) {
    const ra = s.ra * 15 * D2R, de = s.dec * D2R;
    X += Math.cos(de) * Math.cos(ra); Y += Math.cos(de) * Math.sin(ra); Z += Math.sin(de);
  }
  const ra0 = Math.atan2(Y, X), de0 = Math.atan2(Z, Math.hypot(X, Y));
  const sin0 = Math.sin(de0), cos0 = Math.cos(de0);

  const uv = (raDeg: number, decDeg: number) => {
    const ra = raDeg * D2R, de = decDeg * D2R;
    const cosc = sin0 * Math.sin(de) + cos0 * Math.cos(de) * Math.cos(ra - ra0);
    if (cosc <= 0.08) return null;                 // beyond the tangent hemisphere
    const x = Math.cos(de) * Math.sin(ra - ra0) / cosc;
    const y = (cos0 * Math.sin(de) - sin0 * Math.cos(de) * Math.cos(ra - ra0)) / cosc;
    return { u: -x, v: y };                          // east → left, north → +v
  };

  const P = stars.map((s) => uv(s.ra * 15, s.dec)).filter(Boolean) as { u: number; v: number }[];
  let umin = 1e9, umax = -1e9, vmin = 1e9, vmax = -1e9;
  P.forEach((p) => { umin = Math.min(umin, p.u); umax = Math.max(umax, p.u); vmin = Math.min(vmin, p.v); vmax = Math.max(vmax, p.v); });
  const spanU = Math.max(umax - umin, 1e-4), spanV = Math.max(vmax - vmin, 1e-4);
  const scale = Math.min((BOX.x1 - BOX.x0) / spanU, (BOX.y1 - BOX.y0) / spanV) * 0.95;
  const uc = (umin + umax) / 2, vc = (vmin + vmax) / 2;
  const cx = (BOX.x0 + BOX.x1) / 2, cy = (BOX.y0 + BOX.y1) / 2;

  const px = (raDeg: number, decDeg: number): Pt | null => {
    const p = uv(raDeg, decDeg); if (!p) return null;
    const x = cx + (p.u - uc) * scale, y = cy - (p.v - vc) * scale;
    if (x < -40 || x > BOX.w + 40 || y < -40 || y > BOX.h + 40) return null;
    return { x, y };
  };

  const ra0deg = ra0 / D2R, de0deg = de0 / D2R;
  let decMin = 1e9, decMax = -1e9, raRelMin = 1e9, raRelMax = -1e9;
  stars.forEach((s) => {
    decMin = Math.min(decMin, s.dec); decMax = Math.max(decMax, s.dec);
    const r = norm180(s.ra * 15 - ra0deg); raRelMin = Math.min(raRelMin, r); raRelMax = Math.max(raRelMax, r);
  });
  return { px, ra0deg, de0deg, decMin, decMax, raRelMin, raRelMax };
}

const pathOf = (pts: Pt[]) => pts.map((p, i) => (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" ");

export default function Constellation({ data, className }: { data: ConstellationData; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const Pr = buildProjector(data.stars);
  const byId: Record<string, AtlasStar> = {};
  data.stars.forEach((s) => { byId[s.id] = s; });
  const mags = data.stars.map((s) => s.mag), mlo = Math.min(...mags), mhi = Math.max(...mags);
  const rOf = (m: number) => 5.8 - 4.1 * ((m - mlo) / Math.max(mhi - mlo, 0.01)); // bright → big

  // graticule
  const grid: React.ReactNode[] = [];
  const dStart = Math.floor((Pr.decMin - 5) / 5) * 5, dEnd = Math.ceil((Pr.decMax + 5) / 5) * 5;
  const rStart = Pr.raRelMin - 7, rEnd = Pr.raRelMax + 7;
  for (let d = dStart; d <= dEnd; d += 5) {
    const pts: Pt[] = [];
    for (let rr = rStart; rr <= rEnd; rr += 1.2) { const p = Pr.px(Pr.ra0deg + rr, d); if (p) pts.push(p); else if (pts.length) break; }
    if (pts.length > 1) {
      const e = pts[pts.length - 1];
      grid.push(<path key={`d${d}`} className="cgrid" d={pathOf(pts)} />);
      grid.push(<text key={`dl${d}`} className="glabel" x={(e.x + 8).toFixed(0)} y={(e.y + 4).toFixed(0)}>{(d >= 0 ? "+" : "") + d}°</text>);
    }
  }
  const hStart = Math.floor((Pr.ra0deg + rStart) / 15), hEnd = Math.ceil((Pr.ra0deg + rEnd) / 15);
  for (let h = hStart; h <= hEnd; h++) {
    const pts: Pt[] = [];
    for (let d = dStart; d <= dEnd; d += 1.2) { const p = Pr.px(h * 15, d); if (p) pts.push(p); }
    if (pts.length > 1) {
      const e = pts[pts.length - 1];
      grid.push(<path key={`h${h}`} className="cgrid" d={pathOf(pts)} />);
      grid.push(<text key={`hl${h}`} className="glabel" x={(e.x - 6).toFixed(0)} y={(e.y + 20).toFixed(0)}>{(((h % 24) + 24) % 24) + "ʰ"}</text>);
    }
  }

  // sigil at field centre — vector paths, engrave in last
  const c = Pr.px(Pr.ra0deg, Pr.de0deg) || { x: 500, y: 360 };

  // cords
  const cords: React.ReactNode[] = [];
  let li = 0;
  data.lines.forEach((seg, i) => {
    const a = byId[seg[0]], b = byId[seg[1]]; if (!a || !b) return;
    const pa = Pr.px(a.ra * 15, a.dec), pb = Pr.px(b.ra * 15, b.dec); if (!pa || !pb) return;
    cords.push(<path key={`c${i}`} className="cline" pathLength={1} style={{ ["--ld" as string]: `${380 + li * 110}ms` }}
      d={`M${pa.x.toFixed(1)} ${pa.y.toFixed(1)} L${pb.x.toFixed(1)} ${pb.y.toFixed(1)}`} />);
    li++;
  });

  // stars
  const starEls: React.ReactNode[] = [];
  data.stars.forEach((s, i) => {
    const p = Pr.px(s.ra * 15, s.dec); if (!p) return;
    starEls.push(<circle key={`s${i}`} className={"cstar" + (s.faint ? " faint" : "")} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
      r={rOf(s.mag).toFixed(2)} style={{ ["--sd" as string]: `${Math.floor(i / 3) * 150}ms` }} />);
  });

  const wDeg = (Pr.raRelMax - Pr.raRelMin) * Math.cos(Pr.de0deg * D2R), hDeg = Pr.decMax - Pr.decMin;

  return (
    <svg key={data.abbr} viewBox="0 0 1000 720" preserveAspectRatio="xMidYMid meet"
      className={className} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
      data-field={`${wDeg.toFixed(0)}x${hDeg.toFixed(0)}`} aria-label={`${data.abbr} constellation`}>
      <style>{STYLE}</style>
      <g>{grid}</g>
      <g transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) scale(${data.sigil.k})`} opacity={0.9}>
        {data.sigil.paths.map((d, i) => <path key={i} className="csig" pathLength={1} d={d} />)}
      </g>
      {cords}
      {starEls}
    </svg>
  );
}

// the field readout helper (so pages can show "Field W° × H° · N stars")
export function fieldReadout(data: ConstellationData) {
  const Pr = buildProjector(data.stars);
  const wDeg = (Pr.raRelMax - Pr.raRelMin) * Math.cos(Pr.de0deg * D2R);
  const hDeg = Pr.decMax - Pr.decMin;
  return { wDeg: Math.round(wDeg), hDeg: Math.round(hDeg), stars: data.stars.length };
}

const STYLE = `
.cgrid{stroke:#ece4d2;stroke-opacity:.05;stroke-width:.7;fill:none}
.glabel{fill:#4a5270;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.1em;opacity:.5}
.cline{fill:none;stroke:#c2a25f;stroke-opacity:.32;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;
  stroke-dasharray:1;stroke-dashoffset:1;animation:cdraw 1.5s cubic-bezier(.165,.84,.44,1) both;animation-delay:var(--ld,0ms)}
.cstar{fill:#f1ead7;opacity:0;animation:cstarIn .9s cubic-bezier(.165,.84,.44,1) both;animation-delay:var(--sd,0ms)}
.cstar.faint{fill:#cdd4e6}
.csig{fill:none;stroke:#c2a25f;stroke-opacity:.24;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;
  stroke-dasharray:1;stroke-dashoffset:1;animation:cdraw 1.7s cubic-bezier(.165,.84,.44,1) .6s both}
@keyframes cstarIn{from{opacity:0}to{opacity:1}}
@keyframes cdraw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@media (prefers-reduced-motion:reduce){
  .cstar{opacity:1!important;animation:none!important}
  .cline,.csig{stroke-dashoffset:0!important;animation:none!important}
}`;
