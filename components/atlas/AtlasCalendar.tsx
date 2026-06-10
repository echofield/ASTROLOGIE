"use client";

import Link from "next/link";
import { useMemo, type ReactNode, type CSSProperties } from "react";
import { displaySky, type LonMap } from "@/lib/chart";
import { useSkyNow } from "@/lib/atlas/use-sky-now";
import MoonGlyph from "./MoonGlyph";

// The Calendar — the rhythm of the sky, ported from the export's #calendar.
// Every date is real, drawn from our own ephemeris (displaySky): the moon phase
// from the Sun–Moon elongation, the coming full moons and the year's seasons by
// day-scan, the solar return when a birth sky exists. Eclipses (which need node
// math) are the one thing the export's EPHEMERIS had that we leave for later.

const DAY = 86400000;
const MON = { en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] };
const MONS = { en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], fr: ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "aoû", "sep", "oct", "nov", "déc"] };
const fmtFull = (d: Date, l: "en" | "fr") => `${d.getDate()} ${MON[l][d.getMonth()]}`;
const fmtShort = (d: Date, l: "en" | "fr") => `${d.getDate()} ${MONS[l][d.getMonth()]}`;
const norm = (x: number) => ((x % 360) + 360) % 360;

// line-work emblems: gold as a line; the unlit sky is shadow, never added light
// (MoonGlyph — the true-phase disc — lives in ./MoonGlyph, shared with the landing medallion)
function Wrap({ R, children }: { R: number; children: ReactNode }) {
  return <svg className="cal-emblem-svg" viewBox={`0 0 ${2 * R} ${2 * R}`} aria-hidden="true">{children}</svg>;
}
function DialGlyph({ R }: { R: number }) {
  const c = R;
  return <Wrap R={R}><circle className="cal-line" cx={c} cy={c} r={+(R - 1.4).toFixed(1)} /><ellipse className="cal-line" cx={c} cy={c} rx={+(R * 0.92).toFixed(1)} ry={+(R * 0.36).toFixed(1)} transform={`rotate(-20 ${c} ${c})`} /><circle className="cal-dot" cx={c} cy={c} r="1.9" /></Wrap>;
}
function ReturnGlyph({ R }: { R: number }) {
  const c = R;
  const rays = Array.from({ length: 12 }, (_, i) => { const a = (i * 30 * Math.PI) / 180, r1 = R * 0.68, r2 = R * 0.93; return <line key={i} className="cal-line" x1={+(c + Math.cos(a) * r1).toFixed(1)} y1={+(c + Math.sin(a) * r1).toFixed(1)} x2={+(c + Math.cos(a) * r2).toFixed(1)} y2={+(c + Math.sin(a) * r2).toFixed(1)} />; });
  return <Wrap R={R}><circle className="cal-line" cx={c} cy={c} r={+(R * 0.5).toFixed(1)} />{rays}<circle className="cal-dot" cx={c} cy={c} r="1.9" /></Wrap>;
}
function SeasonGlyph({ name, R }: { name: string; R: number }) {
  const c = R, eq = /Equinox|Équinoxe/.test(name);
  const oy = eq ? c : /June|Juin/.test(name) ? c - R * 0.42 : c + R * 0.42;
  return <Wrap R={R}><line className="cal-line faint" x1={+(R * 0.12).toFixed(1)} y1={c} x2={+(2 * R - R * 0.12).toFixed(1)} y2={c} /><circle className="cal-line" cx={c} cy={+oy.toFixed(1)} r={+(R * 0.32).toFixed(1)} /></Wrap>;
}
function PairGlyph({ R }: { R: number }) {
  const c = R;
  return <Wrap R={R}><circle className="cal-line faint" cx={+(c - R * 0.26).toFixed(1)} cy={c} r={+(R * 0.48).toFixed(1)} /><circle className="cal-line faint" cx={+(c + R * 0.26).toFixed(1)} cy={c} r={+(R * 0.48).toFixed(1)} /></Wrap>;
}

// phase from the live elongation
const PHASE_NAME = {
  en: ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"],
  fr: ["Nouvelle lune", "Premier croissant", "Premier quartier", "Lune gibbeuse croissante", "Pleine lune", "Lune gibbeuse décroissante", "Dernier quartier", "Dernier croissant"],
};
function phaseOf(lon: LonMap) {
  const elong = norm((lon.moon ?? 0) - (lon.sun ?? 0));
  const illum = (1 - Math.cos((elong * Math.PI) / 180)) / 2;
  const waxing = elong < 180;
  const idx = elong < 11.25 || elong >= 348.75 ? 0 : elong < 78.75 ? 1 : elong < 101.25 ? 2 : elong < 168.75 ? 3 : elong < 191.25 ? 4 : elong < 258.75 ? 5 : elong < 281.25 ? 6 : 7;
  return { elong, illum, waxing, idx };
}

// scanners: real crossings, by daily sample + linear refine
function crossUp(prev: number, cur: number, target: number) {
  const dp = norm(prev - target), dc = norm(cur - target);
  if (dp > 180 && dc <= 180 && norm(cur - prev) < 60) return (360 - dp) / (360 - dp + dc);
  return -1;
}
type Found = { date: Date };
function scanCrossings(target: number, from: Date, days: number, read: (d: Date) => number, all: boolean): Found[] {
  const out: Found[] = [];
  let prev = read(from);
  for (let i = 1; i <= days; i++) {
    const d = new Date(from.getTime() + i * DAY);
    const cur = read(d);
    const f = crossUp(prev, cur, target);
    if (f >= 0) { out.push({ date: new Date(from.getTime() + (i - 1 + f) * DAY) }); if (!all) break; }
    prev = cur;
  }
  return out;
}

interface Entry { date: Date; kind: string; live?: boolean; personal?: boolean; now?: boolean; offer?: boolean; name: string; note: string; state: string; glyph: ReactNode; depth?: number; gapPx?: number }

function build(birthISO: string | null | undefined, l: "en" | "fr") {
  const now = new Date();
  const sky = (d: Date) => displaySky(d);
  const ph = phaseOf(sky(now));
  const phaseName = PHASE_NAME[l][ph.idx];

  const moonLon = (d: Date) => { const s = sky(d); return norm((s.moon ?? 0) - (s.sun ?? 0)); };
  const sunLon = (d: Date) => sky(d).sun ?? 0;

  const fullMoons = scanCrossings(180, now, 372, moonLon, true);
  const SEASONS = l === "fr"
    ? [{ t: 0, name: "Équinoxe de mars", note: "Le jour et la nuit en équilibre ; l'année bascule vers la lumière." }, { t: 90, name: "Solstice de juin", note: "Le plus long jour — le sommet de la lumière de l'année." }, { t: 180, name: "Équinoxe de septembre", note: "L'équilibre revient ; l'année se tourne vers la nuit." }, { t: 270, name: "Solstice de décembre", note: "La plus longue nuit — le sol de l'année, et son retour." }]
    : [{ t: 0, name: "The March Equinox", note: "Day and night in balance; the year tips toward the light." }, { t: 90, name: "The June Solstice", note: "The longest day — the high crest of the year's light." }, { t: 180, name: "The September Equinox", note: "Balance returns; the year turns toward the dark." }, { t: 270, name: "The December Solstice", note: "The longest night — the floor of the year, and its turning back." }];
  const MOON_NAMES = l === "fr"
    ? [["La Lune du Loup", "Lumière froide sur le cœur de l'hiver."], ["La Lune des Neiges", "Les neiges les plus lourdes sous son éclat."], ["La Lune des Vers", "Le sol s'amollit, et le premier dégel s'éveille."], ["La Lune Rose", "Les premières floraisons répondent au printemps."], ["La Lune des Fleurs", "Toute la terre en fleur sous elle."], ["La Lune des Fraises", "Nuits courtes, et les premiers fruits."], ["La Lune du Cerf", "Bois en velours, le plein été à son comble."], ["La Lune de l'Esturgeon", "Lourde et basse sur l'eau de fin d'été."], ["La Lune des Moissons", "La lumière des récoltes qui s'attarde après le crépuscule."], ["La Lune du Chasseur", "La lampe froide et claire de l'année qui tourne."], ["La Lune du Castor", "La dernière pleine lumière avant le gel."], ["La Lune Froide", "La lune des longues nuits, au plus bas de l'année."]]
    : [["The Wolf Moon", "Cold light over the deepest of the winter."], ["The Snow Moon", "The year's heaviest snows under its glare."], ["The Worm Moon", "The ground softens, and the first thaw stirs."], ["The Pink Moon", "The earliest wild blooms answer the spring."], ["The Flower Moon", "The whole earth in bloom beneath it."], ["The Strawberry Moon", "Short nights, and the first ripening."], ["The Buck Moon", "Antlers in velvet, high summer at the full."], ["The Sturgeon Moon", "Heavy and low on the late-summer water."], ["The Harvest Moon", "The reaping light that lingers after dusk."], ["The Hunter's Moon", "The bright cold lamp of the turning year."], ["The Beaver Moon", "The last full light before the freeze."], ["The Cold Moon", "The long night's moon, at the year's floor."]];

  const entries: Entry[] = [];
  fullMoons.forEach((fm) => { const nm = MOON_NAMES[fm.date.getMonth()]; entries.push({ date: fm.date, kind: "fullmoon", live: true, name: nm[0], note: nm[1], state: l === "fr" ? "pleine lune" : "full moon", glyph: <MoonGlyph illum={1} waxing R={16} /> }); });
  SEASONS.forEach((se) => { const hit = scanCrossings(se.t, now, 372, sunLon, false)[0]; if (hit) entries.push({ date: hit.date, kind: "season", name: se.name, note: se.note, state: /Equinox|Équinoxe/.test(se.name) ? (l === "fr" ? "équinoxe" : "equinox") : "solstice", glyph: <SeasonGlyph name={se.name} R={16} /> }); });

  let ret: Date | null = null;
  if (birthISO) {
    const natalSun = sky(new Date(birthISO)).sun ?? 0;
    ret = scanCrossings(natalSun, now, 372, sunLon, false)[0]?.date ?? null;
    if (ret) entries.push({ date: ret, kind: "return", live: true, personal: true, offer: true, name: l === "fr" ? "Votre retour solaire" : "Your Solar Return", note: l === "fr" ? "Le Soleil revient à l'endroit exact où il se tenait à votre naissance." : "The Sun home to the exact place it stood when you began.", state: l === "fr" ? "votre retour" : "your return", glyph: <ReturnGlyph R={16} /> });
  }
  entries.push({ date: new Date(now.getTime() + 320 * DAY), kind: "pair", name: l === "fr" ? "La Rencontre de Deux Ciels" : "The Meeting of Two Skies", note: l === "fr" ? "Deux thèmes superposés — un tout autre ciel. Il vient, en son temps." : "Two charts laid over each other — a different sky entirely. It comes, in time.", state: l === "fr" ? "un ciel à venir" : "a coming sky", glyph: <PairGlyph R={16} /> });

  let firstFull: Entry | null = null;
  entries.forEach((e) => { if (e.kind === "fullmoon" && (!firstFull || e.date < (firstFull as Entry).date)) firstFull = e; });
  if (firstFull) (firstFull as Entry).offer = true;
  entries.sort((a, b) => +a.date - +b.date);

  const PHASE_LINES = l === "fr"
    ? ["La lune est sombre — une page nette au-dessus, le mois pas encore écrit.", "Une fine lame de lune revient au crépuscule ; quelque chose commence.", "La lune se tient à demi éclairée, là où l'intention rencontre l'effort.", "La lune enfle vers le plein ; le ciel rassemble sa lumière.", "La lune est pleine et tout le ciel est éveillé — rien n'est caché ce soir.", "La lune commence à rendre sa lumière ; la marée du mois tourne.", "À demi éclairée et décroissante — le ciel demande ce qui mérite d'être porté.", "La dernière pelure de lune avant le noir ; le mois expire."]
    : ["The moon is dark — a clean slate overhead, the month not yet written.", "A thin blade of moon returns to the dusk; something is beginning.", "The moon stands half-lit at the turn, where intention meets effort.", "The moon swells toward full; the sky is gathering its light.", "The moon is full and the whole sky is awake — nothing is hidden tonight.", "The moon begins to give its light back; the tide of the month turns.", "Half-lit and waning — the sky asks what is worth carrying forward.", "The last paring of moon before the dark; the month exhales."];
  entries.unshift({ date: new Date(now), kind: "now", now: true, name: l === "fr" ? "Ce soir" : "Tonight", note: PHASE_LINES[ph.idx], state: `${phaseName} · ${Math.round(ph.illum * 100)}%`, glyph: <MoonGlyph illum={ph.illum} waxing={ph.waxing} R={16} /> });

  const maxD = 372;
  let prev: Date | null = null;
  entries.forEach((e) => {
    const dd = Math.max(0, (+e.date - +now) / DAY);
    e.depth = Math.max(0.12, 1 - Math.min(1, dd / maxD));
    const gap = prev ? Math.max(0, (+e.date - +prev) / DAY) : 0;
    e.gapPx = prev ? Math.round(13 + 1.8 * Math.min(gap, 60)) : 0;
    prev = e.date;
  });

  return { now, ph, phaseName, entries, retDate: ret, fm0: fullMoons[0]?.date ?? null };
}

export default function AtlasCalendar({ lang, birthISO }: { lang: "en" | "fr"; birthISO?: string | null }) {
  // dayKey flips at local midnight → Tonight and the year rebuild without a reload
  const { dayKey } = useSkyNow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const c = useMemo(() => build(birthISO ?? null, lang), [birthISO, lang, dayKey]);
  const t = lang === "fr"
    ? { kicker: "Le rythme du ciel", title: "Le Calendrier", tonight: "Le ciel ce soir", yk: "L'année à venir", ysub: "ce que le ciel apporte", skyKind: "Le ciel ce soir", skyLine: "Les cieux tels qu'ils se tiennent en ce moment, au-dessus de vous — la note fondamentale sur laquelle toute l'année s'accorde.", skyWhen: "Ce soir", fmKind: "La pleine lune à venir", fmLine: "La haute marée de lumière du mois — quand le ciel est le plus plein, et le plus digne d'être marqué.", retKind: "Votre retour solaire", retLine: "Le seul jour où le Soleil revient là où il se tenait à votre naissance — votre année, qui recommence.", retUnsetLine: "La seule date qui n'est qu'à vous. Le ciel a besoin de votre naissance pour la trouver.", retUnset: "Votre retour", setLink: "Entrez votre ciel de naissance", drawn: "Faire tirer une Lecture pour ce moment", approach: (d: number) => (d <= 0 ? "ce soir" : d === 1 ? "demain soir" : d <= 45 ? `dans ${d} nuits` : "") }
    : { kicker: "The rhythm of the sky", title: "The Calendar", tonight: "The sky tonight", yk: "The year ahead", ysub: "what the sky is bringing", skyKind: "The Sky Tonight", skyLine: "The heavens as they stand right now, over you — the ground note the whole year is tuned against.", skyWhen: "Tonight", fmKind: "The Coming Full Moon", fmLine: "The month's high tide of light — when the sky is fullest, and most worth marking.", retKind: "Your Solar Return", retLine: "The one day the Sun comes home to where it stood at your birth — your year, beginning again.", retUnsetLine: "The one date that is only yours. The sky needs your birth to find it.", retUnset: "Your return", setLink: "Enter your birth sky", drawn: "Have a Reading drawn for this moment", approach: (d: number) => (d <= 0 ? "tonight" : d === 1 ? "tomorrow night" : d <= 45 ? `in ${d} nights` : "") };
  const fmDays = c.fm0 ? Math.max(0, Math.round((+c.fm0 - +c.now) / DAY)) : null;
  const retDays = c.retDate ? Math.max(0, Math.round((+c.retDate - +c.now) / DAY)) : null;

  return (
    <div className="surface cal-surface">
      <div className="cal-head em">
        <div>
          <p className="cal-kicker">{t.kicker}</p>
          <h1 className="cal-title">{t.title}</h1>
        </div>
        <div className="cal-now">
          <MoonGlyph illum={c.ph.illum} waxing={c.ph.waxing} R={17} />
          <span className="cal-now-txt">{t.tonight}<b>{fmtFull(c.now, lang)} · {c.phaseName}</b></span>
        </div>
      </div>

      <div className="cal-live em">
        <div className="cal-moment">
          <DialGlyph R={21} />
          <p className="cal-m-kind">{t.skyKind}</p>
          <p className="cal-m-line">{t.skyLine}</p>
          <div className="cal-m-when"><span className="cal-m-date">{t.skyWhen}</span><span className="cal-m-approach">{c.phaseName}</span></div>
        </div>
        <div className="cal-moment">
          <MoonGlyph illum={1} waxing R={21} />
          <p className="cal-m-kind">{t.fmKind}</p>
          <p className="cal-m-line">{t.fmLine}</p>
          <div className="cal-m-when"><span className="cal-m-date">{c.fm0 ? fmtFull(c.fm0, lang) : "—"}</span>{fmDays != null && <span className="cal-m-approach">{t.approach(fmDays)}</span>}</div>
        </div>
        <div className={`cal-moment personal${c.retDate ? "" : " unset"}`}>
          <ReturnGlyph R={21} />
          <p className="cal-m-kind">{t.retKind}</p>
          <p className="cal-m-line">{c.retDate ? t.retLine : t.retUnsetLine}</p>
          <div className="cal-m-when"><span className="cal-m-date">{c.retDate ? fmtFull(c.retDate, lang) : t.retUnset}</span>{retDays != null && <span className="cal-m-approach">{retDays <= 0 ? t.approach(0) : `${retDays}${lang === "fr" ? " j" : "d"}`}</span>}</div>
          <div className="cal-m-act">
            {c.retDate
              ? <Link className="cal-offer" href="/reading">{t.drawn} <span className="ar">→</span></Link>
              : <Link className="cal-set-link" href="/cabinet?screen=theme">{t.setLink} <span>→</span></Link>}
          </div>
        </div>
      </div>

      <div className="cal-year em">
        <div className="cal-year-head">
          <span className="cal-year-k">{t.yk}</span>
          <span className="cal-year-rule" />
          <span className="cal-year-sub">{t.ysub}</span>
        </div>
        <div className="cal-meridian">
          {c.entries.map((e, i) => (
            <div key={i} className={`cal-entry${e.live ? " live" : ""}${e.personal ? " personal" : ""}${e.now ? " now" : ""}`} style={{ marginTop: e.gapPx ?? 0, "--depth": (e.depth ?? 1).toFixed(2) } as CSSProperties}>
              <span className="cal-e-date">{fmtShort(e.date, lang)}</span>
              <span className="cal-e-node">{e.glyph}</span>
              <span className="cal-e-body">
                <span className="cal-e-name">{e.name}{e.live && <span className="cal-e-arrow">→</span>}</span>
                <span className="cal-e-state">{e.state}</span>
                <span className="cal-e-note">{e.note}</span>
                {e.offer && <Link className="cal-e-offer" href="/reading">{t.drawn} <span className="ar">→</span></Link>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
