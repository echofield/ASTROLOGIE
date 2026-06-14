"use client";

// THE PRIVATE INVITE — a one-time door, opened for one friend. OTP → language →
// birth → three chosen questions → the holding screen while the field draws →
// the reading, and a PDF to keep. Nothing is stored; download before you leave.
import { useEffect, useRef, useState } from "react";

const C = { bg: "#080d1c", ivory: "#ece4d2", ivoryDim: "#b6b1a3", gold: "#c2a25f", goldBright: "#e3c884", slate: "#6f7894", rule: "#1e2742" };

const COPY = {
  en: {
    doorEyebrow: "A door was opened to you", doorSub: "Enter the key you were given.",
    keyPh: "the key", enter: "Enter", denied: "That key doesn't open this door.",
    pick: "Choose your tongue", begin: "Begin",
    you: "Who this is for", name: "Your name", born: "When you were born",
    date: "Date of birth", time: "Hour of birth", noTime: "I don't know the hour",
    place: "Place of birth", placePh: "city, country", locating: "finding the sky…", located: "horizon set",
    questions: "Choose three questions", qHint: "Pick the three that land. Answer each in your own words.",
    answerPh: "in your own words…", draw: "Draw the reading",
    drawing: "The field is drawing", drawingSub: "This takes about three minutes. Stay on the page.",
    elapsed: "elapsed", yourReading: "Your reading", download: "Download the PDF",
    keep: "This page won't keep it. Download before you close.", again: "Something slipped. Try once more.",
    need3: "Choose exactly three.", needAll: "A name, a birth date, and your three answers.",
  },
  fr: {
    doorEyebrow: "Une porte vous a été ouverte", doorSub: "Entrez la clé qu'on vous a confiée.",
    keyPh: "la clé", enter: "Entrer", denied: "Cette clé n'ouvre pas cette porte.",
    pick: "Choisissez votre langue", begin: "Commencer",
    you: "Pour qui", name: "Votre nom", born: "Votre naissance",
    date: "Date de naissance", time: "Heure de naissance", noTime: "Je ne connais pas l'heure",
    place: "Lieu de naissance", placePh: "ville, pays", locating: "on cherche le ciel…", located: "horizon fixé",
    questions: "Choisissez trois questions", qHint: "Prenez les trois qui touchent. Répondez à chacune, avec vos mots.",
    answerPh: "avec vos mots…", draw: "Tirer la lecture",
    drawing: "Le champ se dessine", drawingSub: "Cela prend environ trois minutes. Restez sur la page.",
    elapsed: "écoulé", yourReading: "Votre lecture", download: "Télécharger le PDF",
    keep: "Cette page ne la gardera pas. Téléchargez avant de fermer.", again: "Quelque chose a glissé. Réessayez.",
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

const SECTIONS: Record<"en" | "fr", [string, string][]> = {
  en: [["signature", "Signature"], ["chart", "Chart"], ["pattern", "Pattern"], ["star", "Your star"], ["yearAhead", "Year ahead"], ["counsel", "Counsel"]],
  fr: [["signature", "Signature"], ["chart", "Thème"], ["pattern", "Motif"], ["star", "Votre étoile"], ["yearAhead", "L'année à venir"], ["counsel", "Conseil"]],
};

type Lang = "en" | "fr";
type Read = Record<string, string>;

function toBirthISO(date: string, time: string, timeUnknown: boolean, lon: number | null): string {
  const [Y, M, D] = date.split("-").map(Number);
  if (timeUnknown || !time || lon == null) return new Date(Date.UTC(Y, M - 1, D, 12, 0)).toISOString();
  const [h, mi] = time.split(":").map(Number);
  const offset = Math.round(lon / 15); // approximate birth-place timezone from longitude
  return new Date(Date.UTC(Y, M - 1, D, h - offset, mi)).toISOString();
}

export default function InvitePage() {
  const [stage, setStage] = useState<"gate" | "form" | "drawing" | "done" | "error">("gate");
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
  const [result, setResult] = useState<{ read: Read; plate: unknown; question: string; star?: { glyph: string } } | null>(null);

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
      setResult(d); setStage("done");
    } catch { setStage("error"); }
  }

  async function downloadPdf() {
    if (!result) return;
    const r = await fetch("/api/read/pdf", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: result.read, question: result.question, plate: result.plate, language: lang }),
    });
    if (!r.ok) return;
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(name.trim() || "the").replace(/\s+/g, "-").toLowerCase()}-reading.pdf`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // holding-screen timers
  useEffect(() => {
    if (stage !== "drawing") return;
    const e = setInterval(() => setElapsed((x) => x + 1), 1000);
    const l = setInterval(() => setLineIdx((x) => (x + 1) % DRAW_LINES[lang].length), 11000);
    return () => { clearInterval(e); clearInterval(l); };
  }, [stage, lang]);

  const mins = Math.floor(elapsed / 60), secs = elapsed % 60;

  return (
    <main style={{ minHeight: "100svh", background: C.bg, color: C.ivory, fontFamily: "var(--inv-body)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=EB+Garamond:ital@0;1&family=IBM+Plex+Mono:wght@400&display=swap');
        :root{--inv-serif:'Cormorant Garamond',Georgia,serif;--inv-body:'EB Garamond',Georgia,serif;--inv-mono:'IBM Plex Mono',ui-monospace,monospace}
        .inv-wrap{max-width:660px;margin:0 auto;padding:64px 26px 96px}
        .inv-eyebrow{font-family:var(--inv-mono);font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:${C.gold}}
        .inv-h{font-family:var(--inv-serif);font-weight:500;color:${C.ivory};line-height:1.1}
        .inv-label{font-family:var(--inv-mono);font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:${C.slate};margin-bottom:9px;display:block}
        .inv-in{width:100%;background:transparent;border:0;border-bottom:1px solid ${C.rule};color:${C.ivory};font-family:var(--inv-body);font-size:17px;padding:9px 2px;outline:none}
        .inv-in:focus{border-bottom-color:${C.gold}}
        .inv-ta{width:100%;background:rgba(255,255,255,.015);border:1px solid ${C.rule};color:${C.ivory};font-family:var(--inv-body);font-size:16px;line-height:1.5;padding:11px 13px;outline:none;resize:vertical;min-height:74px;border-radius:2px}
        .inv-ta:focus{border-color:${C.gold}}
        .inv-btn{font-family:var(--inv-mono);font-size:11px;letter-spacing:.26em;text-transform:uppercase;background:none;border:1px solid ${C.gold};color:${C.gold};padding:14px 30px;cursor:pointer;transition:background .2s}
        .inv-btn:hover{background:rgba(194,162,95,.1)}
        .inv-btn:disabled{opacity:.4;cursor:default}
        .inv-q{text-align:left;width:100%;background:none;border:1px solid ${C.rule};border-radius:2px;color:${C.ivoryDim};font-family:var(--inv-body);font-size:16px;line-height:1.45;padding:13px 15px;cursor:pointer;transition:.15s}
        .inv-q:hover{border-color:${C.slate}}
        .inv-q.on{border-color:${C.gold};color:${C.ivory};background:rgba(194,162,95,.07)}
        .inv-para{font-family:var(--inv-body);font-size:16.5px;line-height:1.66;color:${C.ivoryDim};margin:0 0 12px}
        .inv-para b{color:${C.goldBright};font-weight:400}
        @keyframes inv-breathe{0%,100%{opacity:.5;transform:scale(.97)}50%{opacity:1;transform:scale(1)}}
        .inv-sigil{animation:inv-breathe 4.5s ease-in-out infinite}
      `}</style>

      {stage === "gate" && (
        <div className="inv-wrap" style={{ minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 420 }}>
          <p className="inv-eyebrow" style={{ marginBottom: 14 }}>{t.doorEyebrow}</p>
          <p style={{ fontFamily: "var(--inv-body)", fontStyle: "italic", fontSize: 18, color: C.slate, marginBottom: 30 }}>{t.doorSub}</p>
          <input className="inv-in" type="password" value={otp} placeholder={t.keyPh} autoFocus
            onChange={(e) => { setOtp(e.target.value); setDenied(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") gate(); }} />
          <div style={{ marginTop: 26 }}><button className="inv-btn" onClick={gate}>{t.enter} →</button></div>
          {denied && <p style={{ marginTop: 16, fontSize: 15, color: C.slate, fontStyle: "italic" }}>{t.denied}</p>}
          <div style={{ marginTop: 30, display: "flex", gap: 16 }}>
            {(["en", "fr"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{ background: "none", border: 0, cursor: "pointer", fontFamily: "var(--inv-mono)", fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: lang === l ? C.gold : C.slate }}>{l === "en" ? "English" : "Français"}</button>
            ))}
          </div>
        </div>
      )}

      {stage === "form" && (
        <div className="inv-wrap">
          <p className="inv-eyebrow" style={{ marginBottom: 10 }}>{t.pick}</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 44 }}>
            {(["en", "fr"] as Lang[]).map((l) => (
              <button key={l} className="inv-q" style={{ width: "auto", padding: "8px 18px", borderColor: lang === l ? C.gold : C.rule, color: lang === l ? C.ivory : C.ivoryDim, background: lang === l ? "rgba(194,162,95,.07)" : "none" }} onClick={() => { setLang(l); setPicks([]); setAnswers({}); }}>{l === "en" ? "English" : "Français"}</button>
            ))}
          </div>

          <p className="inv-eyebrow" style={{ marginBottom: 18 }}>{t.you}</p>
          <div style={{ marginBottom: 26 }}>
            <label className="inv-label">{t.name}</label>
            <input className="inv-in" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <p className="inv-eyebrow" style={{ marginBottom: 18 }}>{t.born}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 18 }}>
            <div><label className="inv-label">{t.date}</label><input className="inv-in" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className="inv-label">{t.time}</label><input className="inv-in" type="time" value={time} disabled={noTime} onChange={(e) => setTime(e.target.value)} style={{ opacity: noTime ? 0.4 : 1 }} /></div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 26, cursor: "pointer", fontFamily: "var(--inv-body)", fontSize: 15, color: C.slate }}>
            <input type="checkbox" checked={noTime} onChange={(e) => setNoTime(e.target.checked)} /> {t.noTime}
          </label>
          <div style={{ marginBottom: 44 }}>
            <label className="inv-label">{t.place}</label>
            <input className="inv-in" value={place} placeholder={t.placePh} onChange={(e) => { setPlace(e.target.value); setGeoState(""); }} onBlur={(e) => geocode(e.target.value)} />
            {geoState === "loading" && <span style={{ fontFamily: "var(--inv-mono)", fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: C.slate }}>{t.locating}</span>}
            {geoState === "ok" && <span style={{ fontFamily: "var(--inv-mono)", fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: C.gold }}>✦ {t.located}</span>}
          </div>

          <p className="inv-eyebrow" style={{ marginBottom: 8 }}>{t.questions}</p>
          <p style={{ fontFamily: "var(--inv-body)", fontStyle: "italic", fontSize: 15.5, color: C.slate, marginBottom: 20 }}>{t.qHint} <span style={{ color: picks.length === 3 ? C.gold : C.slate }}>· {picks.length}/3</span></p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {QUESTIONS[lang].map((q, i) => {
              const on = picks.includes(i);
              return (
                <div key={i}>
                  <button className={`inv-q${on ? " on" : ""}`} onClick={() => togglePick(i)}>
                    <span style={{ color: on ? C.gold : C.slate, fontFamily: "var(--inv-mono)", fontSize: 11, marginRight: 10 }}>{on ? "✦" : "○"}</span>{q}
                  </button>
                  {on && <textarea className="inv-ta" style={{ marginTop: 8 }} placeholder={t.answerPh} value={answers[i] || ""} onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))} />}
                </div>
              );
            })}
          </div>

          {formErr && <p style={{ marginTop: 22, fontSize: 15, color: C.gold, fontStyle: "italic" }}>{formErr}</p>}
          <div style={{ marginTop: 36 }}><button className="inv-btn" onClick={draw} disabled={picks.length !== 3}>{t.draw} →</button></div>
        </div>
      )}

      {stage === "drawing" && (
        <div className="inv-wrap" style={{ minHeight: "100svh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <svg className="inv-sigil" width={64} height={64} viewBox="0 0 50 50" style={{ marginBottom: 34 }}>
            <circle cx={25} cy={25} r={22} stroke="#8a7140" strokeWidth={1} fill="none" />
            <circle cx={25} cy={25} r={15} stroke={C.gold} strokeWidth={1} fill="none" />
            <circle cx={25} cy={19} r={8.5} stroke={C.goldBright} strokeWidth={1} fill="none" />
            <path d="M25 7v6 M25 43v-6 M7 25h6 M43 25h-6" stroke={C.gold} strokeWidth={1} />
            <circle cx={25} cy={25} r={1.7} fill={C.goldBright} />
          </svg>
          <p className="inv-h" style={{ fontSize: 30, marginBottom: 14 }}>{t.drawing}{name ? <span style={{ color: C.slate }}> — {name}</span> : null}</p>
          <p style={{ fontFamily: "var(--inv-body)", fontStyle: "italic", fontSize: 18, color: C.gold, minHeight: 28, transition: "opacity .4s", marginBottom: 26 }}>{DRAW_LINES[lang][lineIdx]}</p>
          <p style={{ fontFamily: "var(--inv-body)", fontSize: 15, color: C.slate, marginBottom: 18 }}>{t.drawingSub}</p>
          <p style={{ fontFamily: "var(--inv-mono)", fontSize: 11, letterSpacing: ".24em", color: C.slate }}>{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")} {t.elapsed}</p>
        </div>
      )}

      {stage === "done" && result && (
        <div className="inv-wrap">
          <p className="inv-eyebrow" style={{ marginBottom: 12 }}>{result.star?.glyph || "✦"} {t.yourReading}</p>
          <p className="inv-h" style={{ fontSize: 30, marginBottom: 6 }}>{name}</p>
          <div style={{ borderBottom: `1px solid ${C.rule}`, margin: "22px 0 8px" }} />
          {SECTIONS[lang].map(([key, label]) => (
            <div key={key} style={{ marginBottom: 6 }}>
              <p className="inv-label" style={{ color: "#8a7140", marginTop: 30 }}>{label}</p>
              {(result.read[key] || "").split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean).map((p, j) => (
                <p key={j} className="inv-para" dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") }} />
              ))}
            </div>
          ))}
          <div style={{ marginTop: 40, paddingTop: 26, borderTop: `1px solid ${C.rule}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <button className="inv-btn" onClick={downloadPdf}>↓ {t.download}</button>
            <p style={{ fontFamily: "var(--inv-body)", fontStyle: "italic", fontSize: 14, color: C.slate, textAlign: "center" }}>{t.keep}</p>
          </div>
        </div>
      )}

      {stage === "error" && (
        <div className="inv-wrap" style={{ minHeight: "100svh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--inv-body)", fontStyle: "italic", fontSize: 19, color: C.ivoryDim, marginBottom: 26 }}>{t.again}</p>
          <button className="inv-btn" onClick={() => setStage("form")}>← {t.enter}</button>
        </div>
      )}
    </main>
  );
}
