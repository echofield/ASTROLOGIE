// Composed-string regression — the concatenation class.
// Verifies every Atlas cap row splits into real segments (so the renderer's
// explicit "·" joins apply uniformly) and snapshots the plain-text result.
// Run: node scripts/compose-check.mjs   (exit 1 on any drift)
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const table = JSON.parse(readFileSync("data/constellations.json", "utf8"));
const SNAP = "scripts/compose-snapshot.json";

// mirrors lib/atlas/compose.ts capText(): segments joined explicitly, tags stripped
const segments = (html) => {
  const m = html.match(/<span>([\s\S]*?)<\/span>/g);
  return (m ? m.map((s) => s.replace(/^<span>|<\/span>$/g, "").trim()) : [html.trim()]).filter(Boolean);
};
const text = (html) => segments(html).map((s) => s.replace(/<[^>]+>/g, "")).join(" · ");

let fail = 0;
let greek = 0;
const out = {};
for (const [key, sign] of Object.entries(table.signs)) {
  const segs = segments(sign.ed.cap);
  if (segs.length !== 4) { console.error(`✗ ${key}: cap has ${segs.length} segments (want 4)`); fail++; }
  if (/[α-ω]/.test(sign.ed.cap)) greek++;
  const t = text(sign.ed.cap);
  // run-on signature: a letter glued to a digit, or lowercase glued to uppercase mid-word
  if (/[a-zA-Z][0-9]|[a-z][A-Z]/.test(t.replace(/[α-ω]/g, " "))) {
    console.error(`✗ ${key}: suspicious run-on in "${t}"`); fail++;
  }
  out[key] = t;
}
// mass-encoding-loss guard: nearly every cap carries a Greek Bayer letter (Cancer is the exception)
if (greek < 10) { console.error(`✗ only ${greek}/12 caps carry a Greek letter — encoding loss?`); fail++; }

if (fail === 0) {
  if (!existsSync(SNAP)) {
    writeFileSync(SNAP, JSON.stringify(out, null, 2) + "\n");
    console.log(`snapshot written (${Object.keys(out).length} caps) → ${SNAP}`);
  } else {
    const prev = JSON.parse(readFileSync(SNAP, "utf8"));
    for (const k of Object.keys(out)) {
      if (prev[k] !== out[k]) { console.error(`✗ ${k} drifted:\n  was: ${prev[k]}\n  now: ${out[k]}`); fail++; }
    }
  }
}

console.log(fail === 0 ? "✓ composed strings clean (12 caps, 4 segments each, Bayer letters intact)" : `${fail} defect(s)`);
process.exit(fail === 0 ? 0 : 1);
