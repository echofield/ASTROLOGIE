"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Genius from "@/components/Genius";
import Wheel from "@/components/Wheel";
import { natalChart, lonLabel, SIGN_NAMES, signIndex } from "@/lib/sky";
import { makeStar, reachOf, type SealedStar } from "@/lib/star";
import { archetypeForStar, geniusLine, geniusPhase } from "@/lib/archetypes";
import { fetchGeniusLine } from "@/lib/voice";
import { loadMessages, appendMessage, askGenius } from "@/lib/dialogue";
import type { ChatMessage } from "@/lib/llm/types";
import {
  getProfile, saveProfile, getStar, saveStar, resetAll, type Profile,
} from "@/lib/storage";
import { pull as cloudPull, push as cloudPush, wipe as cloudWipe } from "@/lib/cloud";
import type { PlanetName } from "@/lib/types";

type View = "threshold" | "birth" | "theme" | "northstar" | "star" | "genius" | "home" | "dialogue";
const PRE_SEAL: Record<string, boolean> = { threshold: true, birth: true, theme: true, northstar: true };

const FALLBACK_REPLIES = [
  "I am here, watching. Say more, and I will listen against the sky.",
  "The heavens are quiet on this — tell me what moves in you, and I will read it.",
  "I hold your star in view. Go on.",
];

const MEANING: Record<PlanetName, string> = {
  Sun: "Where you shine — what only you can author.",
  Moon: "What you feel deeply, without always showing it.",
  Mercury: "Your thought: how you reason, learn, and say it.",
  Venus: "What you love, and want to last.",
  Mars: "Your drive — the move that takes nerve.",
  Jupiter: "Where you grow, reach, and say yes.",
  Saturn: "Your discipline — the vow you keep.",
};

export default function Page() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [star, setStar] = useState<SealedStar | null>(null);
  const [view, setView] = useState<View>("threshold");
  const [baseDate, setBaseDate] = useState<Date>(() => new Date());

  // birth inputs
  const [bday, setBday] = useState("");
  const [btime, setBtime] = useState("");
  const [bplace, setBplace] = useState("");

  // theme detail
  const [selPlanet, setSelPlanet] = useState<PlanetName>("Moon");

  // ritual
  const [ritualOn, setRitualOn] = useState(false);
  const [rstep, setRstep] = useState(0);
  const [rmust, setRmust] = useState("");
  const [rname, setRname] = useState("");
  const [geniusWake, setGeniusWake] = useState(false);

  // dialogue
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [msgsLoaded, setMsgsLoaded] = useState(false);

  useEffect(() => {
    const p = getProfile();
    const s = getStar();
    setProfile(p);
    setStar(s);
    setView(!p ? "threshold" : s ? "home" : "northstar");
    setReady(true);
    // cloud restore (when configured) for a device that has nothing local yet
    if (!p || !s) {
      cloudPull().then((remote) => {
        if (!remote) return;
        if (!p && remote.profile) { saveProfile(remote.profile); setProfile(remote.profile); }
        if (!s && remote.star) { saveStar(remote.star); setStar(remote.star); }
        const np = p ?? remote.profile;
        const ns = s ?? remote.star;
        if (np) setView(ns ? "home" : "northstar");
      });
    }
  }, []);

  // keep the reach live
  useEffect(() => {
    const id = setInterval(() => setBaseDate(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const reach = useMemo(
    () => (star ? reachOf(star, baseDate) : null),
    [star, baseDate],
  );

  const fulfilled = !!star?.fulfilledAt;
  const phase = star && reach ? geniusPhase(reach, fulfilled) : "far";
  const saysTemplate = star && reach ? geniusLine(star, reach, fulfilled) : "";
  const arch = star ? archetypeForStar(star) : null;
  const arrived = phase === "arrived";

  // The Genius's voice: templated instantly, upgraded by Claude when a key is
  // live. Keyed on the moment (star · phase · fulfilled) so it doesn't refetch
  // on every minute-tick; falls back silently to the template otherwise.
  const [claudeSays, setClaudeSays] = useState("");
  useEffect(() => {
    setClaudeSays("");
    if (!star) return;
    const r = reachOf(star, new Date());
    const ph = geniusPhase(r, !!star.fulfilledAt);
    const t = geniusLine(star, r, !!star.fulfilledAt);
    let live = true;
    fetchGeniusLine(star, archetypeForStar(star), ph, r, t).then((line) => {
      if (live && line && line !== t) setClaudeSays(line);
    });
    return () => { live = false; };
  }, [star, phase, fulfilled]);
  const says = claudeSays || saysTemplate;

  // dialogue context + memory
  const natalSummary = useMemo(() => {
    if (!profile) return "";
    const p = profile.natal.positions;
    return `Sun in ${SIGN_NAMES[signIndex(p.Sun)]}, Moon in ${SIGN_NAMES[signIndex(p.Moon)]}, Venus in ${SIGN_NAMES[signIndex(p.Venus)]}`;
  }, [profile]);

  useEffect(() => {
    if (!ready || !star || msgsLoaded) return;
    setMsgsLoaded(true);
    loadMessages().then(setMessages);
  }, [ready, star, msgsLoaded]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    const um: ChatMessage = { role: "user", content: text };
    const next = [...messages, um];
    setMessages(next);
    setInput("");
    appendMessage(um);
    setSending(true);
    const ctx = {
      star: star ? { name: star.name, must: star.must, ruler: star.ruler } : undefined,
      archetype: arch ? { name: arch.name, essence: arch.essence } : undefined,
      natal: natalSummary,
      reach: reach ? { gap: reach.gap, days: reach.days, phase } : undefined,
    };
    const reply = await askGenius(next, ctx);
    const line = reply ?? FALLBACK_REPLIES[next.length % FALLBACK_REPLIES.length];
    const am: ChatMessage = { role: "assistant", content: line };
    setMessages((m) => [...m, am]);
    appendMessage(am);
    setSending(false);
  }, [input, sending, messages, star, arch, natalSummary, reach, phase]);

  const fulfill = useCallback(() => {
    if (!star) return;
    if (!confirm(`Let "${star.name}" rise? It becomes a kept star — the countdown ends.`)) return;
    const updated = { ...star, fulfilledAt: new Date().toISOString() };
    saveStar(updated);
    setStar(updated);
    cloudPush(profile, updated);
  }, [star, profile]);

  const showBar = ready && !!star && !PRE_SEAL[view] && !ritualOn;

  const castSky = useCallback(() => {
    if (!bday) return;
    const birthISO = `${bday}T${btime || "12:00"}`;
    const natal = natalChart(new Date(birthISO), birthISO);
    const p: Profile = {
      birthISO, place: bplace.trim(), natal, createdAt: new Date().toISOString(),
    };
    saveProfile(p);
    setProfile(p);
    cloudPush(p, null);
    setView("theme");
  }, [bday, btime, bplace]);

  const openRitual = useCallback(() => {
    setRmust(""); setRname(""); setRstep(1); setRitualOn(true);
  }, []);

  const sealNow = useCallback(() => {
    const s = makeStar(rmust, rname);
    saveStar(s);
    setStar(s);
    cloudPush(profile, s);
    setRstep(4);
    setTimeout(() => {
      setRitualOn(false);
      setView("genius");
      setGeniusWake(true);
      setTimeout(() => setGeniusWake(false), 1900);
    }, 2600);
  }, [rmust, rname, profile]);

  if (!ready) {
    return (<><div className="desk" /><div className="app" /></>);
  }

  const coord = profile
    ? `${(bday || profile.birthISO.split("T")[0]).toUpperCase()}${profile.place ? " · " + profile.place.toUpperCase() : ""}`
    : "";

  return (
    <>
      <div className="desk" />
      <div className="app">
        <div className="status">
          <span>{String(baseDate.getHours()).padStart(2, "0")}:{String(baseDate.getMinutes()).padStart(2, "0")}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span className="dot" /> Astrolabe
          </span>
        </div>

        <div className="screens">
          {/* THRESHOLD */}
          <section className={`screen nobar${view === "threshold" ? " active" : ""}`} id="threshold">
            <div className="col">
              <div className="eyebrow">The cabinet is closed</div>
              <div style={{ marginTop: 26 }}><Genius ticks={4} /></div>
              <h1>Astrolabe</h1>
              <div className="tag">An instrument cast on the day you began.</div>
              <button className="enter" onClick={() => setView("birth")}>Enter</button>
            </div>
          </section>

          {/* BIRTH */}
          <section className={`screen nobar${view === "birth" ? " active" : ""}`} id="birth">
            <div className="col">
              <div className="eyebrow">Your fixed sky</div>
              <div className="q" style={{ marginTop: 18 }}>When did you begin?</div>
              <input className="field" type="date" value={bday} onChange={(e) => setBday(e.target.value)} />
              <input className="field" type="time" value={btime} onChange={(e) => setBtime(e.target.value)} style={{ marginTop: 18, fontSize: 20 }} />
              <input className="field" type="text" value={bplace} placeholder="Paris" onChange={(e) => setBplace(e.target.value)} style={{ marginTop: 18, fontSize: 20 }} />
              <button className="btn" disabled={!bday} onClick={castSky}>Cast the sky</button>
            </div>
          </section>

          {/* THEME */}
          <section className={`screen nobar${view === "theme" ? " active" : ""}`} id="theme">
            <div className="scr-head">
              <button className="back" onClick={() => setView("birth")}>←</button>
              <span className="ttl">Your theme</span><span style={{ width: 18 }} />
            </div>
            {profile && (
              <>
                <div className="chart-wrap">
                  <Wheel natal={profile.natal.positions} onSelectPlanet={setSelPlanet} />
                </div>
                <div className="chart-cap"><span className="coord">{coord}</span></div>
                <div className="planet-detail">
                  <div className="h">
                    <span className="g">{({Sun:"☉",Moon:"☽",Mercury:"☿",Venus:"♀",Mars:"♂",Jupiter:"♃",Saturn:"♄"} as Record<PlanetName,string>)[selPlanet]}</span>
                    <span className="n">{selPlanet} · {lonLabel(profile.natal.positions[selPlanet])}</span>
                  </div>
                  <div className="body">{MEANING[selPlanet]}</div>
                </div>
                <div className="hint">Touch a planet on the wheel</div>
                <div className="midline">this is the sky you were born under.</div>
                <button className="btn center" style={{ marginTop: 26 }} onClick={() => setView("northstar")}>Continue</button>
              </>
            )}
          </section>

          {/* NORTH STAR — silence */}
          <section className={`screen nobar${view === "northstar" ? " active" : ""}`} id="northstar">
            <div className="col">
              <div className="eyebrow">Your North Star</div>
              <div className="verse">A star may be named.<br />Not today.<br />Not tomorrow.<br />Only when something<br />becomes necessary.</div>
              <button className="seal-star" onClick={openRitual}>Seal a Star</button>
            </div>
          </section>

          {/* THE STAR */}
          <section className={`screen${view === "star" ? " active" : ""}`} id="star">
            <div className="scr-head">
              <button className="back" onClick={() => setView("home")}>←</button>
              <span className="ttl">Your star</span><span style={{ width: 18 }} />
            </div>
            {star && reach && profile && (
              <>
                <div className={`reach${arrived ? " arrived" : ""}`}>
                  {fulfilled ? (
                    <>
                      <div className="deg"><b>risen</b></div>
                      <div className="lbl">{star.name} · kept since {new Date(star.fulfilledAt!).toLocaleDateString("en", { month: "short", day: "numeric" })}</div>
                    </>
                  ) : arrived ? (
                    <>
                      <div className="deg"><b>now</b></div>
                      <div className="lbl">the Moon stands on <b>{star.name}</b></div>
                    </>
                  ) : (
                    <>
                      <div className="deg">in <b>{reach.headline}</b></div>
                      <div className="lbl">the Moon will reach <b>{star.name}</b></div>
                    </>
                  )}
                </div>
                <div className="genius-says">{says}</div>
                <div className="chart-wrap">
                  <Wheel natal={profile.natal.positions} star={star} moonLon={reach.moonLon} />
                </div>
                <div className="starcard">
                  <div className="mark">{star.glyph}</div>
                  <div className="k">{fulfilled ? "A risen star" : "A sealed star"}</div>
                  <div className="nm">{star.name}</div>
                  <div className="must">“{star.must}”</div>
                  <div className="res">{star.resonance}</div>
                  <div className="meta">
                    <span>RULER <b>{star.rulerGlyph} {star.ruler}</b></span>
                    <span>HOUSE <b>{star.house}</b></span>
                    <span>SEALED <b>{new Date(star.sealedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</b></span>
                  </div>
                </div>
                {!fulfilled && (
                  <div style={{ textAlign: "center", marginTop: 18 }}>
                    <button className="linkish" onClick={fulfill}>let it rise — it has happened</button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* GENIUS */}
          <section className={`screen${view === "genius" ? " active" : ""}`} id="genius">
            <div className="scr-head">
              <button className="back" onClick={() => setView("home")}>←</button>
              <span className="ttl">Your Genius</span><span style={{ width: 18 }} />
            </div>
            <Genius ticks={6} dormant={!star} wake={geniusWake} pulse={arrived} />
            <div className="nature">
              <h2>{star ? "It has formed." : "Not yet."}</h2>
              <div className="born">
                Born of <b>your fixed sky</b><br />
                the <b>moving heavens</b><br />
                and what you found <b>necessary</b>
              </div>
              {star && arch && <div className="held">held by the {arch.name}</div>}
              <div className="line">
                {star ? says : "It will form when you seal a star."}
              </div>
              {star && (
                <button className="btn center" style={{ marginTop: 26 }} onClick={() => setView("dialogue")}>
                  Speak to it
                </button>
              )}
            </div>
          </section>

          {/* DIALOGUE */}
          <section className={`screen${view === "dialogue" ? " active" : ""}`} id="dialogue">
            <div className="scr-head">
              <button className="back" onClick={() => setView("genius")}>←</button>
              <span className="ttl">Dialogue</span><span style={{ width: 18 }} />
            </div>
            <div className="convo">
              {messages.length === 0 && (
                <div className="msg g">
                  <div className="who">Your Genius</div>
                  <div className="bubble">
                    {star ? `I am awake, and I hold ${star.name} in view. What moves in you tonight?` : "Seal a star, and I will wake."}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.role === "assistant" ? "g" : "u"}`}>
                  {m.role === "assistant" && <div className="who">Your Genius</div>}
                  <div className="bubble">{m.content}</div>
                </div>
              ))}
              {sending && <div className="typing">listening…</div>}
            </div>
            <div className="dialogue-in">
              <input
                value={input}
                placeholder="write to your Genius…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              />
              <button className="send" onClick={send} disabled={sending || !input.trim()}>↑</button>
            </div>
          </section>

          {/* HOME / CABINET */}
          <section className={`screen${view === "home" ? " active" : ""}`} id="home">
            <div className="greet">
              <div className="hand">Good evening.</div>
              <div className="sub">The sky has moved since yesterday.</div>
            </div>
            <Genius ticks={5} pulse={arrived} onClick={() => setView("genius")} />
            {star && reach && (
              <>
                <div className={`reach${arrived ? " arrived" : ""}`}>
                  {fulfilled ? (
                    <>
                      <div className="deg"><b>risen</b></div>
                      <div className="lbl">{star.name} · kept</div>
                    </>
                  ) : arrived ? (
                    <>
                      <div className="deg"><b>now</b></div>
                      <div className="lbl">the Moon stands on <b>{star.name}</b></div>
                    </>
                  ) : (
                    <>
                      <div className="deg">in <b>{reach.headline}</b></div>
                      <div className="lbl">the Moon nears <b>{star.name}</b></div>
                    </>
                  )}
                </div>
                <div className="genius-says">{says}</div>
              </>
            )}
            <div className="items">
              {star && (
                <button className="item" onClick={() => setView("star")}>
                  <div className="mark seal glyph">{star.glyph}</div>
                  <div><div className="t">Your star</div><div className="d">“{star.must}”</div></div>
                  <div className="arr">→</div>
                </button>
              )}
              <button className="item" onClick={() => setView("theme")}>
                <div className="mark glyph">☉</div>
                <div><div className="t">Your theme</div><div className="d">The sky you were born under</div></div>
                <div className="arr">→</div>
              </button>
            </div>
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button className="linkish" onClick={() => {
                if (confirm("Close the cabinet? This clears your sky and your sealed star.")) {
                  resetAll(); cloudWipe(); setProfile(null); setStar(null); setView("threshold");
                }
              }}>close the cabinet</button>
            </div>
          </section>
        </div>

        {/* RITUAL overlay */}
        <div className={`ritual${ritualOn ? " on" : ""}`}>
          <div className={`rstep${rstep === 1 ? " on" : ""}`}>
            <div className="eyebrow">One question</div>
            <div className="q" style={{ marginTop: 18 }}>What must happen?</div>
            <input className="field" value={rmust} placeholder="Launch Symione."
              onChange={(e) => setRmust(e.target.value)} />
            <button className="btn" disabled={!rmust.trim()} onClick={() => setRstep(2)}>Continue</button>
          </div>
          <div className={`rstep${rstep === 2 ? " on" : ""}`}>
            <div className="eyebrow">Name it</div>
            <input className="field" value={rname} placeholder="SYMIONE"
              onChange={(e) => setRname(e.target.value)}
              style={{ marginTop: 30, fontSize: 30, textTransform: "uppercase", letterSpacing: ".04em" }} />
            <button className="btn" disabled={!rname.trim()} onClick={() => setRstep(3)}>Continue</button>
          </div>
          <div className={`rstep${rstep === 3 ? " on" : ""}`} style={{ textAlign: "center" }}>
            <div className="eyebrow" style={{ display: "block", letterSpacing: ".4em" }}>This cannot be undone tonight</div>
            <div className="q" style={{ marginTop: 22 }}>“{rname.trim().toUpperCase()}”</div>
            <button className="btn center" onClick={sealNow}
              style={{ marginTop: 44, borderColor: "var(--oxblood)", color: "var(--oxblood)" }}>Seal it</button>
          </div>
          <div className={`rstep sealing${rstep === 4 ? " on" : ""}`}>
            <div className="wax glyph">{star?.glyph ?? "✶"}</div>
            <div className="said">{rname.trim().toUpperCase()}</div>
            <div className="cap">a star now stands in your sky</div>
          </div>
        </div>

        {/* TABBAR */}
        {showBar && (
          <nav className="tabbar">
            <button className={`tab${view === "home" ? " on" : ""}`} onClick={() => setView("home")}>
              <svg viewBox="0 0 24 24"><path d="M4 11l8-6 8 6" /><path d="M6 10v9h12v-9" /></svg><span className="l">Cabinet</span>
            </button>
            <button className={`tab${view === "star" ? " on" : ""}`} onClick={() => setView("star")}>
              <svg viewBox="0 0 24 24"><path d="M12 3l2.5 6 6 .5-4.5 4 1.5 6L12 16l-5 3.5 1.5-6L4 9.5l6-.5z" /></svg><span className="l">Star</span>
            </button>
            <button className={`tab${view === "genius" ? " on" : ""}`} onClick={() => setView("genius")}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="10" /></svg><span className="l">Genius</span>
            </button>
            <button className={`tab${view === "dialogue" ? " on" : ""}`} onClick={() => setView("dialogue")}>
              <svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z" /></svg><span className="l">Speak</span>
            </button>
            <button className={`tab${view === "theme" ? " on" : ""}`} onClick={() => setView("theme")}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></svg><span className="l">Theme</span>
            </button>
          </nav>
        )}
      </div>
    </>
  );
}
