"use client";

import { useState } from "react";
import Constellation, { fieldReadout } from "@/components/atlas/Constellation";
import type { ConstellationTable } from "@/types/atlas";
import tableJson from "@/data/constellations.json";

// Proof harness: one renderer, twelve fields, auto-fitting. Verifies Aries
// (sparse), Gemini (tall), Pisces (wide, crosses 0ʰ) all fill the box.
const table = tableJson as unknown as ConstellationTable;

const ORDER = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"]
  .filter((k) => table.signs[k]);
const DISPLAY: Record<string, string> = {
  aries:"Aries", taurus:"Taurus", gemini:"Gemini", cancer:"Cancer", leo:"Leo", virgo:"Virgo",
  libra:"Libra", scorpio:"Scorpius", sagittarius:"Sagittarius", capricorn:"Capricorn", aquarius:"Aquarius", pisces:"Pisces",
};

export default function ConstellationProof() {
  const [key, setKey] = useState(ORDER[0]);
  const sign = table.signs[key];
  const f = fieldReadout(sign);

  return (
    <main style={{
      minHeight: "100dvh", color: "#ece4d2", overflowX: "hidden",
      background: "radial-gradient(150% 100% at 50% -25%,#0f1a35 0%,#0a1124 34%,#070b18 64%,#05080f 100%)",
      fontFamily: "'EB Garamond', Georgia, serif",
    }}>
      <style>{CSS}</style>

      <header className="pf-top">
        <a href="/wheel3">← The Atlas</a>
        <span className="plate">{sign.plate}</span>
      </header>

      <nav className="pf-switch">
        {ORDER.map((k) => (
          <button key={k} className={k === key ? "on" : ""} onClick={() => setKey(k)}>{DISPLAY[k] || k}</button>
        ))}
      </nav>

      <section className="pf-hero">
        <div className="pf-stage">
          <Constellation data={sign} />
          <div className="pf-cap">
            <span dangerouslySetInnerHTML={{ __html: sign.ed.cap }} />
            <span className="field">Field {f.wDeg}° × {f.hDeg}° · {f.stars} stars</span>
          </div>
        </div>

        <div className="pf-ed" key={key}>
          <p className="eyebrow" dangerouslySetInnerHTML={{ __html: sign.ed.eyebrow }} />
          <h1 className="tname" dangerouslySetInnerHTML={{ __html: sign.ed.name }} />
          <p className="tagline">{sign.ed.tagline}</p>
          <p className="attr" dangerouslySetInnerHTML={{ __html: sign.ed.attr }} />
          <p className="lede">{sign.ed.lede}</p>
          <span className="plaque">{sign.ed.plaque} <span className="ar">→</span></span>
        </div>
      </section>

      <p className="pf-note">Constellation System · one renderer, twelve fields · real HYG star tables, gnomonic projection auto-fit per field</p>
    </main>
  );
}

const CSS = `
.pf-top{position:fixed;top:0;left:0;right:0;z-index:30;display:flex;align-items:center;justify-content:space-between;
  padding:24px 48px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.3em;text-transform:uppercase}
.pf-top a{color:#6f7894;text-decoration:none;transition:color .4s}
.pf-top a:hover{color:#ece4d2}
.pf-top .plate{color:#8a7140;letter-spacing:.36em}
.pf-switch{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:40;display:flex;flex-wrap:wrap;justify-content:center;
  max-width:calc(100vw - 320px);border:1px solid rgba(194,162,95,.09);background:rgba(8,12,26,.6);backdrop-filter:blur(5px)}
.pf-switch button{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#6f7894;
  background:none;border:0;border-right:1px solid rgba(194,162,95,.09);border-bottom:1px solid rgba(194,162,95,.09);padding:10px 15px;cursor:pointer;transition:color .3s,background .3s}
.pf-switch button:last-child{border-right:0}
.pf-switch button:hover{color:#ece4d2}
.pf-switch button.on{color:#e3c884;background:rgba(194,162,95,.07)}
.pf-hero{min-height:100vh;display:grid;grid-template-columns:1.55fr 1fr;gap:40px;align-items:center;max-width:1500px;margin:0 auto;padding:12vh 48px 8vh}
.pf-stage{position:relative;width:100%}
.pf-cap{margin-top:16px;display:flex;gap:22px;flex-wrap:wrap;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#4a5270}
.pf-cap b{color:#8a7140;font-weight:400}
.pf-cap .field{color:#6f7894}
.pf-ed{max-width:430px;animation:pfFade .9s cubic-bezier(.165,.84,.44,1) both}
@keyframes pfFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.pf-ed .eyebrow{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:#6f7894;margin-bottom:26px}
.pf-ed .eyebrow b{color:#c2a25f;font-weight:400}
.pf-ed .tname{font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;font-size:clamp(52px,4.8vw,74px);line-height:.98;color:#ece4d2;letter-spacing:.5px;margin-bottom:18px}
.pf-ed .tname em{font-style:italic;display:block}
.pf-ed .tagline{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:23px;line-height:1.32;color:#c2a25f;opacity:.92;margin-bottom:30px;max-width:24ch}
.pf-ed .attr{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;letter-spacing:.26em;text-transform:uppercase;color:#b6b1a3;padding:16px 0;border-top:1px solid rgba(194,162,95,.09);border-bottom:1px solid rgba(194,162,95,.09);margin-bottom:28px}
.pf-ed .attr .sep{color:#8a7140;margin:0 10px}
.pf-ed .lede{font-size:18px;line-height:1.62;color:#b6b1a3;max-width:40ch;margin-bottom:38px}
.pf-ed .plaque{display:inline-flex;align-items:center;gap:16px;padding:17px 30px;border:1px solid #c2a25f;color:#e3c884;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.28em;text-transform:uppercase}
.pf-note{position:fixed;left:48px;bottom:22px;z-index:20;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:#4a5270;max-width:46vw}
@media (max-width:1080px){.pf-hero{grid-template-columns:1fr;gap:40px;text-align:center;padding-top:120px}.pf-ed{max-width:560px;margin:0 auto}.pf-note{position:static;text-align:center;margin:20px auto 40px;max-width:none}}
`;
