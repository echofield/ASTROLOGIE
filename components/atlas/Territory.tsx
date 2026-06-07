"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Lenis from "lenis";
import Constellation from "@/components/atlas/Constellation";
import type { ConstellationData, Territory as Terr, Relic } from "@/types/atlas";
import { getDiscovered, discover, syncDiscoveries } from "@/lib/atlas/discoveries";
import { logAura, flushAura } from "@/lib/atlas/aura";

// Faithful React port of Pisces Territory v3.html — the layered-depth descent
// and codex grammar — data-driven for all 12, wired to the real Constellation
// renderer. Adds the L3 artifact overlay + the /api/genius free-taste seam +
// the "Begin the reading" bridge into Backend A.

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export default function Territory({ t, cdata }: { t: Terr & { name: string; key: string }; cdata: ConstellationData }) {
  const router = useRouter();
  const constLayer = useRef<HTMLDivElement>(null);
  const skyCanvas = useRef<HTMLCanvasElement>(null);
  const [openRelic, setOpenRelic] = useState<Relic | null>(null);
  const [whisper, setWhisper] = useState<string | null>(null);
  const [found, setFound] = useState<Set<string>>(new Set());

  // free-taste Genius line (existing /api/genius; null until the model is live)
  useEffect(() => {
    let live = true;
    fetch("/api/genius", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        star: { name: t.realm, must: t.tagline },
        archetype: { name: t.arch, essence: t.keywords.join(", ") },
        phase: "arrived", reach: { gap: 0, days: 0 },
      }),
    }).then((r) => r.json()).then((d) => { if (live && d?.line) setWhisper(d.line); }).catch(() => {});
    return () => { live = false; };
  }, [t.key, t.realm, t.tagline, t.arch, t.keywords]);

  // discovery state: localStorage first, then merge the cloud; log arrival
  useEffect(() => {
    setFound(new Set(getDiscovered()));
    logAura("territory_enter", { territory: t.key });
    flushAura();
    syncDiscoveries().then((ids) => setFound(new Set(ids))).catch(() => {});
  }, [t.key]);

  // ambient canvas sky (ported from v3)
  useEffect(() => {
    const c = skyCanvas.current; if (!c) return;
    const x = c.getContext("2d"); if (!x) return;
    let s: any[] = [], W = 0, H = 0, raf = 0; const dpr = Math.min(devicePixelRatio, 2);
    const size = () => {
      W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr; c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px";
      const n = Math.min(300, Math.max(180, Math.round(innerWidth * innerHeight / 7000)));
      s = Array.from({ length: n }, () => { const a = Math.random() * 6.283, sp = (Math.random() * 0.03 + 0.012) * dpr;
        return { x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 0.9 + 0.25) * dpr, base: Math.random() * 0.34 + 0.08, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, ph: Math.random() * 6.283, gold: Math.random() < 0.08 }; });
    };
    const frame = (t0: number) => { x.clearRect(0, 0, W, H);
      for (const p of s) { p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x += W; else if (p.x > W) p.x -= W; if (p.y < 0) p.y += H; else if (p.y > H) p.y -= H;
        const a = p.base * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t0 / 4000 * 6.283 + p.ph)));
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fillStyle = p.gold ? `rgba(226,200,132,${a})` : `rgba(214,222,240,${a})`; x.fill(); }
      raf = requestAnimationFrame(frame); };
    size(); addEventListener("resize", size); raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); };
  }, []);

  // depth: Lenis + emerge/recede + constellation parallax (ported from v3)
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const layers = Array.from(document.querySelectorAll<HTMLElement>(".tl-layer"));
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window && !reduce) {
      io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io!.unobserve(e.target); } }), { threshold: 0.18, rootMargin: "0px 0px -10% 0px" });
      layers.forEach((l) => io!.observe(l));
    } else { layers.forEach((l) => l.classList.add("in")); }

    let lenis: Lenis | null = null;
    if (!reduce) lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.9, touchMultiplier: 1.1 });
    const getY = () => (lenis ? (lenis as any).scroll : window.scrollY);
    let raf = 0;
    const update = () => {
      const y = getY(), vh = innerHeight, p = y / vh;
      if (constLayer.current) {
        let o = p <= 1 ? 1 - 0.92 * p : p < 2.4 ? 0.08 * (1 - (p - 1) / 1.4) : 0;
        constLayer.current.style.opacity = Math.max(o, 0).toFixed(3);
        constLayer.current.style.transform = `translate3d(0,${(-y * 0.3).toFixed(1)}px,0) scale(${(1 - Math.min(p, 2) * 0.05).toFixed(3)})`;
      }
      const cy = vh / 2;
      for (const sec of layers) { const r = sec.getBoundingClientRect(), c = r.top + r.height / 2, d = (cy - c) / vh;
        if (d > 0.02) { const k = Math.min(d / 0.62, 1); sec.style.opacity = (1 - 0.8 * k).toFixed(3); sec.style.transform = `translate3d(0,${(-k * 24).toFixed(1)}px,0) scale(${(1 - k * 0.035).toFixed(3)})`; }
        else { sec.style.opacity = "1"; sec.style.transform = "none"; } }
    };
    const loop = (time: number) => { if (lenis) lenis.raf(time); update(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop); addEventListener("resize", update);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", update); if (lenis) lenis.destroy(); io?.disconnect(); };
  }, []);

  const descend = () => { const el = document.getElementById("tl-s1"); if (el) el.scrollIntoView({ behavior: "smooth" }); };
  const foundCount = t.relics.filter((r) => found.has(r.id)).length;
  const recover = async (r: Relic) => { const ids = await discover(t.key, r.id); setFound(new Set(ids)); };

  return (
    <div className="tl-root">
      <style>{CSS}</style>
      <canvas ref={skyCanvas} className="tl-sky" />
      <div className="tl-grain" />

      <div className="tl-const" ref={constLayer}>
        <div className="tl-const-inner"><Constellation data={cdata} /></div>
      </div>

      <header className="tl-top">
        <button onClick={() => router.push("/")}>← The Atlas</button>
        <span className="mid">The Astrolab</span>
        <span className="plate">{t.plate}</span>
      </header>

      {/* HERO */}
      <section className="tl-layer tl-hero" id="tl-hero">
        <div className="ed">
          <p className="eyebrow">Territory <b>{ROMAN[t.i]}</b> · {t.modality} {t.el}</p>
          <h1 className="tname">{t.nameLead}<em>{t.nameEm}</em></h1>
          <p className="tagline">{t.tagline}</p>
          <p className="attr">{t.keywords.map((k, i) => <span key={k}>{i > 0 && <span className="sep">·</span>}{k}</span>)}</p>
          <p className="lede">{t.lede}</p>
          {whisper && <p className="whisper">“{whisper}”</p>}
          <button className="plaque" onClick={() => { logAura("reading_opened", { territory: t.key }); router.push("/cabinet"); }}>Begin the reading <span className="ar">→</span></button>
        </div>
        <div className="skycap">{t.skyCap.map((s, i) => <span key={i}>{s}</span>)}</div>
        <button className="scroll-hint" onClick={descend}><span>Descend</span><span className="ln" /></button>
      </section>

      {/* I — PASSAGE */}
      <section className="tl-layer tl-pass" id="tl-s1">
        <div className="lw passage">
          <div className="sec-head em"><span className="num">I.</span><h2>On {t.realm.replace(/^The /, "the ")}</h2><span className="rule" /></div>
          <p className="lead em">{t.passage.lead}</p>
          {t.passage.paras.map((para, i) => <p key={i} className={"em soft" + (i === 0 ? " drop" : "")} style={{ ["--d" as string]: `${1400 + i * 160}ms` }}>{para}</p>)}
        </div>
      </section>

      {/* II — ARCHIVE */}
      <section className="tl-layer" id="tl-s2">
        <div className="lw">
          <div className="sec-head em"><span className="num">II.</span><h2>The Archive</h2><span className="rule" /></div>
          <div className="archive">
            {t.archive.map((e, i) => (
              <div className="entry em" key={e.no} style={{ ["--d" as string]: `${i * 160}ms` }}>
                <div className="entry-glyph"><svg viewBox="0 0 48 48"><path d={e.glyph} /></svg></div>
                <div><p className="entry-no">{e.no}</p><p className="entry-title">{e.title}</p><p className="entry-desc">{e.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* III — RELICS */}
      <section className="tl-layer" id="tl-s3">
        <div className="lw">
          <div className="sec-head em"><span className="num">III.</span><h2>Relics of the Deep</h2><span className="rule" /></div>
          <div className="relic-intro">
            <p className="em">Four objects are said to rest within this territory. Most have never been drawn up.</p>
            <span className="ledger em" style={{ ["--d" as string]: "1400ms" }}>Recovered <span className="ticks">{t.relics.map((r, i) => <i key={i} className={"t" + (i < foundCount ? " on" : "")} />)}</span> {foundCount} / {t.relics.length}</span>
          </div>
          <div className="relics">
            {t.relics.map((r) => (
              <button className={"relic em" + (found.has(r.id) ? " found" : "")} key={r.id} style={{ ["--d" as string]: `${["I","II","III","IV"].indexOf(r.ordinal) * 300}ms` }} onClick={() => setOpenRelic(r)}>
                <p className="relic-no">{r.ordinal}</p>
                <div className="relic-sigil"><svg viewBox="0 0 68 68"><path d={r.sigil} /></svg></div>
                <h3>{r.name}</h3>
                <p>{r.blurb}</p>
                <div className="status"><span className="dot" /> {found.has(r.id) ? "Recovered" : r.state === "within_reach" ? "Within reach" : "Sealed"}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* NAV */}
      <section className="tl-layer tl-nav" id="tl-s4">
        <div className="lw">
          <nav className="atlas-nav em">
            <button className="nav-prev" onClick={() => router.push(`/sign/${t.neighbors.prev.slug}`)}><span className="nav-k">← Territory {ROMAN[(t.i + 11) % 12]}</span><span className="nav-t">{t.neighbors.prev.label}</span></button>
            <span className="nav-home"><button onClick={() => router.push("/")}><span className="h">Return to the Atlas</span></button></span>
            <button className="nav-next" onClick={() => router.push(`/sign/${t.neighbors.next.slug}`)}><span className="nav-k">Territory {ROMAN[(t.i + 1) % 12]} →</span><span className="nav-t">{t.neighbors.next.label}</span></button>
          </nav>
          <p className="colophon em" style={{ ["--d" as string]: "200ms" }}>The Astrolab Atlas <span className="g">✦</span> {t.plate} · {t.sign} <span className="g">✦</span> Catalogued from the observed sky</p>
        </div>
      </section>

      {/* L3 — ARTIFACT OVERLAY */}
      {openRelic && (
        <div className="tl-l3" onClick={() => setOpenRelic(null)}>
          <div className="tl-l3-card" onClick={(e) => e.stopPropagation()}>
            <div className="relic-sigil big"><svg viewBox="0 0 68 68"><path d={openRelic.sigil} /></svg></div>
            <p className="relic-no">{openRelic.ordinal}</p>
            <h3>{openRelic.name}</h3>
            <p className="l3-blurb">{openRelic.blurb}</p>
            {found.has(openRelic.id) ? (
              <div className="l3-status l3-found">✦ Recovered</div>
            ) : openRelic.state === "within_reach" ? (
              <button className="l3-recover" onClick={() => recover(openRelic)}>Recover this relic</button>
            ) : (
              <div className="l3-status">Sealed — not yet within reach</div>
            )}
            {whisper && <p className="l3-whisper">“{whisper}”</p>}
            <button className="l3-close" onClick={() => setOpenRelic(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
.tl-root{--gold:#c2a25f;--gold-bright:#e3c884;--gold-deep:#8a7140;--ivory:#ece4d2;--ivory-dim:#b6b1a3;--slate:#6f7894;--slate-dim:#4a5270;--rule-soft:rgba(194,162,95,.09);--serif:'Cormorant Garamond',Georgia,serif;--body:'Spectral',Georgia,serif;--mono:'Spectral',ui-monospace,monospace;--ease:cubic-bezier(.165,.84,.44,1);
  color:var(--ivory);font-family:var(--body);background:radial-gradient(150% 100% at 50% -25%,#0f1a35 0%,#0a1124 34%,#070b18 64%,#05080f 100%);min-height:100vh;overflow-x:hidden}
.tl-sky{position:fixed;inset:0;z-index:0;pointer-events:none}
.tl-grain{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.035;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.tl-const{position:fixed;inset:0;z-index:2;pointer-events:none;display:flex;align-items:center;justify-content:flex-start;padding-left:clamp(32px,5vw,128px);will-change:transform,opacity}
.tl-const-inner{width:min(56vw,820px);max-height:80vh}
.tl-top{position:fixed;top:0;left:0;right:0;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:30px clamp(26px,5vw,64px);font-family:var(--mono);font-size:12px;letter-spacing:.3em;text-transform:uppercase}
.tl-top button{background:none;border:0;cursor:pointer;color:var(--slate);font:inherit;letter-spacing:inherit;text-transform:inherit;transition:color .5s var(--ease)}
.tl-top button:hover{color:var(--ivory)}
.tl-top .mid{color:var(--slate-dim);letter-spacing:.4em}
.tl-top .plate{color:var(--gold-deep);letter-spacing:.36em}
.tl-layer{position:relative;z-index:5;min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:12vh clamp(26px,5vw,64px);will-change:opacity,transform}
.lw{max-width:1320px;margin:0 auto;width:100%}
.em{opacity:0;transform:translateY(24px) scale(.965);transition:opacity .9s var(--ease) var(--d,0ms),transform .9s var(--ease) var(--d,0ms)}
.em.soft{transform:translateY(12px) scale(1)}
.tl-layer.in .em{opacity:1;transform:none}
.tl-hero{justify-content:center;align-items:flex-end;max-width:1500px;margin:0 auto}
.ed{max-width:440px;opacity:0;animation:tlrise 1.1s var(--ease) .35s both}
@keyframes tlrise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes tlfade{from{opacity:0}to{opacity:1}}
.eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:var(--slate);margin-bottom:26px}
.eyebrow b{color:var(--gold);font-weight:500}
.tname{font-family:var(--serif);font-weight:400;font-size:clamp(54px,5vw,76px);line-height:.98;color:var(--ivory);letter-spacing:.5px;margin-bottom:18px}
.tname em{font-style:italic;display:block}
.tagline{font-family:var(--serif);font-style:italic;font-size:23px;line-height:1.32;color:var(--gold);opacity:.92;margin-bottom:30px;max-width:24ch}
.attr{font-family:var(--mono);font-size:11.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--ivory-dim);padding:16px 0;border-top:1px solid var(--rule-soft);border-bottom:1px solid var(--rule-soft);margin-bottom:28px}
.attr .sep{color:var(--gold-deep);margin:0 10px}
.lede{font-size:18px;line-height:1.62;color:var(--ivory-dim);max-width:40ch;margin-bottom:24px}
.whisper{font-family:var(--serif);font-style:italic;font-size:18px;line-height:1.5;color:var(--gold-bright);opacity:.9;max-width:38ch;margin-bottom:34px}
.plaque{display:inline-flex;align-items:center;gap:16px;padding:17px 30px;border:1px solid var(--gold);background:transparent;color:var(--gold-bright);font-family:var(--mono);font-size:12px;letter-spacing:.28em;text-transform:uppercase;cursor:pointer;transition:background .6s var(--ease),color .6s var(--ease),border-color .6s var(--ease)}
.plaque .ar{transition:transform .6s var(--ease)}
.plaque:hover{background:rgba(194,162,95,.08);color:#f3e3bd;border-color:var(--gold-bright)}
.plaque:hover .ar{transform:translateX(5px)}
.skycap{position:absolute;left:clamp(32px,5vw,128px);bottom:13vh;font-family:var(--mono);font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--slate-dim);display:flex;gap:22px;flex-wrap:wrap;max-width:52vw;opacity:0;animation:tlfade 1.2s var(--ease) 1.4s both}
.scroll-hint{position:absolute;left:50%;bottom:30px;transform:translateX(-50%);z-index:8;cursor:pointer;font-family:var(--mono);font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;color:var(--slate-dim);display:flex;flex-direction:column;align-items:center;gap:12px;background:none;border:0;opacity:0;animation:tlfade 1.4s var(--ease) 1.8s both;transition:color .5s var(--ease)}
.scroll-hint:hover{color:var(--gold)}
.scroll-hint .ln{width:1px;height:40px;background:linear-gradient(var(--gold-deep),transparent)}
.sec-head{display:flex;align-items:baseline;gap:24px;margin-bottom:60px}
.sec-head .num{font-family:var(--mono);font-size:12px;letter-spacing:.3em;color:var(--gold-deep)}
.sec-head h2{font-family:var(--serif);font-weight:400;font-size:clamp(32px,3.4vw,46px);color:var(--ivory);letter-spacing:.4px}
.sec-head .rule{flex:1;height:1px;background:linear-gradient(90deg,rgba(194,162,95,.18),transparent)}
.passage{max-width:760px}
.passage .lead{font-family:var(--serif);font-style:italic;font-size:30px;line-height:1.4;color:var(--ivory);margin-bottom:34px}
.passage p{font-size:19px;line-height:1.72;color:var(--ivory-dim);max-width:64ch;margin-bottom:22px}
.passage .drop::first-letter{font-family:var(--serif);font-size:4.4em;float:left;line-height:.74;padding:6px 14px 0 0;color:var(--gold);font-style:normal}
.archive{display:grid;grid-template-columns:1fr 1fr;gap:0 72px}
.entry{display:grid;grid-template-columns:46px 1fr;gap:22px;align-items:start;padding:30px 0;border-top:1px solid var(--rule-soft)}
.entry:hover .entry-glyph{color:var(--gold-bright)}.entry:hover .entry-title{color:var(--ivory)}
.entry-glyph{color:var(--gold-deep);transition:color .7s var(--ease);margin-top:4px}
.entry-glyph svg{display:block;width:42px;height:42px;stroke:currentColor;fill:none;stroke-width:1;stroke-linecap:round;stroke-linejoin:round}
.entry-no{font-family:var(--mono);font-size:11px;letter-spacing:.24em;color:var(--gold-deep);margin-bottom:9px}
.entry-title{font-family:var(--serif);font-style:italic;font-weight:500;font-size:27px;color:var(--ivory-dim);line-height:1.05;margin-bottom:10px;transition:color .7s var(--ease)}
.entry-desc{font-size:16px;line-height:1.55;color:var(--slate);max-width:38ch}
.relic-intro{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:54px;flex-wrap:wrap;gap:18px}
.relic-intro p{font-style:italic;font-size:20px;color:var(--ivory-dim);max-width:46ch;line-height:1.5}
.ledger{font-family:var(--mono);font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--slate);display:flex;align-items:center;gap:14px;white-space:nowrap}
.ledger .ticks{display:flex;gap:7px}
.ledger .t{width:7px;height:7px;border:1px solid var(--gold-deep);transform:rotate(45deg)}
.ledger .t.on{background:var(--gold);border-color:var(--gold)}
.relics{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
.relic{padding:42px 32px 38px;border-left:1px solid var(--rule-soft);position:relative;display:flex;flex-direction:column;align-items:flex-start;min-height:300px;background:none;cursor:pointer;text-align:left;color:inherit;font:inherit;transition:background .5s var(--ease)}
.relic:first-child{border-left:0}
.relic:hover{background:rgba(194,162,95,.03)}
.relic-no{font-family:var(--mono);font-size:11px;letter-spacing:.24em;color:var(--gold-deep);margin-bottom:34px}
.relic-sigil{color:var(--gold);margin-bottom:30px;transition:color .8s var(--ease),transform 1.1s var(--ease),filter .8s var(--ease)}
.relic-sigil svg{display:block;width:68px;height:68px;stroke:currentColor;fill:none;stroke-width:1;stroke-linecap:round;stroke-linejoin:round}
.relic h3{font-family:var(--serif);font-style:italic;font-weight:500;font-size:28px;color:var(--ivory);line-height:1.1;margin-bottom:17px}
.relic p{font-size:16px;line-height:1.55;color:var(--slate);margin-bottom:auto;max-width:30ch}
.relic .status{font-family:var(--mono);font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--slate-dim);margin-top:26px;display:flex;align-items:center;gap:9px}
.relic .status .dot{width:5px;height:5px;border:1px solid var(--slate-dim);transform:rotate(45deg)}
.relic:not(.found) .relic-sigil{filter:blur(1.4px);opacity:.5}
.relic:hover:not(.found) .relic-sigil{filter:blur(.6px);opacity:.7}
.relic.found .relic-sigil{color:var(--gold-bright)}
.relic.found .status{color:var(--gold)}.relic.found .status .dot{background:var(--gold);border-color:var(--gold)}
.relic:hover .relic-sigil{transform:translateY(-3px)}
.tl-nav{justify-content:flex-start;padding-top:40vh}
.atlas-nav{border-top:1px solid var(--rule-soft);border-bottom:1px solid var(--rule-soft);display:grid;grid-template-columns:1fr auto 1fr;align-items:center}
.atlas-nav button{text-decoration:none;color:inherit;padding:54px 8px;transition:background .6s var(--ease);background:none;border:0;cursor:pointer;font:inherit}
.atlas-nav button:hover{background:rgba(194,162,95,.035)}
.nav-prev{text-align:left}.nav-next{text-align:right}
.nav-k{font-family:var(--mono);font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--gold-deep);display:block;margin-bottom:12px}
.nav-t{font-family:var(--serif);font-style:italic;font-size:27px;color:var(--ivory-dim);transition:color .6s var(--ease)}
.atlas-nav button:hover .nav-t{color:var(--ivory)}
.nav-home{padding:0 46px;text-align:center}.nav-home .h{font-family:var(--mono);font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--slate)}
.nav-home button:hover .h{color:var(--gold-bright)}
.colophon{text-align:center;margin-top:14vh;font-family:var(--mono);font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:var(--slate-dim)}
.colophon .g{color:var(--gold-deep);margin:0 12px}
.tl-l3{position:fixed;inset:0;z-index:60;background:rgba(5,8,15,.86);backdrop-filter:blur(3px);display:grid;place-items:center;padding:24px;animation:tlfade .4s var(--ease) both;cursor:pointer}
.tl-l3-card{max-width:460px;text-align:center;cursor:default;animation:tlrise .6s var(--ease) both}
.tl-l3-card .relic-sigil.big svg{width:120px;height:120px;margin:0 auto;color:var(--gold-bright)}
.tl-l3-card h3{font-family:var(--serif);font-style:italic;font-size:40px;color:var(--ivory);margin:6px 0 14px}
.l3-blurb{font-size:18px;line-height:1.6;color:var(--ivory-dim);max-width:34ch;margin:0 auto 18px}
.l3-status{font-family:var(--mono);font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--slate)}
.l3-found{color:var(--gold-bright)}
.l3-recover{background:transparent;border:1px solid var(--gold);color:var(--gold-bright);font-family:var(--mono);font-size:11px;letter-spacing:.26em;text-transform:uppercase;padding:13px 28px;cursor:pointer;transition:background .5s var(--ease),color .5s var(--ease)}
.l3-recover:hover{background:rgba(194,162,95,.1);color:#f3e3bd}
.l3-whisper{font-family:var(--serif);font-style:italic;font-size:17px;color:var(--gold);opacity:.9;margin-top:22px;max-width:34ch;margin-left:auto;margin-right:auto}
.l3-close{margin-top:30px;background:none;border:1px solid var(--rule-soft);color:var(--slate);font-family:var(--mono);font-size:11px;letter-spacing:.26em;text-transform:uppercase;padding:12px 26px;cursor:pointer;transition:color .4s,border-color .4s}
.l3-close:hover{color:var(--ivory);border-color:var(--gold-deep)}
@media (max-width:1080px){.tl-const{justify-content:center;padding-left:0;opacity:.42!important}.tl-const-inner{width:88vw;max-height:62vh}.tl-hero{align-items:center;text-align:center}.ed{max-width:560px;margin:0 auto}.eyebrow,.attr,.skycap{justify-content:center}.tagline,.lede,.whisper{margin-left:auto;margin-right:auto}.skycap{position:static;max-width:none;margin-top:34px;justify-content:center}.archive{grid-template-columns:1fr}.relics{grid-template-columns:1fr 1fr}.relic{border-left:0;border-top:1px solid var(--rule-soft)}.relic:first-child,.relic:nth-child(2){border-top:0}}
@media (max-width:640px){.relics{grid-template-columns:1fr}.relic:nth-child(2){border-top:1px solid var(--rule-soft)}.atlas-nav{grid-template-columns:1fr;text-align:center}.nav-prev,.nav-next{text-align:center}.tl-top .mid{display:none}}
@media (prefers-reduced-motion:reduce){.em{opacity:1!important;transform:none!important;transition:none!important}.ed,.skycap,.scroll-hint{opacity:1!important;animation:none!important}}
`;
