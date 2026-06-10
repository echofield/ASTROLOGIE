import Link from "next/link";
import type { CSSProperties } from "react";
import Header from "@/components/atlas/Header";
import { GOLD as G } from "@/lib/atlas-ui";
import { PRICING, PRODUCT_NAME } from "@/lib/brand";

export const metadata = { title: `The Reading — ${PRODUCT_NAME}` };

const label: CSSProperties = { fontFamily: G.mono, fontSize: 10.5, letterSpacing: ".28em", textTransform: "uppercase" };
const price: CSSProperties = { fontFamily: G.serif, fontSize: 34, letterSpacing: ".6px", marginTop: 16, lineHeight: 1 };
const name: CSSProperties = { fontFamily: G.serif, fontSize: "clamp(26px,2.2vw,32px)", letterSpacing: ".4px", marginTop: 24 };
const line: CSSProperties = { fontFamily: G.body, fontSize: 17, lineHeight: 1.6, marginTop: 18, maxWidth: "38ch", flex: 1, textWrap: "pretty" as CSSProperties["textWrap"] };

function Glyph({ muted = false }: { muted?: boolean }) {
  const c = muted ? G.slateDim : G.goldDeep;
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" aria-hidden>
      <circle cx="23" cy="23" r="19" strokeOpacity=".5" />
      <circle cx="23" cy="16" r="8" strokeOpacity=".5" />
      <circle cx="23" cy="23" r="2.4" fill={c} stroke="none" />
      <path d="M23 4v5M23 42v-5M4 23h5M42 23h-5" strokeOpacity=".6" />
    </svg>
  );
}

export default function ReadingOffer() {
  return (
    <main style={{ minHeight: "100svh", background: G.bg, backgroundAttachment: "fixed", color: G.ivory, fontFamily: G.body }}>
      <Header />
      <style>{`
        .alab-plaque{display:inline-flex;align-items:center;gap:13px;padding:15px 28px;border:1px solid ${G.gold};color:${G.goldBright};
          font-family:${G.mono};font-size:12px;letter-spacing:.28em;text-transform:uppercase;text-decoration:none;margin-top:8px;
          transition:background .6s ${G.ease},color .6s ${G.ease},border-color .6s ${G.ease}}
        .alab-plaque .ar{transition:transform .6s ${G.ease}}
        .alab-plaque:hover{background:rgba(194,162,95,.08);color:#f3e3bd;border-color:${G.goldBright}}
        .alab-plaque:hover .ar{transform:translateX(5px)}
        .alab-plaque.parked{border-color:${G.ruleSoft};color:${G.slate};cursor:default;pointer-events:none}
        @media(max-width:860px){.alab-offgrid{grid-template-columns:1fr!important}
          .alab-parked{border-left:0!important;border-top:1px solid ${G.ruleSoft}!important}}
      `}</style>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "max(124px,14vh) clamp(20px,5vw,56px) 90px" }}>
        <Link href="/" style={{ ...label, color: G.slate, textDecoration: "none" }}>← The Sky</Link>

        <div style={{ maxWidth: 660, margin: "34px 0 52px" }}>
          <div style={{ ...label, letterSpacing: ".4em", color: G.gold, marginBottom: 16 }}>The instrument, offered</div>
          <h1 style={{ fontFamily: G.serif, fontWeight: 400, fontSize: "clamp(38px,4.2vw,58px)", lineHeight: 1.02, letterSpacing: ".5px", margin: 0 }}>Have a Reading drawn</h1>
          <p style={{ fontFamily: G.serif, fontStyle: "italic", fontSize: "clamp(19px,1.9vw,23px)", lineHeight: 1.42, color: G.ivoryDim, marginTop: 18, textWrap: "pretty" }}>
            A reading drawn against the sky of a single moment, for a question you seal — and kept in your Cabinet to return to.
          </p>
          {/* the boundary, stated once, quietly — the entire pricing story */}
          <p style={{ ...label, color: G.slate, marginTop: 26, letterSpacing: ".24em" }}>
            The sky is free to watch. A reading is written by hand.
          </p>
        </div>

        <div className="alab-offgrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: `1px solid ${G.rule}` }}>
          {/* The Reading — live */}
          <article style={{ padding: "38px clamp(24px,3vw,38px) 34px", display: "flex", flexDirection: "column", alignItems: "flex-start", minHeight: 360 }}>
            <Glyph />
            <p style={{ ...name, color: G.ivory }}>The Reading</p>
            <p style={{ ...label, color: G.goldDeep, marginTop: 8 }}>A single moment</p>
            <p style={{ ...price, color: G.goldBright }}>{PRICING.currency}{PRICING.offer}</p>
            <p style={{ ...line, color: G.ivoryDim }}>A single reading, drawn against the sky of one moment and kept in your Cabinet — yours to return to.</p>
            <Link className="alab-plaque" href="/checkout">Have it drawn <span className="ar">→</span></Link>
          </article>
          {/* The Year — parked */}
          <article className="alab-parked" style={{ padding: "38px clamp(24px,3vw,38px) 34px", display: "flex", flexDirection: "column", alignItems: "flex-start", minHeight: 360, borderLeft: `1px solid ${G.ruleSoft}`, opacity: 0.6 }}>
            <Glyph muted />
            <p style={{ ...name, color: G.ivoryDim }}>The Year</p>
            <p style={{ ...label, color: G.slateDim, marginTop: 8 }}>The Standing</p>
            <p style={{ ...price, color: G.ivoryDim }}>€365</p>
            <p style={{ ...line, color: G.slate }}>A year with the sky, a day at a time. Every full moon drawn, every turning marked, your return kept — and the Day&rsquo;s Record gathering beneath it all.</p>
            <span className="alab-plaque parked">Soon</span>
          </article>
        </div>
      </div>
    </main>
  );
}
