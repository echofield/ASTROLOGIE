"use client";

import { Fragment } from "react";
import type { Longitude, PlanetName } from "@/lib/types";
import type { SealedStar } from "@/lib/star";
import { PLANETS, PLANET_GLYPH, ZODIAC } from "@/lib/sky";

const cx = 200, cy = 200;
const INK = "#241d15", BRASS = "#a8852f", LAPIS = "#26315c", OX = "#6f2a20";
const FAINT = "rgba(36,29,21,.45)";

function pt(L: number, r: number): [number, number] {
  const a = ((180 + L) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}

interface Props {
  natal: Record<PlanetName, Longitude>;
  star?: SealedStar | null;
  moonLon?: number;
  onSelectPlanet?: (p: PlanetName) => void;
}

export default function Wheel({ natal, star, moonLon, onSelectPlanet }: Props) {
  // sign dividers + glyphs
  const rims = [191, 158, 128, 100];
  const divs = [];
  for (let i = 0; i < 12; i++) {
    const a = i * 30;
    const [x1, y1] = pt(a, 158);
    const [x2, y2] = pt(a, 191);
    const [gx, gy] = pt(a + 15, 174);
    divs.push(
      <Fragment key={`d${i}`}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={FAINT} strokeWidth={0.8} />
        <text x={gx} y={gy + 5} textAnchor="middle" fontSize={15} fill={INK}>{ZODIAC[i]}</text>
      </Fragment>,
    );
  }

  const planets = PLANETS.map((p) => {
    const L = natal[p];
    const [x, y] = pt(L, 128);
    const [tx, ty] = pt(L, 108);
    const [ix, iy] = pt(L, 100);
    return (
      <Fragment key={p}>
        <line x1={tx} y1={ty} x2={ix} y2={iy} stroke={BRASS} strokeWidth={0.8} opacity={0.6} />
        <text
          x={x} y={y + 5} textAnchor="middle" fontSize={16} fill={LAPIS}
          style={{ cursor: onSelectPlanet ? "pointer" : "default" }}
          onClick={() => onSelectPlanet?.(p)}
        >
          {PLANET_GLYPH[p]}
        </text>
        {onSelectPlanet && (
          <circle cx={x} cy={y - 4} r={13} fill="transparent" style={{ cursor: "pointer" }}
            onClick={() => onSelectPlanet(p)} />
        )}
      </Fragment>
    );
  });

  // star + moon overlay
  let overlay = null;
  if (star && typeof moonLon === "number") {
    const sL = star.lon;
    const [bx, by] = pt(sL, 191);
    const [six, siy] = pt(sL, 100);
    const [mx, my] = pt(moonLon, 150);
    const [ex, ey] = pt(sL, 150);
    const delta = ((sL - moonLon) % 360 + 360) % 360;
    const big = delta > 180 ? 1 : 0;
    overlay = (
      <>
        <line x1={six} y1={siy} x2={bx} y2={by} stroke={OX} strokeWidth={1.4} opacity={0.6} strokeDasharray="2 3" />
        <path d={`M ${mx} ${my} A 150 150 0 ${big} 0 ${ex} ${ey}`} fill="none" stroke={OX} strokeWidth={2} opacity={0.4} strokeLinecap="round" />
        <line x1={mx} y1={my} x2={six} y2={siy} stroke={OX} strokeWidth={1} opacity={0.3} />
        <text x={mx} y={my + 6} textAnchor="middle" fontSize={18} fill={LAPIS}>☽</text>
        <text x={bx} y={by + 6} textAnchor="middle" fontSize={22} fill={OX}
          filter={`drop-shadow(0 0 6px ${BRASS})`}>{star.glyph}</text>
      </>
    );
  }

  return (
    <svg viewBox="0 0 400 400" role="img" aria-label="Your sky">
      <circle cx={cx} cy={cy} r={rims[0]} fill="none" stroke={BRASS} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={rims[1]} fill="none" stroke={FAINT} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={rims[2]} fill="none" stroke={FAINT} strokeWidth={0.8} />
      <circle cx={cx} cy={cy} r={rims[3]} fill="rgba(38,49,92,.04)" stroke={FAINT} strokeWidth={0.8} />
      {divs}
      {planets}
      {overlay}
    </svg>
  );
}
