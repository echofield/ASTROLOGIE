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
import {
  askGenius, appendMessage, loadMessages, journalEntries, remainingExchanges, DAILY_EXCHANGE_LIMIT,
} from "@/lib/dialogue";
import type { ChatMessage } from "@/lib/llm/types";
import {
  getProfile, saveProfile, getStar, saveStar, getStarLedger, saveStarLedger, recordStar, resetAll, type Profile,
} from "@/lib/storage";
import { pull as cloudPull, push as cloudPush, wipe as cloudWipe } from "@/lib/cloud";

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
const DAY_MS = 24 * 60 * 60 * 1000;

function recordDate(iso?: string): string {
  if (!iso) return "undated";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "undated";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function recordTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function ledgerStatus(star: SealedStar, date: Date): { label: string; stamp: string; detail: string } {
  if (star.fulfilledAt) {
    return { label: "kept", stamp: recordDate(star.fulfilledAt), detail: "kept in the cabinet" };
  }
  const reach = reachOf(star, date);
  if (reach.gap <= 3 || reach.gap >= 357) {
    return { label: "reached", stamp: recordDate(date.toISOString()), detail: "the Moon stands on it" };
  }
  if (reach.gap <= 30) {
    const arrival = new Date(date.getTime() + reach.days * DAY_MS).toISOString();
    return { label: "approaching", stamp: recordDate(arrival), detail: `${reach.gap.toFixed(1)} deg to go` };
  }
  return { label: "sealed", stamp: recordDate(star.sealedAt), detail: `sealed at ${recordTime(star.sealedAt)}` };
}

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ledger, setLedger] = useState<SealedStar[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await Promise.resolve();
      if (!alive) return;
      setProfile(getProfile());
      setStar(getStar());
      setLedger(getStarLedger());
      setReady(true);

      const m = await loadMessages();
      if (alive) setMessages(m);

      const remote = await cloudPull();
      if (!alive || !remote) return;
      if (remote.profile) {
        saveProfile(remote.profile);
        setProfile(remote.profile);
      }
      if (remote.star) {
        saveStar(remote.star);
        setStar(remote.star);
      }
      const cloudLedger = [...remote.ledger];
      if (remote.star && !cloudLedger.some((s) => s.sealedAt === remote.star?.sealedAt)) cloudLedger.push(remote.star);
      if (cloudLedger.length) {
        cloudLedger.sort((a, b) => a.sealedAt.localeCompare(b.sealedAt));
        saveStarLedger(cloudLedger);
        setLedger(cloudLedger);
      }
    })();
    return () => { alive = false; };
  }, []);

  const natalLon = useMemo<LonMap | null>(() => (profile ? displaySky(new Date(profile.birthISO)) : null), [profile]);
  const liveLon = useMemo<LonMap>(() => displaySky(date), [date]);
  const reach = useMemo(() => (star ? reachOf(star, date) : null), [star, date]);
  const fulfilled = !!star?.fulfilledAt;
  const remaining = remainingExchanges(messages);
  const journal = useMemo(() => journalEntries(messages).slice(0, 4), [messages]);
  const recordedStars = useMemo(() => {
    const all = ledger.map((s) => (star && s.sealedAt === star.sealedAt ? star : s));
    if (star && !all.some((s) => s.sealedAt === star.sealedAt)) all.push(star);
    return all.sort((a, b) => b.sealedAt.localeCompare(a.sealedAt)).slice(0, 6);
  }, [ledger, star]);
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
    saveStar(s);
    setStar(s);
    setLedger(recordStar(s));
    cloudPush(profile, s);
    setRstep(4);
  }
  function keepStar() {
    if (!star) return;
    const kept = { ...star, fulfilledAt: star.fulfilledAt ?? new Date().toISOString() };
    saveStar(kept);
    setStar(kept);
    setLedger(recordStar(kept));
    cloudPush(profile, kept);
  }
  async function askDaily() {
    const text = gInput.trim();
    if (!text || gSending || !star || !reach) return;
    if (remainingExchanges(messages) <= 0) {
      setGReply("The Genius is closed till tomorrow.");
      return;
    }
    setGSending(true); setGReply(null);
    const a = archetypeForStar(star);
    const userMessage = appendMessage({ role: "user", content: text });
    const history = [...messages, userMessage].slice(-40);
    setMessages((prev) => [...prev, userMessage].slice(-100));
    const reply = await askGenius(history, {
      star: { name: star.name, must: star.must, ruler: star.ruler },
      archetype: { name: a.name, essence: a.essence },
      reach: { gap: reach.gap, days: reach.days, phase: geniusPhase(reach, fulfilled) },
    });
    const line = reply ?? "I hold your star in view. Stay with the question; the sky is slow, and so is what matters.";
    const assistantMessage = appendMessage({ role: "assistant", content: line });
    setMessages((prev) => [...prev, assistantMessage].slice(-100));
    setGReply(line);
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
            <input value={rmust} placeholder="Send the proposal before Friday." onChange={(e) => setRmust(e.target.value)}
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
    const transit = star && reach
      ? `Moon ${shortPos(liveLon.moon)}. ${reach.gap.toFixed(1)} deg from ${star.name}.`
      : `Moon ${shortPos(liveLon.moon)}. Sun ${shortPos(liveLon.sun)}.`;
    const panel = { padding: "12px 14px", background: pal.panel, border: `1px solid ${pal.panelLine}`, borderRadius: 3 };
    visual = <SkyWheel pal={pal} size={wheelSize} bodies={liveSubset} highlight="moon" sealedLon={star?.lon} showArc={!!star} rotation={rotation} hoverSign={hoverSign} onSign={setHoverSign} />;
    detail = (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 28, color: pal.ink }}>Today&apos;s sky</div>
          <div style={{ fontFamily: FT, fontSize: 14.5, color: pal.inkSoft, marginTop: 4, lineHeight: 1.45 }}>{transit}</div>
        </div>
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <Cap pal={pal}>Genius journal</Cap>
            <span style={{ fontFamily: FN, fontSize: 10.5, color: pal.inkSoft }}>{journal.length} saved</span>
          </div>
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {journal.length ? journal.map((m) => (
              <div key={`${m.createdAt ?? ""}${m.content}`} style={{ borderTop: `1px solid ${pal.panelLine}`, paddingTop: 9 }}>
                <div style={{ fontFamily: FN, fontSize: 10.5, color: pal.inkSoft }}>{recordDate(m.createdAt)} {recordTime(m.createdAt)}</div>
                <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 16, color: pal.ink, lineHeight: 1.3, marginTop: 3 }}>{m.content}</div>
              </div>
            )) : (
              <div style={{ fontFamily: FT, fontSize: 13.5, color: pal.inkSoft, lineHeight: 1.45 }}>No reflection saved yet. Ask the Genius, and the answer will be kept here.</div>
            )}
          </div>
        </div>
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <Cap pal={pal}>Star ledger</Cap>
            <span style={{ fontFamily: FN, fontSize: 10.5, color: pal.inkSoft }}>sealed / approaching / reached / kept</span>
          </div>
          <div style={{ marginTop: 10, display: "grid", gap: 9 }}>
            {recordedStars.length ? recordedStars.map((s) => {
              const status = ledgerStatus(s, date);
              return (
                <div key={s.sealedAt} style={{ borderTop: `1px solid ${pal.panelLine}`, paddingTop: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                    <span style={{ fontFamily: FD, fontStyle: "italic", fontSize: 17, color: pal.ink }}>{s.name}</span>
                    <span style={{ fontFamily: FN, fontSize: 10.5, color: pal.inkSoft, whiteSpace: "nowrap" }}>{status.stamp}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 3, fontFamily: FT, fontSize: 12.5, color: pal.inkSoft, lineHeight: 1.35 }}>
                    <span style={{ color: status.label === "kept" ? pal.accent : pal.brass }}>{status.label}</span>
                    <span>{status.detail}</span>
                  </div>
                </div>
              );
            }) : (
              <div style={{ display: "flex", justifyContent: wide ? "flex-start" : "center", marginTop: 2 }}>
                <Btn pal={pal} solid onClick={startSeal}>Seal a star</Btn>
              </div>
            )}
          </div>
        </div>
        <div style={{ marginTop: 2 }}>
          <button onClick={() => { if (confirm("Close the cabinet? This clears your sky, journal, and star ledger.")) { resetAll(); void cloudWipe(); setMessages([]); setLedger([]); setProfile(null); setStar(null); setScreen("cabinet"); } }}
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
          {!fulfilled && (
            <div style={{ marginTop: 16, textAlign: wide ? "left" : "center" }}>
              <Btn pal={pal} onClick={keepStar}>Keep this star</Btn>
            </div>
          )}
          {fulfilled && (
            <div style={{ marginTop: 14, fontFamily: FT, fontSize: 13, color: pal.inkSoft, textAlign: wide ? "left" : "center" }}>
              Kept on {recordDate(star.fulfilledAt)}.
            </div>
          )}
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
    const closed = remaining <= 0;
    visual = <PlanetMedallion pal={pal} glyph={star ? star.glyph : "◎"} size={wide ? 230 : 150} />;
    detail = (
      <div style={{ textAlign: wide ? "left" : "center", display: "flex", flexDirection: "column", height: "100%" }}>
        {star && arch && (
          <div style={{ display: "flex", justifyContent: wide ? "space-between" : "center", alignItems: "baseline", gap: 12 }}>
            <Cap pal={pal}>held by the {arch.name}</Cap>
            <span style={{ fontFamily: FN, fontSize: 10.5, color: pal.inkSoft }}>{remaining}/{DAILY_EXCHANGE_LIMIT} today</span>
          </div>
        )}
        <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 21, color: pal.ink, marginTop: 14, maxWidth: 340, lineHeight: 1.4 }}>
          {gReply ?? (star && closed ? "The Genius is closed till tomorrow." : star && reach ? geniusLine(star, reach, fulfilled) : "Seal a star, and I will wake.")}
        </div>
        {star && (
          <div style={{ marginTop: 22, width: "100%" }}>
            <input value={gInput} placeholder={closed ? "closed till tomorrow" : "what moves in you tonight…"} disabled={gSending || closed}
              onChange={(e) => setGInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !closed) askDaily(); }}
              style={{ width: "100%", textAlign: wide ? "left" : "center", background: "transparent", border: "none",
                borderBottom: `1px solid ${pal.panelLine}`, color: pal.ink, fontFamily: FD, fontStyle: "italic", fontSize: 17, padding: "10px 2px", outline: "none" }} />
            <div style={{ marginTop: 16 }}><Btn pal={pal} disabled={gSending || closed || !gInput.trim()} onClick={askDaily}>{closed ? "Closed" : gSending ? "listening…" : "Reflect"}</Btn></div>
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
