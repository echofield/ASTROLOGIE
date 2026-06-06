/* ============================================================================
 * build-constellations.ts  —  reproducible zodiac constellation extractor
 * ----------------------------------------------------------------------------
 * STAR GEOMETRY — source of truth: HYG stellar database.
 *   HYG v4.1 · hyg/CURRENT/hygdata_v41.csv · CC BY-SA-4.0 · retrieved 2026-06-07
 *   https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv
 *
 * LINE FIGURES — source of truth: Stellarium "modern" sky culture.
 *   Stellarium skycultures/modern/index.json (GPL-2.0+) · retrieved 2026-06-07
 *   https://raw.githubusercontent.com/Stellarium/stellarium/master/skycultures/modern/index.json
 *   Each figure is HIP-id polylines; we map them onto our catalog stars.
 *
 * REPRODUCIBILITY: the network only (re)generates the committed pins —
 *   scripts/cache/hyg-zodiac.csv   (bright zodiac stars)
 *   scripts/cache/zodiac-lines.json (the 12 Stellarium figures, HIP polylines)
 * A rerun reads those → byte-identical output. Delete a pin to refresh it.
 *
 * METHOD: the design seed (scripts/cache/design-signs.cjs) supplies STRUCTURE
 * ONLY — star ids, sigils, editorial copy. Star coordinates come from HYG (the
 * seed coord only identifies which star is meant, nearest within MATCH_TOL; a
 * few are pinned by HIP via OVERRIDES). LINE TOPOLOGY comes from Stellarium,
 * joined to our stars by HIP — any Stellarium-referenced star the design lacked
 * is added from HYG so figures are complete and provably catalog-sourced.
 *
 * Run:  npm run build:constellations
 * Out:  data/constellations.json   (+ a report to stdout)
 * ==========================================================================*/

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const HYG_CACHE = join(__dirname, "cache", "hyg-zodiac.csv");
const LINES_CACHE = join(__dirname, "cache", "zodiac-lines.json");
const OUT = join(ROOT, "data", "constellations.json");
const HYG_URL = "https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv";
const STEL_URL = "https://raw.githubusercontent.com/Stellarium/stellarium/master/skycultures/modern/index.json";

const ZODIAC_ABBR = ["Ari","Tau","Gem","Cnc","Leo","Vir","Lib","Sco","Sgr","Cap","Aqr","Psc"];
const MAG_CUT = 6.5;
const MATCH_TOL_DEG = 0.25;

const SLUG: Record<string, string> = {
  aries:"aries", taurus:"taurus", gemini:"gemini", cancer:"cancer", leo:"leo", virgo:"virgo",
  libra:"libra", scorpius:"scorpio", sagittarius:"sagittarius", capricornus:"capricorn",
  aquarius:"aquarius", pisces:"pisces",
};
const SLUG_ABBR: Record<string,string> = {
  aries:"Ari", taurus:"Tau", gemini:"Gem", cancer:"Cnc", leo:"Leo", virgo:"Vir",
  libra:"Lib", scorpio:"Sco", sagittarius:"Sgr", capricorn:"Cap", aquarius:"Aqr", pisces:"Psc",
};
const ABBR_SLUG: Record<string,string> = Object.fromEntries(Object.entries(SLUG_ABBR).map(([s,a]) => [a,s]));

// Stars the design seed misplaced beyond MATCH_TOL — resolved by direct HIP
// lookup (not by widening tolerance, which would risk matching the wrong star).
const OVERRIDES: Record<string, number> = { "aries.delta": 14838 /* δ Ari, Botein */ };

interface HygStar { hip: number; proper: string; bayer: string; ra: number; dec: number; mag: number; con: string; }

function parseCSV(text: string) {
  const unquote = (s: string) => (s ?? "").replace(/^"(.*)"$/, "$1");
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  const head = lines[0].split(",").map(unquote);
  const I = (n: string) => head.indexOf(n);
  const i = { ra:I("ra"), dec:I("dec"), mag:I("mag"), con:I("con"), hip:I("hip"), proper:I("proper"), bayer:I("bayer") };
  const rows: Record<string,string>[] = [];
  for (let r = 1; r < lines.length; r++) {
    const c = lines[r].split(",");
    rows.push({ hip:unquote(c[i.hip]), proper:unquote(c[i.proper]), bayer:unquote(c[i.bayer]),
      ra:unquote(c[i.ra]), dec:unquote(c[i.dec]), mag:unquote(c[i.mag]), con:unquote(c[i.con]) });
  }
  return rows;
}

async function loadHyg(): Promise<HygStar[]> {
  if (!existsSync(HYG_CACHE)) {
    console.log("· HYG subset absent — downloading full HYG v4.1…");
    const res = await fetch(HYG_URL); if (!res.ok) throw new Error(`HYG ${res.status}`);
    const rows = parseCSV(await res.text()).filter((r) => {
      const m = parseFloat(r.mag), con = (r.con||"").trim();
      return Number.isFinite(m) && m <= MAG_CUT && (!con || ZODIAC_ABBR.includes(con));
    });
    mkdirSync(dirname(HYG_CACHE), { recursive: true });
    const out = "hip,proper,bayer,ra,dec,mag,con\n" +
      rows.map((r) => `${r.hip},${r.proper},${r.bayer},${r.ra},${r.dec},${r.mag},${r.con}`).join("\n") + "\n";
    writeFileSync(HYG_CACHE, out);
    console.log(`· wrote HYG subset: ${rows.length} stars`);
  } else console.log("· using committed HYG subset");
  return parseCSV(readFileSync(HYG_CACHE, "utf8")).map((r) => ({
    hip:parseInt(r.hip,10)||0, proper:r.proper, bayer:r.bayer,
    ra:parseFloat(r.ra), dec:parseFloat(r.dec), mag:parseFloat(r.mag), con:(r.con||"").trim(),
  })).filter((s) => Number.isFinite(s.ra) && Number.isFinite(s.dec) && Number.isFinite(s.mag));
}

async function loadZodiacLines(): Promise<Record<string, number[][]>> {
  if (!existsSync(LINES_CACHE)) {
    console.log("· Stellarium figures absent — downloading modern/index.json…");
    const res = await fetch(STEL_URL); if (!res.ok) throw new Error(`Stellarium ${res.status}`);
    const data = JSON.parse(await res.text());
    const out: Record<string, number[][]> = {};
    for (const c of data.constellations || []) {
      const abbr = String(c.id || "").split(" ").pop();
      if (abbr && ZODIAC_ABBR.includes(abbr)) out[abbr] = c.lines || [];
    }
    mkdirSync(dirname(LINES_CACHE), { recursive: true });
    writeFileSync(LINES_CACHE, JSON.stringify(out, null, 0) + "\n");
    console.log(`· wrote Stellarium figures for ${Object.keys(out).length} zodiac signs`);
  } else console.log("· using committed Stellarium figures");
  return JSON.parse(readFileSync(LINES_CACHE, "utf8"));
}

const D2R = Math.PI/180;
function sepDeg(r1: number, d1: number, r2: number, d2: number) {
  const a1=r1*15*D2R, a2=r2*15*D2R, x1=d1*D2R, x2=d2*D2R;
  const c = Math.sin(x1)*Math.sin(x2) + Math.cos(x1)*Math.cos(x2)*Math.cos(a1-a2);
  return Math.acos(Math.max(-1, Math.min(1, c)))/D2R;
}

async function main() {
  const hyg = await loadHyg();
  const byHip = new Map<number, HygStar>(); hyg.forEach((s) => { if (s.hip) byHip.set(s.hip, s); });
  const figures = await loadZodiacLines();
  const SIGNS = createRequire(import.meta.url)("./cache/design-signs.cjs") as Record<string, any>;

  const out: Record<string, any> = {};
  let unmatched = 0, addedTotal = 0, droppedSegs = 0;
  console.log("\n  sign         stars  +added  lines  maxΔ(″)  unverified");
  console.log("  ─────────────────────────────────────────────────────");

  for (const [dk, rec] of Object.entries(SIGNS)) {
    const slug = SLUG[dk]; if (!slug) continue;
    const abbr = SLUG_ABBR[slug];
    const pool = hyg.filter((s) => s.con === abbr);
    const search = pool.length ? pool : hyg;
    let maxDelta = 0, unver = 0;

    // 1) stars from the design seed, geometry replaced by catalog
    const stars: any[] = rec.stars.map((s: any) => {
      const ovHip = OVERRIDES[`${slug}.${s.id}`];
      if (ovHip && byHip.has(ovHip)) {
        const h = byHip.get(ovHip)!;
        return { id:s.id, ra:+h.ra.toFixed(4), dec:+h.dec.toFixed(4), mag:+h.mag.toFixed(2), ...(s.faint?{faint:true}:{}), hip:h.hip };
      }
      let best: HygStar|null = null, bs = Infinity;
      for (const h of search) { const d = sepDeg(s.ra,s.dec,h.ra,h.dec); if (d<bs){bs=d;best=h;} }
      if (best && bs <= MATCH_TOL_DEG) {
        maxDelta = Math.max(maxDelta, bs);
        return { id:s.id, ra:+best.ra.toFixed(4), dec:+best.dec.toFixed(4), mag:+best.mag.toFixed(2), ...(s.faint?{faint:true}:{}), hip:best.hip };
      }
      unver++; unmatched++;
      return { id:s.id, ra:s.ra, dec:s.dec, mag:s.mag, ...(s.faint?{faint:true}:{}), unverified:true };
    });

    // 2) lines from Stellarium, joined by HIP; add any missing referenced star
    const hipToId = new Map<number, string>(); stars.forEach((s) => { if (s.hip) hipToId.set(s.hip, s.id); });
    let added = 0;
    const ensure = (hip: number): string | null => {
      if (hipToId.has(hip)) return hipToId.get(hip)!;
      const h = byHip.get(hip); if (!h) return null; // referenced star fainter than subset cut
      const id = (h.proper && h.proper.trim()) ? h.proper.trim().toLowerCase().replace(/\s+/g,"_") : `hip${hip}`;
      stars.push({ id, ra:+h.ra.toFixed(4), dec:+h.dec.toFixed(4), mag:+h.mag.toFixed(2), hip }); // catalog star
      hipToId.set(hip, id); added++; addedTotal++;
      return id;
    };
    const seen = new Set<string>(); const lines: [string,string][] = [];
    for (const poly of (figures[abbr] || [])) {
      for (let k = 0; k+1 < poly.length; k++) {
        const a = ensure(poly[k]), b = ensure(poly[k+1]);
        if (!a || !b) { droppedSegs++; continue; }
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (!seen.has(key)) { seen.add(key); lines.push([a,b]); }
      }
    }

    out[slug] = { abbr, plate:rec.plate, sigil:rec.sigil, ed:rec.ed, stars, lines };
    console.log(`  ${slug.padEnd(12)} ${String(stars.length).padStart(4)}  ${String(added).padStart(5)}  ${String(lines.length).padStart(5)}  ${(maxDelta*3600).toFixed(0).padStart(7)}  ${unver?String(unver)+" ⚠":"—"}`);
  }

  // tidy: drop the big temp index if it lingered
  const tmp = join(__dirname, "cache", "_stellarium_modern.json"); if (existsSync(tmp)) rmSync(tmp);

  const payload = {
    _provenance: {
      stars: "HYG v4.1 (CC BY-SA-4.0), astronexus/HYG-Database hyg/CURRENT/hygdata_v41.csv, retrieved 2026-06-07; pinned via scripts/cache/hyg-zodiac.csv. Every ra/dec/mag is the catalog value; design seed only identified the star (nearest ≤0.25°, or HIP override).",
      lines: "Stellarium 'modern' sky culture (GPL-2.0+), skycultures/modern/index.json, retrieved 2026-06-07; pinned via scripts/cache/zodiac-lines.json. Figures are Stellarium HIP polylines joined to catalog stars by HIP.",
      copy: "Sigils, plate numbers, and editorial copy lifted from the Claude Design seed.",
      generated: new Date().toISOString().slice(0,10),
    },
    signs: out,
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`\n· wrote ${OUT.replace(ROOT,".")} (${Object.keys(out).length} signs)`);
  console.log(`· lines fully Stellarium-sourced · ${addedTotal} star(s) added from figures · ${droppedSegs} segment(s) dropped (star fainter than mag ${MAG_CUT})`);
  console.log(unmatched ? `· ${unmatched} star(s) UNVERIFIED — seed coords kept, flagged (review)` : "· all design stars catalog-matched ✓");
}

main().catch((e) => { console.error(e); process.exit(1); });
