"use client";

import Link from "next/link";
import { useState } from "react";
import AtlasChrome from "./AtlasChrome";
import Constellation, { fieldReadout } from "./Constellation";
import table from "@/data/constellations.json";
import type { ConstellationTable, ConstellationData } from "@/types/atlas";

// The Atlas — the twelve territories, one renderer. Ported from the export's
// Constellation Atlas.html (switcher + plate index + gnomonic render + editorial),
// reusing our <Constellation> renderer and constellations.json.
//
// Copy hold (per Mars's rule): the astronomy is REAL and computed, so it ships for
// all twelve — the constellation, the star facts (ed.cap), the classification
// (ed.eyebrow), the field readout. The editorial VOICE (ed.name/tagline/attr/lede)
// is final only for Pisces; the other eleven are draft scaffolding, so we hold them
// and mark the territory's reading as forthcoming, showing the real sign instead.

const SIGNS = (table as unknown as ConstellationTable).signs;
const ORDER = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
const DISPLAY: Record<string, string> = { aries: "Aries", taurus: "Taurus", gemini: "Gemini", cancer: "Cancer", leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Scorpius", sagittarius: "Sagittarius", capricorn: "Capricorn", aquarius: "Aquarius", pisces: "Pisces" };
const FINAL = new Set(["pisces"]); // only Pisces is final editorial; the rest hold for Mars's voice

export default function AtlasExplorer({ initial = "aries" }: { initial?: string }) {
  const [key, setKey] = useState(SIGNS[initial] ? initial : "aries");
  const sign = SIGNS[key] as ConstellationData;
  const fr = fieldReadout(sign);
  const final = FINAL.has(key);
  // held title — the real sign + constellation, parsed from the (factual) cap; never the draft poetic name
  const m = sign.ed.cap.match(/<b>([^<]+)<\/b>\s*[—–-]\s*([^<]+)</);
  const realName = m ? m[1] : DISPLAY[key];
  const realEpithet = m ? m[2].trim() : "";

  return (
    <div className="atlas-explorer">
      <style>{ATLAS_CSS}</style>
      <AtlasChrome />

      <header className="atlas-bar">
        <Link href="/">← The Atlas</Link>
        <span className="atlas-plate">{sign.plate}</span>
      </header>

      <nav className="switcher" aria-label="The twelve territories">
        {ORDER.map((k) => (
          <button key={k} className={k === key ? "on" : ""} aria-pressed={k === key} onClick={() => setKey(k)}>{DISPLAY[k]}</button>
        ))}
      </nav>

      <section className="atlas-hero">
        <div className="sky-stage">
          <Constellation key={key} data={sign} />
          <div className="sky-cap">
            <span dangerouslySetInnerHTML={{ __html: sign.ed.cap }} />
            <span className="field">Field {fr.wDeg}° × {fr.hDeg}° · {fr.stars} stars</span>
          </div>
        </div>

        <div className="editorial fade" key={key}>
          <p className="eyebrow" dangerouslySetInnerHTML={{ __html: sign.ed.eyebrow }} />
          {final ? (
            <>
              <h1 className="terr-name" dangerouslySetInnerHTML={{ __html: sign.ed.name }} />
              <p className="tagline">{sign.ed.tagline}</p>
              <p className="attr" dangerouslySetInnerHTML={{ __html: sign.ed.attr }} />
              <p className="lede">{sign.ed.lede}</p>
            </>
          ) : (
            <>
              <h1 className="terr-name">{realName}{realEpithet && <em>{realEpithet}</em>}</h1>
              <p className="held">The sky is catalogued. The reading is still being written, by hand.</p>
              <p className="held-sub">Each of the twelve territories is composed one at a time — this one is on the desk.</p>
            </>
          )}
          <Link className="plaque" href="/reading">Begin the Reading <span className="ar">→</span></Link>
        </div>
      </section>

      <p className="proofnote">The AstroLab Atlas <b>·</b> twelve territories, one renderer <b>·</b> real star tables, gnomonic projection auto-fit per field</p>
    </div>
  );
}

const ATLAS_CSS = `
.atlas-explorer{position:relative;z-index:2;min-height:100vh}
.atlas-explorer .atlas-bar{position:fixed;top:0;left:0;right:0;z-index:30;display:flex;align-items:center;justify-content:space-between;
  padding:28px 56px;font-family:var(--mono);font-size:12px;letter-spacing:.3em;text-transform:uppercase}
.atlas-explorer .atlas-bar a{color:var(--slate);text-decoration:none;transition:color .5s var(--ease)}
.atlas-explorer .atlas-bar a:hover{color:var(--ivory)}
.atlas-explorer .atlas-plate{color:var(--gold-deep);letter-spacing:.36em}
.atlas-explorer .switcher{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:40;display:flex;flex-wrap:wrap;justify-content:center;
  max-width:calc(100vw - 340px);border:1px solid var(--rule-soft);background:rgba(8,12,26,.6);backdrop-filter:blur(5px)}
.atlas-explorer .switcher button{font-family:var(--mono);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--slate);
  background:none;border:0;border-right:1px solid var(--rule-soft);border-bottom:1px solid var(--rule-soft);padding:11px 17px;cursor:pointer;
  transition:color .4s var(--ease),background .4s var(--ease)}
.atlas-explorer .switcher button:last-child{border-right:0}
.atlas-explorer .switcher button:hover{color:var(--ivory)}
.atlas-explorer .switcher button.on{color:var(--gold-bright);background:rgba(194,162,95,.07)}
.atlas-explorer .atlas-hero{min-height:100vh;display:grid;grid-template-columns:1.55fr 1fr;gap:40px;align-items:center;
  max-width:1500px;margin:0 auto;padding:12vh 56px 8vh}
.atlas-explorer .sky-stage{position:relative;width:100%}
.atlas-explorer .sky-cap{margin-top:16px;display:flex;gap:22px;flex-wrap:wrap;font-family:var(--mono);font-size:11px;
  letter-spacing:.24em;text-transform:uppercase;color:var(--slate-dim)}
.atlas-explorer .sky-cap b{color:var(--gold-deep);font-weight:400}
.atlas-explorer .sky-cap .field{color:var(--slate)}
.atlas-explorer .editorial{max-width:430px}
.atlas-explorer .terr-name{font-family:var(--serif);font-weight:400;font-size:clamp(52px,4.8vw,74px);line-height:.98;color:var(--ivory);letter-spacing:.5px;margin-bottom:18px}
.atlas-explorer .terr-name em{font-style:italic;display:block}
.atlas-explorer .tagline{font-family:var(--serif);font-style:italic;font-size:23px;line-height:1.32;color:var(--gold);opacity:.92;margin-bottom:30px;max-width:24ch}
.atlas-explorer .attr{font-family:var(--mono);font-size:11.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--ivory-dim);
  padding:16px 0;border-top:1px solid var(--rule-soft);border-bottom:1px solid var(--rule-soft);margin-bottom:28px}
.atlas-explorer .attr .sep{color:var(--gold-deep);margin:0 10px}
.atlas-explorer .lede{font-family:var(--body);font-size:18px;line-height:1.62;color:var(--ivory-dim);max-width:40ch;margin-bottom:38px}
.atlas-explorer .held{font-family:var(--serif);font-style:italic;font-size:22px;line-height:1.34;color:var(--gold);opacity:.82;margin-bottom:12px;max-width:26ch}
.atlas-explorer .held-sub{font-family:var(--body);font-size:16px;line-height:1.6;color:var(--slate);max-width:36ch;
  padding-top:18px;border-top:1px solid var(--rule-soft);margin-bottom:34px}
.atlas-explorer .proofnote{position:fixed;left:56px;bottom:26px;z-index:20;font-family:var(--mono);font-size:10.5px;
  letter-spacing:.22em;text-transform:uppercase;color:var(--slate-dim);max-width:46vw}
.atlas-explorer .proofnote b{color:var(--gold-deep);font-weight:400}
.atlas-explorer .fade{animation:atlasFade .9s var(--ease) both}
@keyframes atlasFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (max-width:1080px){
  .atlas-explorer .atlas-hero{grid-template-columns:1fr;gap:44px;text-align:center;padding-top:128px}
  .atlas-explorer .editorial{max-width:560px;margin:0 auto}
  .atlas-explorer .eyebrow,.atlas-explorer .attr,.atlas-explorer .sky-cap{justify-content:center}
  .atlas-explorer .tagline,.atlas-explorer .lede,.atlas-explorer .held,.atlas-explorer .held-sub{margin-left:auto;margin-right:auto}
  .atlas-explorer .switcher{max-width:calc(100vw - 40px)}
  .atlas-explorer .proofnote{position:static;max-width:none;text-align:center;margin:26px auto 60px;padding:0 40px}
}
@media (prefers-reduced-motion:reduce){.atlas-explorer .fade{animation:none}}
`;
