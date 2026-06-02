"use client";

import { Fragment } from "react";
import type { Passage } from "@/lib/types";
import { DOMAIN_BY_ID } from "@/lib/domains";
import { aspectInfo, lonLabel } from "@/lib/sky";
import { rgbOf, rgbaOf, type PaletteFrame } from "@/lib/palette";

const CX = 200;
const CY = 200;
function pt(L: number, r: number): [number, number] {
  const a = ((180 + L) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}

function reflection(passages: Passage[]): string {
  if (passages.length === 0) return "";
  const counts: Record<string, number> = {};
  for (const p of passages) counts[p.domain] = (counts[p.domain] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const dom = DOMAIN_BY_ID[top[0] as keyof typeof DOMAIN_BY_ID];
  return `You act most under <b>${dom.planet}</b> — ${top[1]} of your ${passages.length} sealed passages opened there. The kind of move you keep choosing is to <b>${dom.title.split(" — ")[0].toLowerCase()}</b>.`;
}

interface Props {
  passages: Passage[];
  colors: PaletteFrame["colors"];
}

export default function Constellation({ passages, colors }: Props) {
  const acc = rgbOf(colors.accent);
  const faint = rgbaOf(colors.ink, 0.3);
  const soft = rgbaOf(colors.ink, 0.5);

  if (passages.length === 0) {
    return (
      <div className="empty">
        Your sky is still dark.
        <br />
        Seal your first passage and a star will appear here.
      </div>
    );
  }

  const stars = passages.map((p, i) => {
    const r = 150 - (i % 5) * 18;
    return { ...p, xy: pt(p.moonLon, r) };
  });

  return (
    <div>
      <div className="wheel">
        <svg viewBox="0 0 400 400" role="img" aria-label="Your constellation">
          <circle cx={CX} cy={CY} r={160} fill="none" stroke={faint} strokeWidth={0.6} />
          <circle cx={CX} cy={CY} r={100} fill="none" stroke={faint} strokeWidth={0.5} />
          {/* connecting lines in seal order */}
          {stars.slice(1).map((s, i) => {
            const a = stars[i].xy;
            const b = s.xy;
            return (
              <line key={`l${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
                stroke={acc} strokeWidth={0.7} opacity={0.3} />
            );
          })}
          {stars.map((s, i) => (
            <Fragment key={s.id}>
              <circle cx={s.xy[0]} cy={s.xy[1]} r={i === stars.length - 1 ? 3.4 : 2.6}
                fill={acc} filter={`drop-shadow(0 0 5px ${acc})`} />
            </Fragment>
          ))}
          <text x={CX} y={CY + 4} textAnchor="middle" fontSize={12} fill={soft}
            fontStyle="italic">
            {passages.length} {passages.length === 1 ? "star" : "stars"}
          </text>
        </svg>
      </div>

      <div className="reflect" dangerouslySetInnerHTML={{ __html: reflection(passages) }} />

      <span className="section-k">Your sealed passages</span>
      <div className="passages">
        {[...passages].reverse().map((p) => {
          const dom = DOMAIN_BY_ID[p.domain];
          const asp = aspectInfo(p.aspect);
          const d = new Date(p.sealedAt);
          return (
            <div className="passage" key={p.id}>
              <div className="dot">{dom.glyph}</div>
              <div className="meta">
                <div className="it">{p.intention}</div>
                <div className="sub">
                  {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  {" · "}Moon {asp.glyph} {dom.planet} · {lonLabel(p.moonLon)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
