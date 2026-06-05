"use client";

import { useEffect, useMemo, useRef, useState, type RefObject, type ReactNode } from "react";
import SkyWheel from "@/components/sky/SkyWheel";
import PlanetMedallion from "@/components/sky/PlanetMedallion";
import StarField from "@/components/sky/StarField";
import { Cap, Btn, StatusBar, ModeToggle, TabBar, type TabId } from "@/components/sky/chrome";
import { useParallax, useSlowRotation, useSkyClock, useMediaQuery } from "@/components/sky/hooks";
import { NIGHT, DAY, type Palette, FD, FT, FG, FN } from "@/lib/theme";
import {
  displaySky, signOf, degStr, shortPos, SIGN_NAME, PLANETS, PLANET_GLYPH, PLANET_NAME, type LonMap,
} from "@/lib/chart";
import { natalChart } from "@/lib/sky";
import { makeStar, reachOf, type SealedStar } from "@/lib/star";
import { archetypeForStar, geniusLine, geniusPhase } from "@/lib/archetypes";
import { askGenius } from "@/lib/dialogue";
import {
  getProfile, saveProfile, getStar, saveStar, resetAll, type Profile,
} from "@/lib/storage";
import { push as cloudPush, wipe as cloudWipe } from "@/lib/cloud";

type Screen = "cabinet" | "theme" | "star" | "genius";
const TITLES: Record<Screen, string> = { cabinet: "Cabinet", theme: "Your Theme", star: "Your Star", genius: "Your Genius" };

const READ: Record<string, string> = {
  sun: "How you shine, and what you cannot help but become.",
  moon: "What you feel deeply, without always showing it.",
  mercury: "How your mind moves, and the voice it reaches for.",
  venus: "What you are drawn toward, and how you love.",
  mars: "What you burn for, and how you go after it.",
  jupiter: "Where the world opens generously for you.",
  saturn: "The work that is yours, and yours alone, to do.",
  uranus: "Where you refuse to be like anyone else.",
  neptune: "What you long for past the edge of the visible.",
  pluto: "What in you must end so something truer can begin.",
};

const TAB_ICON: Record<Screen, string> = { cabinet: "⌂", theme: "◉", star: "★", genius: "◎" };

function SkyBg({ pal, night, par }: { pal: Palette; night: boolean; par: { x: number; y: number } }) {
  if (!night) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <StarField pal={pal} layer={1} par={par} />
      <StarField pal={pal} layer={2} par={par} />
    </div>
  );
}

// Phone frame (mobile). Hoisted so it never remounts.
function Frame({
  pal, night, par, date, frameRef, withTabs = true, withToggle = true, screen, onTab, onToggleNight, children,
}: {
  pal: Palette; night: boolean; par: { x: number; y: number }; date: Date;
  frameRef: RefObject<HTMLDivElement | null>; withTabs?: boolean; withToggle?: boolean;
  screen?: Screen; onTab?: (t: Screen) => void; onToggleNight?: () => void; children: ReactNode;
}) {
  return (
    <div style={{ minHeight: "100svh", display: "flex", justifyContent: "center", background: "#0A0D1C" }}>
      <div ref={frameRef} style={{
        position: "relative", width: "100%", maxWidth: 430, minHeight: "100svh", overflow: "hidden",
        background: pal.bg, color: pal.ink, fontFamily: FT, display: "flex", flexDirection: "column",
        transition: "background .5s ease",
      }}>
        <SkyBg pal={pal} night={night} par={par} />
        <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column",
          padding: withTabs ? "0 20px 70px" : "0 20px 24px" }}>
          <StatusBar pal={pal} date={date} />
          {withToggle && onToggleNight && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
              <span style={{ fontFamily: FT, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: pal.inkSoft }}>
                {night ? "Observatory" : "Cabinet"}
              </span>
              <ModeToggle night={night} onToggle={onToggleNight} pal={pal} />
            </div>
          )}
          {children}
        </div>
        {withTabs && screen && onTab && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 3 }}>
            <TabBar pal={pal} active={screen as TabId} onTab={(t) => onTab(t as Screen)} />
          </div>
        )}
      </div>
    </div>
  );
}

// Observatory (desktop). Two-pane: left instrument, right panel.
function DesktopShell({
  pal, night, par, date, frameRef, screen, onTab, onToggleNight, title, visual, detail,
}: {
  pal: Palette; night: boolean; par: { x: number; y: number }; date: Date;
  frameRef: RefObject<HTMLDivElement | null>; screen: Screen; onTab: (t: Screen) => void;
  onToggleNight: () => void; title: string; visual: ReactNode; detail: ReactNode;
}) {
  return (
    <div ref={frameRef} style={{ position: "relative", minHeight: "100svh", overflow: "hidden",
      background: pal.bg, color: pal.ink, fontFamily: FT, transition: "background .5s ease" }}>
      <SkyBg pal={pal} night={night} par={par} />
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto", padding: "0 44px",
        minHeight: "100svh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 28 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FD, fontSize: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: 4, background: pal.brass }} />Astrolabe
          </span>
          <nav style={{ display: "flex", gap: 4 }}>
            {(Object.keys(TITLES) as Screen[]).map((s) => {
              const on = s === screen;
              return (
                <button key={s} onClick={() => onTab(s)} style={{ appearance: "none", border: "none", background: "transparent",
                  cursor: "pointer", padding: "8px 16px", borderRadius: 20, color: on ? pal.accent : pal.inkSoft,
                  display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: FG, fontSize: 14 }}>{TAB_ICON[s]}</span>
                  <span style={{ fontFamily: FD, fontStyle: "italic", fontSize: 16 }}>{TITLES[s].replace("Your ", "")}</span>
                </button>
              );
            })}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: FN, fontSize: 13, color: pal.ink }}>{date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
            <ModeToggle night={night} onToggle={onToggleNight} pal={pal} />
          </div>
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56,
          alignItems: "center", padding: "24px 0 48px" }}>
          <div style={{ display: "flex", justifyContent: "center", transform: `translate(${par.x * 5}px, ${par.y * 5}px)`, transition: "transform .4s ease-out" }}>{visual}</div>
          <div style={{ maxWidth: 460, display: "flex", flexDirection: "column" }}>
            <Cap pal={pal} style={{ marginBottom: 16 }}>{title}</Cap>
            {detail}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [star, setStar] = useState<SealedStar | null>(null);
  const [night, setNight] = useState(true);
  const [screen, setScreen] = useState<Screen>("cabinet");
  const [hoverSign, setHoverSign] = useState<number | null>(null);
  const [sel, setSel] = useState("moon");

  const wide = useMediaQuery("(min-width: 980px)");
  const { date, offsetDays, setOffsetDays } = useSkyClock();
  const frameRef = useRef<HTMLDivElement | null>(null);
  const par = useParallax(frameRef, night);
  const rotation = useSlowRotation(night);
  const pal = night ? NIGHT : DAY;

  const [rstep, setRstep] = useState(0);
  const [rmust, setRmust] = useState("");
  const [rname, setRname] = useState("");
  const [bday, setBday] = useState("");
  const [btime, setBtime] = useState("");
  const [bplace, setBplace] = useState("");
  const [gInput, setGInput] = useState("");
  const [gReply, setGReply] = useState<string | null>(null);
  const [gSending, setGSending] = useState(false);

  useEffect(() => { setProfile(getProfile()); setStar(getStar()); setReady(true); }, []);

  const natalLon = useMemo<LonMap | null>(() => (profile ? displaySky(new Date(profile.birthISO)) : null), [profile]);
  const liveLon = useMemo<LonMap>(() => displaySky(date), [date]);
  const reach = useMemo(() => (star ? reachOf(star, date) : null), [star, date]);
  const fulfilled = !!star?.fulfilledAt;
  const toggleNight = () => setNight((v) => !v);
  const onTab = (t: Screen) => { setScreen(t); setGReply(null); };
  const startSeal = () => { setRmust(""); setRname(""); setRstep(1); };

  function castSky() {
    if (!bday) return;
    const birthISO = `${bday}T${btime || "12:00"}`;
    const natal = natalChart(new Date(birthISO), birthISO);
    const p: Profile = { birthISO, place: bplace.trim(), natal, createdAt: new Date().toISOString() };
    saveProfile(p); setProfile(p); cloudPush(p, null); setScreen("theme");
  }
  function sealNow() {
    const s = makeStar(rmust, rname);
    saveStar(s); setStar(s); cloudPush(profile, s); setRstep(4);
  }
  async function askDaily() {
    const text = gInput.trim();
    if (!text || gSending || !star || !reach) return;
    setGSending(true); setGReply(null);
    const a = archetypeForStar(star);
    const reply = await askGenius([{ role: "user", content: text }], {
      star: { name: star.name, must: star.must, ruler: star.ruler },
      archetype: { name: a.name, essence: a.essence },
      reach: { gap: reach.gap, days: reach.days, phase: geniusPhase(reach, fulfilled) },
    });
    setGReply(reply ?? "I hold your star in view. Stay with the question; the sky is slow, and so is what matters.");
    setGInput(""); setGSending(false);
  }

  if (!ready) return <div style={{ minHeight: "100svh", background: "#0A0D1C" }} />;

  // ── onboarding: Fixed Sky ──
  if (!profile) {
    const fields = (
      <div style={{ width: "100%" }}>
        <Cap pal={pal}>Your fixed sky</Cap>
        <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 34, lineHeight: 1.1, marginTop: 12, color: pal.ink }}>When did you begin?</div>
        <div style={{ fontFamily: FT, fontSize: 14.5, color: pal.inkSoft, marginTop: 12, lineHeight: 1.5 }}>
          Your birth moment fixes the sky you carry. Cast it once.
        </div>
        {([["Date of birth", bday, setBday, "date"], ["Time of birth", btime, setBtime, "time"], ["City of birth", bplace, setBplace, "text"]] as [string, string, (s: string) => void, string][]).map(([label, val, set, type]) => (
          <label key={label} style={{ display: "block", marginTop: 22 }}>
            <span style={{ fontFamily: FT, fontSize: 9.5, letterSpacing: 2, textTransform: "uppercase", color: pal.inkSoft }}>{label}</span>
            <input type={type} value={val} placeholder={type === "text" ? "Paris" : undefined} onChange={(e) => set(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 7, background: "transparent", border: "none",
                borderBottom: `1px solid ${pal.panelLine}`, color: pal.ink, fontFamily: FD, fontStyle: "italic", fontSize: 22, padding: "8px 2px", outline: "none" }} />
          </label>
        ))}
        <div style={{ marginTop: 34 }}><Btn pal={pal} solid onClick={castSky} disabled={!bday}>Cast the sky</Btn></div>
      </div>
    );
    if (wide) {
      return (
        <div ref={frameRef} style={{ position: "relative", minHeight: "100svh", overflow: "hidden", background: pal.bg, color: pal.ink, fontFamily: FT }}>
          <SkyBg pal={pal} night={night} par={par} />
          <div style={{ position: "relative", zIndex: 2, maxWidth: 1080, margin: "0 auto", padding: "0 44px", minHeight: "100svh",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", transform: `translate(${par.x * 6}px, ${par.y * 6}px)`, transition: "transform .4s ease-out" }}>
              <PlanetMedallion pal={pal} glyph="✦" size={300} />
            </div>
            <div style={{ maxWidth: 440 }}>{fields}</div>
          </div>
        </div>
      );
    }
    return (
      <Frame pal={pal} night={night} par={par} date={date} frameRef={frameRef} withTabs={false} withToggle onToggleNight={toggleNight}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 30 }}>{fields}</div>
      </Frame>
    );
  }

  // ── ritual (seal flow) — centered both layouts ──
  if (rstep > 0) {
    const inner = (
      <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
        {rstep === 1 && (
          <div style={{ textAlign: "left" }} className="astro-fade">
            <Cap pal={pal}>One question</Cap>
            <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 34, marginTop: 14, color: pal.ink }}>What must happen?</div>
            <input value={rmust} placeholder="Launch Symione." onChange={(e) => setRmust(e.target.value)}
              style={{ width: "100%", marginTop: 28, background: "transparent", border: "none", borderBottom: `1px solid ${pal.panelLine}`, color: pal.ink, fontFamily: FD, fontStyle: "italic", fontSize: 24, padding: "8px 2px", outline: "none" }} />
            <div style={{ marginTop: 36 }}><Btn pal={pal} disabled={!rmust.trim()} onClick={() => setRstep(2)}>Continue</Btn></div>
          </div>
        )}
        {rstep === 2 && (
          <div style={{ textAlign: "left" }} className="astro-fade">
            <Cap pal={pal}>Name it</Cap>
            <input value={rname} placeholder="SYMIONE" onChange={(e) => setRname(e.target.value)}
              style={{ width: "100%", marginTop: 28, background: "transparent", border: "none", borderBottom: `1px solid ${pal.panelLine}`, color: pal.ink, fontFamily: FD, fontSize: 30, letterSpacing: 1, textTransform: "uppercase", padding: "8px 2px", outline: "none" }} />
            <div style={{ marginTop: 36 }}><Btn pal={pal} disabled={!rname.trim()} onClick={() => setRstep(3)}>Continue</Btn></div>
          </div>
        )}
        {rstep === 3 && (
          <div className="astro-fade">
            <PlanetMedallion pal={pal} glyph="✦" size={172} />
            <Cap pal={pal} style={{ marginTop: 22 }}>This cannot be undone tonight</Cap>
            <div style={{ fontFamily: FD, fontStyle: "italic", fontWeight: 500, fontSize: 44, color: pal.ink, marginTop: 8, lineHeight: 1 }}>“{rname.trim().toUpperCase()}”</div>
            <div style={{ marginTop: 34 }}><Btn pal={pal} solid onClick={sealNow}>Seal it</Btn></div>
          </div>
        )}
        {rstep === 4 && star && (
          <div className="astro-fade">
            <Cap pal={pal} style={{ marginBottom: 16 }}>A star now stands in your sky</Cap>
            <PlanetMedallion pal={pal} glyph={star.glyph} size={158} />
            <div style={{ fontFamily: FD, fontStyle: "italic", fontWeight: 500, fontSize: 44, color: pal.ink, marginTop: 14, lineHeight: 1 }}>{star.name}</div>
            <div style={{ marginTop: 16, width: 240, marginLeft: "auto", marginRight: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {([["Sign", SIGN_NAME[signOf(star.lon)]], ["Degree", degStr(star.lon)], ["House", star.house], ["Ruler", `${star.rulerGlyph} ${star.ruler}`]] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${pal.panelLine}`, fontSize: 12 }}>
                  <span style={{ color: pal.inkSoft, textTransform: "uppercase", letterSpacing: 0.8, fontSize: 9, fontFamily: FT }}>{k}</span>
                  <span style={{ fontFamily: FN, color: pal.ink }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 30 }}><Btn pal={pal} solid onClick={() => { setRstep(0); setRmust(""); setRname(""); setScreen("star"); }}>Enter</Btn></div>
          </div>
        )}
      </div>
    );
    return (
      <div ref={frameRef} style={{ position: "relative", minHeight: "100svh", overflow: "hidden", background: pal.bg, color: pal.ink, fontFamily: FT, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <SkyBg pal={pal} night={night} par={par} />
        <div style={{ position: "relative", zIndex: 2, width: "100%" }}>{inner}</div>
      </div>
    );
  }

  // ── shell: compute {visual, detail} per screen ──
  const arch = star ? archetypeForStar(star) : null;
  const liveSubset: LonMap = { moon: liveLon.moon, sun: liveLon.sun, venus: liveLon.venus, mars: liveLon.mars, jupiter: liveLon.jupiter, saturn: liveLon.saturn };
  const wheelSize = wide ? 340 : screen === "star" ? 280 : 262;

  let visual: ReactNode = null;
  let detail: ReactNode = null;

  if (screen === "cabinet") {
    visual = <PlanetMedallion pal={pal} glyph={star ? star.glyph : "✦"} size={wide ? 260 : 200} />;
    detail = (
      <div>
        <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 28, color: pal.ink }}>Good evening.</div>
        <div style={{ fontFamily: FT, fontSize: 14, color: pal.inkSoft, marginTop: 2, marginBottom: 18 }}>The sky has moved since yesterday.</div>
        {star && reach ? (
          <div>
            <span style={{ fontFamily: FD, fontStyle: "italic", fontSize: 30, color: pal.ink }}>in </span>
            <span style={{ fontFamily: FD, fontWeight: 600, fontSize: 30, color: pal.accent }}>{reach.headline}</span>
            <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 16, color: pal.inkSoft }}>the Moon nears <span style={{ color: pal.accent }}>{star.name}</span></div>
          </div>
        ) : (
          <Btn pal={pal} solid onClick={startSeal}>Seal a star</Btn>
        )}
        <div style={{ marginTop: 24 }}>
          <button onClick={() => { if (confirm("Close the cabinet? This clears your sky and your star.")) { resetAll(); cloudWipe(); setProfile(null); setStar(null); setScreen("cabinet"); } }}
            style={{ background: "none", border: "none", color: pal.inkSoft, fontFamily: FN, fontSize: 11, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>close the cabinet</button>
        </div>
      </div>
    );
  } else if (screen === "theme" && natalLon) {
    visual = <SkyWheel pal={pal} size={wheelSize} bodies={natalLon} highlight={sel} rotation={rotation} hoverSign={hoverSign} onSign={setHoverSign} />;
    detail = (
      <div>
        <div style={{ display: "flex", justifyContent: wide ? "flex-start" : "center", gap: 2, flexWrap: "wrap", marginBottom: 10 }}>
          {PLANETS.map((p) => {
            const on = sel === p.key;
            return <button key={p.key} onClick={() => setSel(p.key)} style={{ appearance: "none", border: "none",
              background: on ? (night ? "rgba(217,105,75,.16)" : "rgba(124,46,44,.10)") : "transparent", cursor: "pointer",
              width: 30, height: 30, borderRadius: 16, fontFamily: FG, fontSize: 15, color: on ? pal.accent : pal.inkSoft }}>{p.glyph}</button>;
          })}
        </div>
        <div style={{ padding: "14px 16px", background: pal.panel, border: `1px solid ${pal.panelLine}`, borderRadius: 3 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap" }}>
            <span style={{ fontFamily: FG, fontSize: 18, color: night ? pal.silver : pal.ink }}>{PLANET_GLYPH[sel]}</span>
            <span style={{ fontFamily: FD, fontStyle: "italic", fontSize: 22, color: pal.ink }}>{PLANET_NAME[sel]}</span>
            <span style={{ fontFamily: FD, fontStyle: "italic", fontSize: 17, color: pal.inkSoft }}>· {shortPos(natalLon[sel])}</span>
          </div>
          <div style={{ fontFamily: FT, fontSize: 14.5, lineHeight: 1.45, marginTop: 6, color: pal.ink }}>{READ[sel]}</div>
          <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
            <span style={{ fontFamily: FN, fontSize: 10.5, padding: "3px 8px", border: `1px solid ${pal.panelLine}`, borderRadius: 2, color: pal.inkSoft }}>{degStr(natalLon[sel])}</span>
          </div>
        </div>
        <div style={{ textAlign: wide ? "left" : "center", marginTop: 14 }}>
          <Cap pal={pal} style={{ color: pal.inkSoft, marginBottom: 5 }}>{hoverSign != null ? SIGN_NAME[hoverSign] : "Touch a sign for its constellation"}</Cap>
          <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 18, color: pal.accent, lineHeight: 1.2 }}>this is the sky you were born under.</div>
        </div>
      </div>
    );
  } else if (screen === "star") {
    if (star && reach) {
      visual = <SkyWheel pal={pal} size={wheelSize} bodies={liveSubset} highlight="moon" sealedLon={star.lon} showArc rotation={rotation} hoverSign={hoverSign} onSign={setHoverSign} />;
      detail = (
        <div>
          <div style={{ textAlign: wide ? "left" : "center" }}>
            <span style={{ fontFamily: FD, fontStyle: "italic", fontSize: 36, color: pal.ink }}>in </span>
            <span style={{ fontFamily: FD, fontWeight: 600, fontSize: 36, color: pal.accent }}>{reach.headline}</span>
            <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 16, color: pal.inkSoft }}>the Moon will reach <span style={{ color: pal.accent }}>{star.name}</span></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FN, fontSize: 11, color: pal.inkSoft, padding: "0 4px", margin: "16px 0 8px" }}>
            <span>☽ {shortPos(liveLon.moon)}</span>
            <span style={{ color: pal.accent }}>{reach.gap.toFixed(1)}° to go</span>
            <span>{star.glyph} {shortPos(star.lon)}</span>
          </div>
          <div style={{ padding: "10px 14px", background: pal.panel, border: `1px solid ${pal.panelLine}`, borderRadius: 3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Cap pal={pal} style={{ color: pal.inkSoft }}>Advance the sky</Cap>
              <span style={{ fontFamily: FN, fontSize: 11, color: pal.ink }}>{offsetDays === 0 ? "today" : `+${offsetDays}d`} · {date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            </div>
            <input type="range" min={0} max={40} value={offsetDays} onChange={(e) => setOffsetDays(+e.target.value)} style={{ width: "100%", accentColor: pal.accent }} />
          </div>
        </div>
      );
    } else {
      visual = <PlanetMedallion pal={pal} glyph="✦" size={wide ? 240 : 172} />;
      detail = (
        <div style={{ textAlign: wide ? "left" : "center" }}>
          <Cap pal={pal}>Your sky is still dark</Cap>
          <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 22, color: pal.ink, marginTop: 8, maxWidth: 280, lineHeight: 1.3 }}>A star may be named, when something becomes necessary.</div>
          <div style={{ marginTop: 26 }}><Btn pal={pal} solid onClick={startSeal}>Seal a star</Btn></div>
        </div>
      );
    }
  } else if (screen === "genius") {
    visual = <PlanetMedallion pal={pal} glyph={star ? star.glyph : "◎"} size={wide ? 230 : 150} />;
    detail = (
      <div style={{ textAlign: wide ? "left" : "center", display: "flex", flexDirection: "column", height: "100%" }}>
        {star && arch && <Cap pal={pal}>held by the {arch.name}</Cap>}
        <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 21, color: pal.ink, marginTop: 14, maxWidth: 340, lineHeight: 1.4 }}>
          {gReply ?? (star && reach ? geniusLine(star, reach, fulfilled) : "Seal a star, and I will wake.")}
        </div>
        {star && (
          <div style={{ marginTop: 22, width: "100%" }}>
            <input value={gInput} placeholder="what moves in you tonight…" disabled={gSending}
              onChange={(e) => setGInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") askDaily(); }}
              style={{ width: "100%", textAlign: wide ? "left" : "center", background: "transparent", border: "none",
                borderBottom: `1px solid ${pal.panelLine}`, color: pal.ink, fontFamily: FD, fontStyle: "italic", fontSize: 17, padding: "10px 2px", outline: "none" }} />
            <div style={{ marginTop: 16 }}><Btn pal={pal} disabled={gSending || !gInput.trim()} onClick={askDaily}>{gSending ? "listening…" : "Reflect"}</Btn></div>
          </div>
        )}
      </div>
    );
  }

  if (wide) {
    return (
      <DesktopShell pal={pal} night={night} par={par} date={date} frameRef={frameRef} screen={screen}
        onTab={onTab} onToggleNight={toggleNight} title={TITLES[screen]} visual={visual} detail={detail} />
    );
  }

  return (
    <Frame pal={pal} night={night} par={par} date={date} frameRef={frameRef} screen={screen} onTab={onTab} withToggle onToggleNight={toggleNight}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 10, marginBottom: 6 }}>
        <Cap pal={pal}>{TITLES[screen]}</Cap>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "center", flexShrink: 0, transform: `translate(${par.x * 4}px, ${par.y * 4}px)`, transition: "transform .4s ease-out" }}>{visual}</div>
        <div style={{ marginTop: 10, flex: 1, display: "flex", flexDirection: "column" }}>{detail}</div>
      </div>
    </Frame>
  );
}
