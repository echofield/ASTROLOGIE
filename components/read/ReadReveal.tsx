"use client";

import { useState } from "react";
import { GOLD as G } from "@/lib/atlas-ui";

// The reading reveal — the €60 payoff, ported from The AstroLab.html #reveal.
// Sealed letter (the question) → break the seal → descent → the reading surfaces
// block by block, drop-cap + wax-seal colophon. The customer has already paid, so
// the threshold shows no price (the design's .no-price variant).
export interface RevealRead { signature: string; chart: string; pattern: string; star: string; yearAhead: string; counsel: string; generatedAt?: string }

const ORDER = ["signature", "chart", "pattern", "star", "yearAhead", "counsel"] as const;

function richParagraphs(text: string, drop: boolean) {
  const paras = text.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  return paras.map((p, pi) => {
    const segs = p.split("**");
    return (
      <p key={pi} className={`rv-p${drop && pi === 0 ? " drop" : ""}`}>
        {segs.map((s, si) => (si % 2 === 1 ? <span key={si} className="ill">{s}</span> : <span key={si}>{s}</span>))}
      </p>
    );
  });
}

export default function ReadReveal({ read, question, lang = "en", onClose }: { read: RevealRead; question: string; lang?: "en" | "fr"; onClose: () => void }) {
  const [open, setOpen] = useState(false); // false = threshold, true = descended
  const [deepen, setDeepen] = useState(false);
  const [gone, setGone] = useState(false);
  const [up, setUp] = useState(0);
  const [exit, setExit] = useState(false);

  const t = lang === "fr"
    ? { sealed: "Une lecture scellée", line: "Le ciel a vu cette question la nuit où vous l'avez scellée — et garde sa réponse, close, depuis lors.", brk: "Briser le sceau", eyebrow: "La Lecture", kicker: "Tirée pour la question que vous portiez", asked: "Vous avez demandé", labels: { signature: "Signature", chart: "Thème", pattern: "Motif", star: "Votre étoile", yearAhead: "L'année à venir", counsel: "Conseil" }, colophon: "Scellée par The AstroLab — lue une fois", close: "Fermer la lecture" }
    : { sealed: "A sealed reading", line: "The sky witnessed this question the night you sealed it — and has held its answer, unopened, ever since.", brk: "Break the seal", eyebrow: "The Reading", kicker: "Drawn for the question you carried", asked: "You asked", labels: { signature: "Signature", chart: "Chart", pattern: "Pattern", star: "Your star", yearAhead: "Year ahead", counsel: "Counsel" }, colophon: "Sealed by The AstroLab — read once", close: "Close the reading" };

  function breakSeal() {
    if (open) return;
    setDeepen(true);
    setTimeout(() => setGone(true), 620);
    setTimeout(() => {
      setOpen(true);
      const total = ORDER.length + 3; // eyebrow, kicker, asked + sections (counsel last) + colophon counted within
      for (let i = 0; i < total + 2; i++) setTimeout(() => setUp((u) => Math.max(u, i + 1)), i === 0 ? 40 : 360 + i * 150);
      setTimeout(() => setExit(true), 1200);
    }, 980);
  }

  // block index allocator so each rises in sequence
  let bi = 0;
  const B = () => bi++;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120, overflowY: "auto", overflowX: "hidden",
      background: "radial-gradient(140% 110% at 50% -10%, #0a1430 0%, #060c1d 40%, #03060f 72%, #010309 100%)" }}>
      <style>{`
        .rv-deepen{position:fixed;inset:0;z-index:2;pointer-events:none;opacity:0;
          background:radial-gradient(125% 95% at 50% 32%, transparent 0%, rgba(2,4,10,.45) 56%, rgba(1,2,6,.9) 100%);transition:opacity 1.5s ${G.ease}}
        .rv-deepen.on{opacity:1}
        .rv-exit{position:fixed;top:26px;right:34px;z-index:10;font-family:${G.mono};font-size:11px;letter-spacing:.26em;text-transform:uppercase;
          color:${G.slateDim};background:none;border:0;cursor:pointer;transition:color .5s ${G.ease},opacity 1.4s ${G.ease};opacity:0}
        .rv-exit.show{opacity:1}.rv-exit:hover{color:${G.ivory}}
        .rv-threshold{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
          padding:8vh 32px;transition:opacity 1.6s ${G.ease},transform 1.6s ${G.ease}}
        .rv-threshold.gone{opacity:0;transform:translateY(-40px) scale(.94);pointer-events:none}
        .rv-th-eyebrow{font-family:${G.mono};font-size:11.5px;letter-spacing:.4em;text-transform:uppercase;color:${G.gold};margin-bottom:26px}
        .rv-th-question{font-family:${G.serif};font-weight:500;font-size:clamp(30px,3.6vw,46px);line-height:1.08;color:${G.ivory};letter-spacing:.4px;max-width:18ch;margin-bottom:26px;text-wrap:pretty}
        .rv-th-line{font-family:${G.serif};font-style:italic;font-size:clamp(20px,2.1vw,26px);line-height:1.42;color:${G.ivoryDim};max-width:30ch;margin-bottom:40px}
        .rv-brk{display:inline-flex;align-items:center;gap:13px;padding:16px 32px;border:1px solid ${G.gold};color:${G.goldBright};background:none;cursor:pointer;
          font-family:${G.mono};font-size:12px;letter-spacing:.28em;text-transform:uppercase;transition:background .6s ${G.ease},color .6s,border-color .6s}
        .rv-brk:hover{background:rgba(194,162,95,.08);color:#f3e3bd;border-color:${G.goldBright}}
        .rv-reading{position:relative;z-index:5;max-width:760px;margin:0 auto;padding:18vh 40px 22vh}
        .rv-block{opacity:0;transform:translateY(26px);transition:opacity 1.05s ${G.ease},transform 1.05s ${G.ease}}
        .rv-block.up{opacity:1;transform:none}
        .rv-eyebrow{font-family:${G.mono};font-size:12px;letter-spacing:.36em;text-transform:uppercase;color:${G.goldDeep};margin-bottom:30px}
        .rv-kicker{font-family:${G.mono};font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${G.slate};margin-bottom:18px}
        .rv-asked{font-family:${G.serif};font-style:italic;font-size:22px;color:${G.slate};margin-bottom:50px;letter-spacing:.2px}
        .rv-asked b{color:${G.ivoryDim};font-weight:400}
        .rv-rule{height:1px;background:linear-gradient(90deg,${G.rule},transparent);margin:8px 0 46px}
        .rv-seclabel{font-family:${G.mono};font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${G.goldDeep};margin:0 0 14px}
        .rv-p{font-family:${G.body};font-size:20px;line-height:1.78;color:${G.ivoryDim};margin-bottom:22px;max-width:62ch}
        .rv-p .ill{color:${G.goldBright}}
        .rv-p.drop::first-letter{font-family:${G.serif};font-size:4.2em;float:left;line-height:.72;padding:8px 16px 0 0;color:${G.gold};font-style:normal}
        .rv-sec{margin-bottom:38px}
        .rv-colophon{margin-top:64px;padding-top:42px;border-top:1px solid ${G.ruleSoft};display:flex;align-items:center;gap:26px;flex-wrap:wrap;justify-content:space-between}
        .rv-ctext{font-family:${G.mono};font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:${G.slate};line-height:2}
        .rv-ctext b{color:${G.goldDeep};font-weight:400}
        @media(max-width:760px){.rv-reading{padding:14vh 24px 18vh}.rv-th-question{max-width:14ch}.rv-p{font-size:18px}}
        @media(prefers-reduced-motion:reduce){.rv-block{opacity:1!important;transform:none!important}}
      `}</style>

      <div className={`rv-deepen${deepen ? " on" : ""}`} />
      <button className={`rv-exit${exit ? " show" : ""}`} onClick={onClose}>{t.close}</button>

      {/* threshold */}
      {!open && (
        <div className={`rv-threshold${gone ? " gone" : ""}`}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ marginBottom: 30 }} aria-hidden>
            <circle cx="60" cy="60" r="50" stroke={G.gold} strokeOpacity=".15" />
            <circle cx="60" cy="48" r="22" stroke={G.gold} strokeOpacity=".5" />
            <circle cx="60" cy="60" r="3" fill={G.goldBright} />
            <circle cx="60" cy="26" r="2" fill="#cbb583" />
          </svg>
          <p className="rv-th-eyebrow">{t.sealed}</p>
          <h2 className="rv-th-question">{question}</h2>
          <p className="rv-th-line">{t.line}</p>
          <button className="rv-brk" onClick={breakSeal}>{t.brk} <span>→</span></button>
        </div>
      )}

      {/* the reading */}
      {open && (
        <article className="rv-reading">
          {(() => { const i = B(); return <p className={`rv-block rv-eyebrow${up > i ? " up" : ""}`}>{t.eyebrow}</p>; })()}
          {(() => { const i = B(); return <p className={`rv-block rv-kicker${up > i ? " up" : ""}`}>{t.kicker}</p>; })()}
          {(() => { const i = B(); return <p className={`rv-block rv-asked${up > i ? " up" : ""}`}>{t.asked} — <b>&ldquo;{question}&rdquo;</b></p>; })()}
          {(() => { const i = B(); return <div className={`rv-block rv-rule${up > i ? " up" : ""}`} />; })()}
          {ORDER.map((k, idx) => {
            const i = B();
            return (
              <div key={k} className={`rv-block rv-sec${up > i ? " up" : ""}`}>
                <p className="rv-seclabel">{t.labels[k]}</p>
                {richParagraphs(read[k] ?? "", idx === 0)}
              </div>
            );
          })}
          {(() => { const i = B(); return (
            <div className={`rv-block rv-colophon${up > i ? " up" : ""}`}>
              <p className="rv-ctext">{t.colophon}<br /><b>The AstroLab</b></p>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" strokeLinecap="round" aria-hidden>
                <circle cx="32" cy="32" r="28" stroke="#8a7140" strokeOpacity=".6" />
                <circle cx="32" cy="32" r="21" stroke="#c2a25f" strokeOpacity=".4" />
                <circle cx="32" cy="26" r="12" stroke="#e3c884" strokeOpacity=".55" />
                <circle cx="32" cy="32" r="2" stroke="#e3c884" />
                <path d="M32 11v6M32 53v-6M11 32h6M53 32h-6" stroke="#c2a25f" strokeOpacity=".5" />
              </svg>
            </div>
          ); })()}
        </article>
      )}
    </div>
  );
}
