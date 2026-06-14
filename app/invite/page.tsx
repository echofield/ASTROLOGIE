"use client";

// THE PRIVATE INVITE — a one-time door, opened for one friend. Built on the site's
// own gold register (lib/atlas-ui GOLD, the layout's fonts). OTP → language → birth
// → three chosen questions → the holding screen → the reading, surfaced through the
// canonical reveal (ReadReveal: sealed letter, the wheel, the keepable PDF). Nothing
// is stored; download before you leave.
import { useEffect, useState } from "react";
import { GOLD as G } from "@/lib/atlas-ui";
import ReadReveal, { type RevealRead } from "@/components/read/ReadReveal";
import type { PlateData } from "@/lib/atlas/plate";

const COPY = {
  en: {
    doorEyebrow: "A door was opened to you", doorSub: "Enter the key you were given.",
    keyPh: "the key", enter: "Enter", denied: "That key doesn't open this door.",
    you: "Who this is for", name: "Your name", born: "When you were born",
    date: "Date of birth", time: "Hour of birth", noTime: "I don't know the hour",
    place: "Place of birth", placePh: "city, country", locating: "finding the sky…", located: "horizon set",
    questions: "Choose three questions", qHint: "Pick the three that land. Answer each in your own words.",
    answerPh: "in your own words…", draw: "Draw the reading",
    drawing: "The field is drawing", drawingSub: "This takes about three minutes. Stay on the page.",
    elapsed: "elapsed", again: "Something slipped. Try once more.", back: "Back",
    closedEyebrow: "The door is closed", closedLine: "The reading was drawn once, and is yours alone.",
    need3: "Choose exactly three.", needAll: "A name, a birth date, and your three answers.",
  },
  fr: {
    doorEyebrow: "Une porte vous a été ouverte", doorSub: "Entrez la clé qu'on vous a confiée.",
    keyPh: "la clé", enter: "Entrer", denied: "Cette clé n'ouvre pas cette porte.",
    you: "Pour qui", name: "Votre nom", born: "Votre naissance",
    date: "Date de naissance", time: "Heure de naissance", noTime: "Je ne connais pas l'heure",
    place: "Lieu de naissance", placePh: "ville, pays", locating: "on cherche le ciel…", located: "horizon fixé",
    questions: "Choisissez trois questions", qHint: "Prenez les trois qui touchent. Répondez à chacune, avec vos mots.",
    answerPh: "avec vos mots…", draw: "Tirer la lecture",
    drawing: "Le champ se dessine", drawingSub: "Cela prend environ trois minutes. Restez sur la page.",
    elapsed: "écoulé", again: "Quelque chose a glissé. Réessayez.", back: "Retour",
    closedEyebrow: "La porte est close", closedLine: "La lecture a été tirée une fois, et n'est qu'à vous.",
    need3: "Choisissez exactement trois.", needAll: "Un nom, une date de naissance, et vos trois réponses.",
  },
};

const QUESTIONS = {
  en: [
    "What season of your life are you in right now?",
    "What keeps repeating — the pattern you can't seem to leave?",
    "What are you afraid of — the quiet one, underneath?",
    "What did you decide long ago and never revisit?",
    "What are you carrying that was never yours to carry?",
    "What do you most want, and rarely say out loud?",
  ],
  fr: [
    "Dans quelle saison de votre vie êtes-vous, maintenant ?",
    "Qu'est-ce qui se répète — le motif dont vous n'arrivez pas à sortir ?",
    "De quoi avez-vous peur — la peur discrète, celle d'en dessous ?",
    "Qu'avez-vous décidé il y a longtemps, sans jamais y revenir ?",
    "Que portez-vous qui ne vous a jamais appartenu ?",
    "Que désirez-vous le plus, et dites-vous rarement à voix haute ?",
  ],
};

const DRAW_LINES = {
  en: ["Placing the planets at the hour you were born.", "Reading what repeats.", "Crossing your words with the hardest angle in the chart.", "Finding the one star.", "Holding the line warm, then cool.", "Setting it down in ink."],
  fr: ["On place les planètes à l'heure de votre naissance.", "On lit ce qui se répète.", "On croise vos mots avec l'angle le plus dur du thème.", "On cherche l'étoile unique.", "On tient la ligne — chaude, puis froide.", "On la pose à l'encre."],
};

type Lang = "en" | "fr";

function toBirthISO(date: string, time: string, timeUnknown: boolean, lon: number | null): string {
  const [Y, M, D] = date.split("-").map(Number);
  if (timeUnknown || !time || lon == null) return new Date(Date.UTC(Y, M - 1, D, 12, 0)).toISOString();
  const [h, mi] = time.split(":").map(Number);
  const offset = Math.round(lon / 15); // approximate birth-place timezone from longitude
  return new Date(Date.UTC(Y, M - 1, D, h - offset, mi)).toISOString();
}

const Sigil = ({ size = 120 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden>
    <circle cx="60" cy="60" r="50" stroke={G.gold} strokeOpacity=".15" />
    <circle cx="60" cy="48" r="22" stroke={G.gold} strokeOpacity=".5" />
    <circle cx="60" cy="60" r="3" fill={G.goldBright} />
    <circle cx="60" cy="26" r="2" fill="#cbb583" />
  </svg>
);

export default function InvitePage() {
  const [stage, setStage] = useState<"gate" | "form" | "drawing" | "reveal" | "closed" | "error">("gate");
  const [otp, setOtp] = useState("");
  const [denied, setDenied] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const t = COPY[lang];

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [noTime, setNoTime] = useState(false);
  const [place, setPlace] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoState, setGeoState] = useState<"" | "loading" | "ok" | "fail">("");
  const [picks, setPicks] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [formErr, setFormErr] = useState("");

  const [elapsed, setElapsed] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [result, setResult] = useState<{ read: RevealRead; plate: PlateData | null; question: string } | null>(null);

  async function gate() {
    const k = otp.trim();
    if (!k) return;
    try {
      const r = await fetch("/api/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otp: k, probe: true }) });
      if (r.ok) { setStage("form"); return; }
    } catch { /* fall through */ }
    setDenied(true);
  }

  async function geocode(q: string) {
    if (!q.trim()) { setCoords(null); setGeoState(""); return; }
    setGeoState("loading");
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q.trim())}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      if (typeof d.lat === "number" && typeof d.lon === "number") { setCoords({ lat: d.lat, lon: d.lon }); setGeoState("ok"); return; }
      throw new Error();
    } catch { setCoords(null); setGeoState("fail"); }
  }

  function togglePick(i: number) {
    setPicks((p) => p.includes(i) ? p.filter((x) => x !== i) : p.length >= 3 ? p : [...p, i]);
  }

  async function draw() {
    setFormErr("");
    if (!name.trim() || !date) { setFormErr(t.needAll); return; }
    if (picks.length !== 3) { setFormErr(t.need3); return; }
    if (picks.some((i) => !(answers[i] || "").trim())) { setFormErr(t.needAll); return; }

    const birthISO = toBirthISO(date, time, noTime, coords?.lon ?? null);
    const questions = picks.map((i) => ({ question: QUESTIONS[lang][i], answer: (answers[i] || "").trim() }));
    setStage("drawing"); setElapsed(0); setLineIdx(0);
    try {
      const r = await fetch("/api/invite", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: otp.trim(), name: name.trim(), language: lang, birthISO,
          place: place.trim() || null, lat: coords?.lat ?? null, lon: coords?.lon ?? null,
          timeUnknown: noTime || !time, questions,
        }),
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      if (!d.read) throw new Error();
      // the sealed question for the reveal threshold: the first the friend chose
      setResult({ read: d.read, plate: d.plate ?? null, question: QUESTIONS[lang][picks[0]] });
      setStage("reveal");
    } catch { setStage("error"); }
  }

  useEffect(() => {
    if (stage !== "drawing") return;
    const e = setInterval(() => setElapsed((x) => x + 1), 1000);
    const l = setInterval(() => setLineIdx((x) => (x + 1) % DRAW_LINES[lang].length), 11000);
    return () => { clearInterval(e); clearInterval(l); };
  }, [stage, lang]);

  const mins = Math.floor(elapsed / 60), secs = elapsed % 60;

  if (stage === "reveal" && result) {
    return <ReadReveal read={result.read} question={result.question} lang={lang} plate={result.plate} onClose={() => setStage("closed")} />;
  }

  return (
    <main style={{ minHeight: "100svh", background: G.bg, color: G.ivory, fontFamily: G.body }}>
      <style>{`
        .iv-wrap{max-width:680px;margin:0 auto;padding:14vh 26px 22vh}
        .iv-center{min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:8vh 32px}
        .iv-eyebrow{font-family:${G.mono};font-size:11.5px;letter-spacing:.4em;text-transform:uppercase;color:${G.gold}}
        .iv-eyebrowq{font-family:${G.mono};font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${G.goldDeep};margin:36px 0 16px}
        .iv-h{font-family:${G.serif};font-weight:500;color:${G.ivory};line-height:1.1;letter-spacing:.4px}
        .iv-line{font-family:${G.serif};font-style:italic;color:${G.ivoryDim};line-height:1.42}
        .iv-label{font-family:${G.mono};font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:${G.slate};margin-bottom:10px;display:block}
        .iv-in{width:100%;background:transparent;border:0;border-bottom:1px solid ${G.rule};color:${G.ivory};font-family:${G.body};font-size:19px;padding:10px 2px;outline:none;transition:border-color .5s ${G.ease}}
        .iv-in:focus{border-bottom-color:${G.gold}}
        .iv-in::-webkit-calendar-picker-indicator{filter:invert(.7) sepia(.4) saturate(2) hue-rotate(2deg);opacity:.6;cursor:pointer}
        .iv-ta{width:100%;background:rgba(20,33,66,.30);border:1px solid ${G.rule};color:${G.ivory};font-family:${G.body};font-size:18px;line-height:1.55;padding:13px 15px;outline:none;resize:vertical;min-height:80px;border-radius:2px;transition:border-color .5s ${G.ease}}
        .iv-ta:focus{border-color:${G.gold}}
        .iv-btn{display:inline-flex;align-items:center;gap:13px;font-family:${G.mono};font-size:12px;letter-spacing:.28em;text-transform:uppercase;background:none;border:1px solid ${G.gold};color:${G.goldBright};padding:16px 32px;cursor:pointer;transition:background .6s ${G.ease},color .6s,border-color .6s}
        .iv-btn:hover{background:rgba(194,162,95,.08);color:#f3e3bd;border-color:${G.goldBright}}
        .iv-btn:disabled{opacity:.4;cursor:default}
        .iv-toggle{font-family:${G.mono};font-size:11px;letter-spacing:.24em;text-transform:uppercase;background:none;border:1px solid ${G.rule};padding:8px 18px;cursor:pointer;transition:.4s ${G.ease};border-radius:2px}
        .iv-q{text-align:left;width:100%;background:none;border:1px solid ${G.rule};border-radius:2px;color:${G.ivoryDim};font-family:${G.body};font-size:18px;line-height:1.45;padding:14px 16px;cursor:pointer;transition:.3s ${G.ease};display:flex;gap:12px;align-items:baseline}
        .iv-q:hover{border-color:${G.slate};color:${G.ivory}}
        .iv-q.on{border-color:${G.gold};color:${G.ivory};background:rgba(194,162,95,.06)}
        .iv-q .mk{font-family:${G.mono};font-size:11px;color:${G.slate}}
        .iv-q.on .mk{color:${G.gold}}
        @keyframes iv-breathe{0%,100%{opacity:.55;transform:scale(.97)}50%{opacity:1;transform:scale(1)}}
        .iv-sigil{animation:iv-breathe 5s ease-in-out infinite}
        .iv-check{accent-color:${G.gold}}
        @media(max-width:640px){.iv-grid2{grid-template-columns:1fr!important}}
      `}</style>

      {stage === "gate" && (
        <div className="iv-center">
          <div className="iv-sigil" style={{ marginBottom: 28 }}><Sigil /></div>
          <p className="iv-eyebrow" style={{ marginBottom: 22 }}>{t.doorEyebrow}</p>
          <p className="iv-line" style={{ fontSize: "clamp(19px,2vw,24px)", maxWidth: "26ch", marginBottom: 38 }}>{t.doorSub}</p>
          <input className="iv-in" style={{ maxWidth: 280, textAlign: "center", letterSpacing: ".3em" }} type="password" value={otp} placeholder={t.keyPh} autoFocus
            onChange={(e) => { setOtp(e.target.value); setDenied(false); }} onKeyDown={(e) => { if (e.key === "Enter") gate(); }} />
          <button className="iv-btn" style={{ marginTop: 30 }} onClick={gate}>{t.enter} <span>→</span></button>
          {denied && <p className="iv-line" style={{ fontSize: 16, marginTop: 18, color: G.slate }}>{t.denied}</p>}
          <div style={{ marginTop: 34, display: "flex", gap: 18 }}>
            {(["en", "fr"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{ background: "none", border: 0, cursor: "pointer", fontFamily: G.mono, fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase", color: lang === l ? G.gold : G.slateDim }}>{l === "en" ? "English" : "Français"}</button>
            ))}
          </div>
        </div>
      )}

      {stage === "form" && (
        <div className="iv-wrap">
          <p className="iv-eyebrow" style={{ marginBottom: 14 }}>{lang === "fr" ? "Votre langue" : "Your tongue"}</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 48 }}>
            {(["en", "fr"] as Lang[]).map((l) => (
              <button key={l} className="iv-toggle" style={{ borderColor: lang === l ? G.gold : G.rule, color: lang === l ? G.goldBright : G.slate, background: lang === l ? "rgba(194,162,95,.06)" : "none" }} onClick={() => { setLang(l); setPicks([]); setAnswers({}); }}>{l === "en" ? "English" : "Français"}</button>
            ))}
          </div>

          <p className="iv-eyebrowq" style={{ marginTop: 0 }}>{t.you}</p>
          <div style={{ marginBottom: 30 }}>
            <label className="iv-label">{t.name}</label>
            <input className="iv-in" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <p className="iv-eyebrowq">{t.born}</p>
          <div className="iv-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 18 }}>
            <div><label className="iv-label">{t.date}</label><input className="iv-in" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className="iv-label">{t.time}</label><input className="iv-in" type="time" value={time} disabled={noTime} onChange={(e) => setTime(e.target.value)} style={{ opacity: noTime ? 0.4 : 1 }} /></div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 30, cursor: "pointer", fontFamily: G.body, fontSize: 16, color: G.slate }}>
            <input className="iv-check" type="checkbox" checked={noTime} onChange={(e) => setNoTime(e.target.checked)} /> {t.noTime}
          </label>
          <div style={{ marginBottom: 12 }}>
            <label className="iv-label">{t.place}</label>
            <input className="iv-in" value={place} placeholder={t.placePh} onChange={(e) => { setPlace(e.target.value); setGeoState(""); }} onBlur={(e) => geocode(e.target.value)} />
          </div>
          <div style={{ minHeight: 16, marginBottom: 40, fontFamily: G.mono, fontSize: 9.5, letterSpacing: ".22em", textTransform: "uppercase" }}>
            {geoState === "loading" && <span style={{ color: G.slate }}>{t.locating}</span>}
            {geoState === "ok" && <span style={{ color: G.gold }}>✦ {t.located}</span>}
          </div>

          <p className="iv-eyebrowq">{t.questions}</p>
          <p className="iv-line" style={{ fontSize: 17, marginBottom: 22 }}>{t.qHint} <span style={{ fontFamily: G.mono, fontStyle: "normal", fontSize: 11, letterSpacing: ".1em", color: picks.length === 3 ? G.gold : G.slate }}>· {picks.length}/3</span></p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {QUESTIONS[lang].map((q, i) => {
              const on = picks.includes(i);
              return (
                <div key={i}>
                  <button className={`iv-q${on ? " on" : ""}`} onClick={() => togglePick(i)}>
                    <span className="mk">{on ? "✦" : "○"}</span>{q}
                  </button>
                  {on && <textarea className="iv-ta" style={{ marginTop: 9 }} placeholder={t.answerPh} value={answers[i] || ""} onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))} />}
                </div>
              );
            })}
          </div>

          {formErr && <p className="iv-line" style={{ fontSize: 16, marginTop: 24, color: G.gold }}>{formErr}</p>}
          <div style={{ marginTop: 40 }}><button className="iv-btn" onClick={draw} disabled={picks.length !== 3}>{t.draw} <span>→</span></button></div>
        </div>
      )}

      {stage === "drawing" && (
        <div className="iv-center">
          <div className="iv-sigil" style={{ marginBottom: 36 }}><Sigil size={96} /></div>
          <p className="iv-h" style={{ fontSize: "clamp(28px,3.4vw,40px)", marginBottom: 16 }}>{t.drawing}{name ? <span style={{ color: G.slate }}> — {name}</span> : null}</p>
          <p className="iv-line" style={{ fontSize: "clamp(19px,2vw,24px)", color: G.gold, minHeight: 30, marginBottom: 30, maxWidth: "30ch" }}>{DRAW_LINES[lang][lineIdx]}</p>
          <p className="iv-line" style={{ fontSize: 16, color: G.slate, marginBottom: 22, fontStyle: "normal", fontFamily: G.body }}>{t.drawingSub}</p>
          <p style={{ fontFamily: G.mono, fontSize: 11, letterSpacing: ".26em", color: G.slateDim }}>{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")} {t.elapsed}</p>
        </div>
      )}

      {stage === "closed" && (
        <div className="iv-center">
          <div style={{ marginBottom: 28, opacity: .5 }}><Sigil size={84} /></div>
          <p className="iv-eyebrow" style={{ marginBottom: 20 }}>{t.closedEyebrow}</p>
          <p className="iv-line" style={{ fontSize: "clamp(20px,2.2vw,27px)", maxWidth: "26ch", color: G.ivoryDim }}>{t.closedLine}</p>
        </div>
      )}

      {stage === "error" && (
        <div className="iv-center">
          <p className="iv-line" style={{ fontSize: "clamp(20px,2.2vw,26px)", color: G.ivoryDim, marginBottom: 28 }}>{t.again}</p>
          <button className="iv-btn" onClick={() => setStage("form")}>← {t.back}</button>
        </div>
      )}
    </main>
  );
}
