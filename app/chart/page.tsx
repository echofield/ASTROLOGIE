"use client";

// THE NATAL WHEEL — a public instrument in the site's own register. Give it a
// moment and a place; it casts the sky exactly as it stood and draws the wheel
// in, ring by ring. The math is the repo's own engine (displaySky / ascendant /
// buildPlate — real astronomy, no external API, computed in the browser); the
// wheel reuses the geometry the reading and the PDF already trust.
import { useEffect, useState } from "react";
import Link from "next/link";
import { GOLD as G } from "@/lib/atlas-ui";
import ChartWheel from "@/components/atlas/ChartWheel";
import { displaySky, signOf, SIGN_NAME } from "@/lib/chart";
import { houseOf } from "@/lib/ascendant";
import { buildPlate, type PlateData } from "@/lib/atlas/plate";
import type { Profile } from "@/lib/storage";

const COPY = {
  en: {
    eyebrow: "The Natal Wheel", lede: "The sky exactly as it stood — your date, your hour, your place on earth, drawn into one wheel.",
    date: "Date of birth", time: "Hour of birth", noTime: "I don't know the hour",
    place: "Place of birth", placePh: "city, country", locating: "finding the sky…", located: "horizon set",
    cast: "Cast the chart", casting: "casting…", needDate: "A birth date, at least.",
    placements: "Placements", angles: "The angles", aspects: "The aspects it holds",
    again: "Another moment", hourUnknown: "Hour unknown — the wheel is drawn without its horizon.",
    home: "← The AstroLab", read: "Have it read →",
  },
  fr: {
    eyebrow: "La Roue Natale", lede: "Le ciel tel qu'il se tenait — votre date, votre heure, votre lieu sur terre, tracés en une roue.",
    date: "Date de naissance", time: "Heure de naissance", noTime: "Je ne connais pas l'heure",
    place: "Lieu de naissance", placePh: "ville, pays", locating: "on cherche le ciel…", located: "horizon fixé",
    cast: "Tirer le thème", casting: "on tire…", needDate: "Une date de naissance, au moins.",
    placements: "Positions", angles: "Les angles", aspects: "Les aspects qu'il porte",
    again: "Un autre moment", hourUnknown: "Heure inconnue — la roue est tracée sans son horizon.",
    home: "← The AstroLab", read: "Le faire lire →",
  },
};

type Lang = "en" | "fr";
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function toBirthISO(date: string, time: string, timeUnknown: boolean, lon: number | null): string {
  const [Y, M, D] = date.split("-").map(Number);
  if (timeUnknown || !time || lon == null) return new Date(Date.UTC(Y, M - 1, D, 12, 0)).toISOString();
  const [h, mi] = time.split(":").map(Number);
  const offset = Math.round(lon / 15);
  return new Date(Date.UTC(Y, M - 1, D, h - offset, mi)).toISOString();
}

function dms(lon: number): string {
  const within = ((lon % 30) + 30) % 30;
  const d = Math.floor(within);
  const m = Math.round((within - d) * 60);
  return m === 60 ? `${d + 1}°00′` : `${d}°${String(m).padStart(2, "0")}′`;
}

interface Row { name: string; lon: number; sign: string; house: string | null }
interface Cast { plate: PlateData; rows: Row[]; asc: Row | null; mc: Row | null }

export default function ChartPage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = COPY[lang];
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [noTime, setNoTime] = useState(false);
  const [place, setPlace] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoState, setGeoState] = useState<"" | "loading" | "ok" | "fail">("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cast, setCast] = useState<Cast | null>(null);
  const [revealed, setRevealed] = useState(false);

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

  async function doCast() {
    setErr("");
    if (!date) { setErr(t.needDate); return; }
    setBusy(true);
    try {
      let c = coords;
      if (!c && place.trim() && !noTime) {
        try {
          const r = await fetch(`/api/geocode?q=${encodeURIComponent(place.trim())}`);
          if (r.ok) { const d = await r.json(); if (typeof d.lat === "number") { c = { lat: d.lat, lon: d.lon }; setCoords(c); } }
        } catch { /* unknown place → no horizon */ }
      }
      const timeUnknown = noTime || !time;
      const birthISO = toBirthISO(date, time, timeUnknown, c?.lon ?? null);
      const birth = new Date(birthISO);
      const lonMap = displaySky(birth);
      const profile: Profile = {
        birthISO, place: place.trim(), natal: { positions: lonMap, birthISO } as unknown as Profile["natal"],
        createdAt: new Date().toISOString(),
        ...(c ? { lat: c.lat, lon: c.lon } : {}), timeUnknown,
      };
      const plate = buildPlate(profile);
      const asc = plate.input.asc ?? null;
      const rows: Row[] = Object.entries(plate.input.planets).map(([name, lon]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        lon, sign: SIGN_NAME[signOf(lon)],
        house: asc != null ? ROMAN[(houseOf(lon, asc) - 1 + 12) % 12] : null,
      }));
      const angle = (lon: number | null | undefined): Row | null =>
        lon == null ? null : { name: "", lon, sign: SIGN_NAME[signOf(lon)], house: null };
      setCast({ plate, rows, asc: angle(plate.input.asc), mc: angle(plate.input.mc) });
      setRevealed(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setRevealed(true)));
    } catch {
      setErr("The sky wouldn't compute for that moment. Check the date.");
    } finally { setBusy(false); }
  }

  function again() { setCast(null); setRevealed(false); }

  useEffect(() => { if (cast && !revealed) { const id = setTimeout(() => setRevealed(true), 80); return () => clearTimeout(id); } }, [cast, revealed]);

  return (
    <main style={{ minHeight: "100svh", background: G.bg, color: G.ivory, fontFamily: G.body }}>
      <style>{`
        .ch-wrap{max-width:560px;margin:0 auto;padding:13vh 26px 18vh}
        .ch-eyebrow{font-family:${G.mono};font-size:11.5px;letter-spacing:.4em;text-transform:uppercase;color:${G.gold}}
        .ch-h{font-family:${G.serif};font-weight:500;color:${G.ivory};line-height:1.08;letter-spacing:.4px}
        .ch-line{font-family:${G.serif};font-style:italic;color:${G.ivoryDim};line-height:1.42}
        .ch-label{font-family:${G.mono};font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:${G.slate};margin-bottom:10px;display:block}
        .ch-in{width:100%;background:transparent;border:0;border-bottom:1px solid ${G.rule};color:${G.ivory};font-family:${G.body};font-size:19px;padding:10px 2px;outline:none;transition:border-color .5s ${G.ease}}
        .ch-in:focus{border-bottom-color:${G.gold}}
        .ch-in::-webkit-calendar-picker-indicator{filter:invert(.7) sepia(.4) saturate(2) hue-rotate(2deg);opacity:.6;cursor:pointer}
        .ch-btn{display:inline-flex;align-items:center;gap:13px;font-family:${G.mono};font-size:12px;letter-spacing:.28em;text-transform:uppercase;background:none;border:1px solid ${G.gold};color:${G.goldBright};padding:16px 32px;cursor:pointer;transition:background .6s ${G.ease},color .6s,border-color .6s}
        .ch-btn:hover{background:rgba(194,162,95,.08);color:#f3e3bd;border-color:${G.goldBright}}
        .ch-btn:disabled{opacity:.45;cursor:default}
        .ch-toggle{font-family:${G.mono};font-size:10px;letter-spacing:.24em;text-transform:uppercase;background:none;border:0;cursor:pointer}
        .ch-link{font-family:${G.mono};font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:${G.slate};text-decoration:none;transition:color .4s ${G.ease}}
        .ch-link:hover{color:${G.goldBright}}
        .ch-check{accent-color:${G.gold}}
        /* cast view */
        .ch-cast{max-width:1080px;margin:0 auto;padding:10vh 26px 16vh;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(260px,.85fr);gap:48px;align-items:start}
        .ch-wheel-wrap{width:100%;max-width:680px;margin:0 auto}
        .ch-led-row{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:9px 0;border-bottom:1px solid ${G.ruleSoft}}
        .ch-led-name{font-family:${G.serif};font-size:18px;color:${G.ivory}}
        .ch-led-val{font-family:${G.mono};font-size:12px;letter-spacing:.06em;color:${G.ivoryDim};text-align:right}
        .ch-led-val .ho{color:${G.goldDeep};margin-left:8px}
        .ch-asp{font-family:${G.mono};font-size:11px;letter-spacing:.05em;color:${G.gold};padding:5px 0}
        .ch-fade{opacity:0;transform:translateY(14px);transition:opacity 1.1s ${G.ease} 1.9s,transform 1.1s ${G.ease} 1.9s}
        .ch-fade.in{opacity:1;transform:none}
        @media(prefers-reduced-motion:reduce){.ch-fade{opacity:1!important;transform:none!important;transition:none}}
        @media(max-width:880px){.ch-cast{grid-template-columns:1fr;gap:30px}}
      `}</style>

      {!cast && (
        <div className="ch-wrap">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 40 }}>
            <Link className="ch-link" href="/">{t.home}</Link>
            <span style={{ display: "flex", gap: 14 }}>
              {(["en", "fr"] as Lang[]).map((l) => (
                <button key={l} className="ch-toggle" onClick={() => setLang(l)} style={{ color: lang === l ? G.gold : G.slateDim }}>{l === "en" ? "EN" : "FR"}</button>
              ))}
            </span>
          </div>

          <p className="ch-eyebrow" style={{ marginBottom: 18 }}>{t.eyebrow}</p>
          <p className="ch-line" style={{ fontSize: "clamp(20px,2.3vw,28px)", maxWidth: "24ch", marginBottom: 52 }}>{t.lede}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 18 }}>
            <div><label className="ch-label">{t.date}</label><input className="ch-in" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className="ch-label">{t.time}</label><input className="ch-in" type="time" value={time} disabled={noTime} onChange={(e) => setTime(e.target.value)} style={{ opacity: noTime ? 0.4 : 1 }} /></div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 30, cursor: "pointer", fontFamily: G.body, fontSize: 16, color: G.slate }}>
            <input className="ch-check" type="checkbox" checked={noTime} onChange={(e) => setNoTime(e.target.checked)} /> {t.noTime}
          </label>
          <div style={{ marginBottom: 10 }}>
            <label className="ch-label">{t.place}</label>
            <input className="ch-in" value={place} placeholder={t.placePh} onChange={(e) => { setPlace(e.target.value); setGeoState(""); }} onBlur={(e) => geocode(e.target.value)} />
          </div>
          <div style={{ minHeight: 16, marginBottom: 42, fontFamily: G.mono, fontSize: 9.5, letterSpacing: ".22em", textTransform: "uppercase" }}>
            {geoState === "loading" && <span style={{ color: G.slate }}>{t.locating}</span>}
            {geoState === "ok" && <span style={{ color: G.gold }}>✦ {t.located}</span>}
          </div>

          {err && <p className="ch-line" style={{ fontSize: 16, marginBottom: 22, color: G.gold }}>{err}</p>}
          <button className="ch-btn" onClick={doCast} disabled={busy}>{busy ? t.casting : t.cast} <span>→</span></button>
        </div>
      )}

      {cast && (
        <div className="ch-cast">
          <div className="ch-wheel-wrap">
            <ChartWheel input={cast.plate.input} cast={revealed} />
            <div className={`ch-fade${revealed ? " in" : ""}`} style={{ textAlign: "center", marginTop: 16, fontFamily: G.mono, fontSize: 10.5, letterSpacing: ".18em", textTransform: "uppercase", color: G.slate }}>
              {cast.plate.birthLabel}
              {cast.plate.hourUnknown && <div style={{ marginTop: 8, fontStyle: "italic", textTransform: "none", letterSpacing: ".4px", fontFamily: G.body, color: G.slate }}>{t.hourUnknown}</div>}
            </div>
          </div>

          <div className={`ch-fade${revealed ? " in" : ""}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 26 }}>
              <p className="ch-eyebrow">{t.eyebrow}</p>
              <button className="ch-link" style={{ background: "none", border: 0, cursor: "pointer" }} onClick={again}>{t.again}</button>
            </div>

            <p className="ch-label" style={{ color: G.goldDeep }}>{t.placements}</p>
            {cast.rows.map((r) => (
              <div className="ch-led-row" key={r.name}>
                <span className="ch-led-name">{r.name}</span>
                <span className="ch-led-val">{dms(r.lon)} {r.sign}{r.house && <span className="ho">{r.house}</span>}</span>
              </div>
            ))}

            {(cast.asc || cast.mc) && (
              <>
                <p className="ch-label" style={{ color: G.goldDeep, marginTop: 28 }}>{t.angles}</p>
                {cast.asc && <div className="ch-led-row"><span className="ch-led-name">Ascendant</span><span className="ch-led-val">{dms(cast.asc.lon)} {cast.asc.sign}</span></div>}
                {cast.mc && <div className="ch-led-row"><span className="ch-led-name">Midheaven</span><span className="ch-led-val">{dms(cast.mc.lon)} {cast.mc.sign}</span></div>}
              </>
            )}

            {cast.plate.aspectLabels.length > 0 && (
              <>
                <p className="ch-label" style={{ color: G.goldDeep, marginTop: 28 }}>{t.aspects}</p>
                {cast.plate.aspectLabels.map((a, i) => <div className="ch-asp" key={i}>{a}</div>)}
              </>
            )}

            <div style={{ marginTop: 40, display: "flex", gap: 20, alignItems: "center" }}>
              <Link className="ch-btn" href="/reading" style={{ padding: "13px 26px" }}>{t.read}</Link>
              <Link className="ch-link" href="/">{t.home}</Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
