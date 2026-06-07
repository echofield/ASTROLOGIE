// Voice-quality regression test. Fires 10 canonical charts through the pipeline in
// JUDGE-ONCE mode (raw L1 → L2/L3 lint → judge once, NO regen — ~1 gen + 1 judge
// per read), and reports how often the generator's first output clears the bible's
// §6 bar, grouped by violation type. Cheap enough to run on every prompt change.
//
//   prerequisites: dev server on :3030 with READ_OPEN=true and ANTHROPIC_API_KEY set.
//   run:           node scripts/voice-regression.mjs
//
import { writeFileSync, appendFileSync } from "node:fs";

const API = `http://localhost:${process.env.PORT || 3030}/api/read`;
const OUT = new URL("../.voice-regression.txt", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
writeFileSync(OUT, "VOICE REGRESSION — 10 canonical charts, judge-once (raw L1 quality)\n\n");
const log = (s) => { console.log(s); appendFileSync(OUT, s + "\n"); };

const GLYPHS = ["✶","✷","✦","❋","✸","✹","❂","✺","✱","⁂"];
const RULERS = [["☉","Sun","What only you can author."],["☽","Moon","What you carry, made visible."],["☿","Mercury","The word that must move."],["♀","Venus","What you love, made durable."],["♂","Mars","The move that takes nerve."],["♃","Jupiter","The leap toward more."],["♄","Saturn","The long vow you keep."]];
const HOUSES = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function makeStar(must,name){const h=hash(must.trim().toLowerCase()+"·"+name.trim().toLowerCase());const r=RULERS[h%7];return{must:must.trim(),name:name.trim(),lon:(h>>>2)%360,glyph:GLYPHS[(h>>>5)%GLYPHS.length],rulerGlyph:r[0],ruler:r[1],resonance:r[2],house:HOUSES[(h>>>9)%12],sealedAt:"2026-06-07T00:00:00Z"};}
const P = (birthISO, place, lat, lon) => ({ birthISO, place, lat, lon, natal:{}, createdAt:"2026-06-07T00:00:00Z" });

// The canonical fixtures — varied charts, life domains, and star intentions
// (commercial and not), chosen to surface the known failure modes.
const CASES = [
  { p:P("1991-04-12T16:40","Lyon, France",45.76,4.84), i:{season:"Circling the same decision for two years — leaving a stable job to start the studio I sketch at night.",repeating:"I gather more information and rebuild the spreadsheet.",afraid:"That the safety was the only thing I was ever good at."}, s:makeStar("Hand in my notice and commit to the studio full-time before the year ends.","THE NOTICE") },
  { p:P("1986-09-23T07:15","Bordeaux, France",44.84,-0.58), i:{season:"Two years into the first relationship that did not end on schedule.",repeating:"Around the third month I find the flaw and keep a small distance.",afraid:"That being fully chosen is more exposing than being left."}, s:makeStar("Stop auditioning for the exit and move in with her in the spring.","ONE KEY") },
  { p:P("1989-11-07T00:20","Clamart, France",48.80,2.26), i:{season:"I have built the thing and it is good enough to charge for.",repeating:"I finish the product then I rebuild it.",afraid:"That if I charge and no one pays, the problem was me asking."}, s:makeStar("Flip the switch, point payment live, and take the first 59 euro this month.","THE FLIP") },
  { p:P("1994-02-18T09:30","Paris, France",48.85,2.35), i:{season:"Freelancing a year, undercharging, afraid to name a real rate.",repeating:"I quote low then resent the work.",afraid:"That if I ask for more they will say no and I will have nothing."}, s:makeStar("Raise my day rate and send the new number to the next client who asks.","THE RATE") },
  { p:P("1982-06-05T22:10","Marseille, France",43.30,5.37), i:{season:"Out of shape, starting things on Mondays and quitting by Thursday.",repeating:"I make a perfect plan then abandon it at the first miss.",afraid:"That I am someone who cannot keep a promise to himself."}, s:makeStar("Walk every morning before work for a month, missed days included.","THE MORNING") },
  { p:P("1990-12-01T03:45","Nantes, France",47.22,-1.55), i:{season:"A year after the loss; still talking to them in my head.",repeating:"I reach for the phone to call and remember.",afraid:"That letting the grief soften means letting them go."}, s:makeStar("Write the letter I never sent and keep it.","THE LETTER") },
  { p:P("1988-08-21T14:00","Toulouse, France",43.60,1.44), i:{season:"Three chapters in, the novel has stalled for eight months.",repeating:"I reread and polish the opening instead of writing forward.",afraid:"That the book is the only proof I am a writer and it might be bad."}, s:makeStar("Write the messy middle to the end before touching the opening again.","THE MIDDLE") },
  { p:P("1979-03-30T11:20","Lille, France",50.63,3.06), i:{season:"My father and I have not spoken properly in three years.",repeating:"We talk about logistics and avoid the real thing.",afraid:"That if I open it he will go cold and I will lose what little is left."}, s:makeStar("Say the unsaid thing to my father before his birthday.","THE CONVERSATION") },
  { p:P("1996-07-14T18:50","Nice, France",43.70,7.27), i:{season:"Burned out, saying yes to everyone, no time that is mine.",repeating:"I agree before I think and pay for it later.",afraid:"That if I say no I will be seen as difficult and dropped."}, s:makeStar("Say no to the next request that is not mine to carry.","THE NO") },
  { p:P("1985-10-09T06:05","Strasbourg, France",48.57,7.75), i:{season:"Changed careers and still introduce myself by the old one.",repeating:"I downplay the new work as a phase.",afraid:"That claiming it out loud makes the failure, if it comes, mine."}, s:makeStar("Introduce myself by the new work to the next person who asks.","THE NAME") },
];

const TESTS = ["OBSERVABLE","NO_COMFORT_CLOSE","NO_PREDICTION","WARM_THEN_COOL","PIVOT_BUDGET"];
const byTest = Object.fromEntries(TESTS.map((t) => [t, []]));
let passes = 0, fails = 0, errors = 0;
const perRead = [];

for (let n = 0; n < CASES.length; n++) {
  const c = CASES[n];
  const t0 = Date.now();
  try {
    const res = await fetch(API, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ profile:c.p, intake:c.i, star:c.s, span:"moment", judgeOnce:true }) });
    const data = await res.json().catch(() => ({}));
    const secs = ((Date.now()-t0)/1000).toFixed(0);
    const v = data._judge;
    if (!res.ok || data.error) { errors++; perRead.push(`#${n+1} ${c.s.name.padEnd(16)} ERR ${res.status} ${data.error||""} (${secs}s)`); continue; }
    if (v && v.pass) { passes++; perRead.push(`#${n+1} ${c.s.name.padEnd(16)} PASS (${secs}s)`); }
    else if (v) {
      fails++;
      const flat = [];
      for (const sec of v.sections.filter((s) => !s.pass)) for (const f of (sec.failures||[])) { const rec = { section: sec.section, test: f.test, quote: f.quote, why: f.why }; flat.push(rec); (byTest[f.test]||(byTest[f.test]=[])).push(rec); }
      perRead.push(`#${n+1} ${c.s.name.padEnd(16)} FAIL (${secs}s) → ${flat.map((x)=>`${x.section}:${x.test}`).join(", ")}`);
    } else { errors++; perRead.push(`#${n+1} ${c.s.name.padEnd(16)} SKIP/no-judge (${secs}s)`); }
  } catch (e) { errors++; perRead.push(`#${n+1} ${c.s.name} EXC ${e.message}`); }
}

log("PER-READ:"); perRead.forEach(log);
log(`\nTOTALS: ${CASES.length} reads · ${passes} pass · ${fails} fail · ${errors} err`);
log(`RAW L1 PASS RATE: ${passes}/${passes+fails} judged (${errors} excluded)\n`);
log("FAILURES BY VIOLATION TYPE:");
for (const t of TESTS) {
  const items = byTest[t];
  log(`  ${t}: ${items.length}`);
  items.slice(0, 6).forEach((x) => log(`    [${x.section}] "${(x.quote||"").slice(0,110)}"`));
}
log("\nDONE_MARKER");
