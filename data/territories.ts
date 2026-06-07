import type { Territory, ArchiveEntry, Relic } from "@/types/atlas";
import { SIGN_KEY, SIGN_NAME } from "@/lib/chart";

/* ============================================================================
 * THE ASTROLAB ATLAS — TERRITORY CONTENT (single source of truth, content-in-code)
 * ----------------------------------------------------------------------------
 * Pisces is the finished register, ported from Pisces Territory v3.html.
 * The other ELEVEN are DRAFT SCAFFOLDING in that register — placeholders for
 * Mars's voice; NOT final copy. Replace freely; the shape stays.
 * Star geometry + sigils live in data/constellations.json (astronomy only).
 * ==========================================================================*/

// generic decorative glyph/sigil pools for the drafted signs (replaceable)
const GL = [
  "M24 8c-7 4-12 4-15 3v24c3 1 8 1 15 5 7-4 12-4 15-5V11c-3 1-8 1-15-3Z M24 11v29",
  "M9 24a15 15 0 1 0 30 0a15 15 0 1 0 -30 0 M24 5v38 M5 24h38",
  "M24 6l4 13 14 .4-11 8.5 4 13.4L24 46l-11 .3 4-13.4-11-8.5 14-.4Z",
  "M14 42V16a10 10 0 0 1 20 0v26 M9 42h30 M24 24v10",
  "M6 24a11 11 0 1 0 22 0a11 11 0 1 0 -22 0 M20 24a11 11 0 1 0 22 0a11 11 0 1 0 -22 0",
  "M6 18c4-5 8-5 12 0s8 5 12 0 8-5 12 0 M6 30c4-5 8-5 12 0s8 5 12 0 8-5 12 0",
];
const SG = [
  "M16 38a18 18 0 1 0 36 0a18 18 0 1 0 -36 0 M27 38a7 7 0 1 0 14 0a7 7 0 1 0 -14 0",
  "M24 14C10 26 10 42 24 54 M44 14C58 26 58 42 44 54 M16 34h36",
  "M34 8 12 30v8c0 12 10 22 22 22s22-10 22-22v-8Z M18 38h32 M22 48h24",
  "M25 34a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M34 6v8M34 54v8M6 34h8M54 34h8M14 14l6 6M48 48l6 6M54 14l-6 6M20 48l-6 6",
];

interface Core {
  realm: string; nameLead: string; nameEm: string; tagline: string;
  el: Territory["el"]; modality: Territory["modality"]; arch: string;
  virtues: [string, string, string]; line: string; lede: string;
  star: string; sqDeg: number; myth: string;
  relics: [string, string][]; // [name, blurb] ×4
  passage?: { lead: string; paras: string[] };
  archive?: ArchiveEntry[];    // Pisces only (real); else templated
  relicsFull?: Relic[];        // Pisces only (real sigils)
}

const slugify = (n: string) => n.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");

// DRAFT — scaffolding for Mars to replace
const C: Core[] = [
  { realm: "The Forge of First Fire", nameLead: "The Forge of", nameEm: "First Fire", tagline: "Where the year is struck into being.",
    el: "Fire", modality: "Cardinal", arch: "The Initiator", virtues: ["Courage", "Ignition", "Beginning"],
    line: "Where nothing has happened yet, and everything still could.",
    lede: "The first territory, where the wheel catches and turns over — the raw spark before form, before doubt, before the long elaboration of everything that follows.",
    star: "α Hamal · the Ram's Brow", sqDeg: 441, myth: "The ram of the golden fleece, set first in the sky.",
    relics: [["The First Spark", "The igniting moment, before it knows its own name."], ["The Unblunted Blade", "An edge that has never met resistance."], ["The Dawn Stone", "The first light, kept solid."], ["The Struck Hour", "The instant the year is set ringing."]] },
  { realm: "The Garden of Weight", nameLead: "The Garden of", nameEm: "Weight", tagline: "Where nothing is hurried and nothing is lost.",
    el: "Earth", modality: "Fixed", arch: "The Keeper", virtues: ["Patience", "Cultivation", "Embodiment"],
    line: "A place that rewards those who stay.",
    lede: "The second territory, where the spark of the first hardens into ground — the slow, rooted wealth of a thing that simply refuses to be rushed.",
    star: "α Aldebaran · the Eye", sqDeg: 797, myth: "The bull that bore the world across the water.",
    relics: [["The Slow Seed", "What grows only for those who wait."], ["The Golden Furrow", "A single line of tended earth."], ["The Unmoved Stone", "The thing that stays when all else passes."], ["The Kept Season", "An abundance that does not spoil."]] },
  { realm: "The Crossroads of Voices", nameLead: "The Hall of", nameEm: "Two Lights", tagline: "Where every answer arrives already twinned.",
    el: "Air", modality: "Mutable", arch: "The Messenger", virtues: ["Curiosity", "Exchange", "Connection"],
    line: "Every road here leads to another mind.",
    lede: "The third territory, where the single self first discovers it is two — and learns that nothing true can be said only once, or from only one side.",
    star: "α Castor · β Pollux", sqDeg: 514, myth: "The twin brothers, one mortal, one divine, who would not be parted.",
    relics: [["The Twin Letters", "A message and its mirror, sent at once."], ["The Mirror Bridge", "A crossing between two minds."], ["The Messenger's Coin", "Spent in two places at the same hour."], ["The Spoken Map", "Directions that change as you say them."]] },
  { realm: "The Tidal Hearth", nameLead: "The Sheltering", nameEm: "Tide", tagline: "Where the shore keeps what the sea returns.",
    el: "Water", modality: "Cardinal", arch: "The Guardian", virtues: ["Memory", "Shelter", "Devotion"],
    line: "A harbor that remembers everyone it has sheltered.",
    lede: "The fourth territory, where feeling first builds itself a shell — the soft thing that learns to carry its own home, and to guard what it loves behind a patient wall.",
    star: "the Beehive within", sqDeg: 506, myth: "The crab that held its ground against a god, and was set in the stars for it.",
    relics: [["The Moon Shell", "It holds the sound of every tide it has known."], ["The Kept Flame", "A hearth that never asks to be fed."], ["The Returning Tide", "What leaves always comes back here."], ["The Inner Room", "The room behind the room, where nothing is lost."]] },
  { realm: "The Solar Court", nameLead: "The Sovereign", nameEm: "Light", tagline: "Where the fire learns it has a face.",
    el: "Fire", modality: "Fixed", arch: "The Sovereign", virtues: ["Radiance", "Courage", "Generosity"],
    line: "The light here falls on you, and asks what you will do.",
    lede: "The fifth territory, where the warmth of the world gathers into a single bright centre and dares to be seen — the heart that rules by being most fully itself.",
    star: "α Regulus · the Heart", sqDeg: 947, myth: "The lion whose hide turned every blade, slain by a hero's hands.",
    relics: [["The Gold Mane", "Worn by whoever is unafraid to be looked at."], ["The Open Throne", "It seats the one who gives most away."], ["The Heart Sun", "A warmth that rules without command."], ["The Standing Ovation", "Earned once, remembered always."]] },
  { realm: "The Workshop of Order", nameLead: "The Quiet", nameEm: "Harvest", tagline: "Where care is the only perfect language.",
    el: "Earth", modality: "Mutable", arch: "The Craftsman", virtues: ["Precision", "Service", "Refinement"],
    line: "Nothing is wasted here; everything is tended.",
    lede: "The sixth territory, where the abundance of summer is sorted, weighed and made useful — the patient art of improving a thing without ever needing to be thanked.",
    star: "α Spica · the Ear of Grain", sqDeg: 1294, myth: "The maiden of the harvest, holding the last sheaf of the year.",
    relics: [["The Measured Sheaf", "Exactly enough, never more."], ["The Clean Blade", "It cuts only what must be cut."], ["The Ordered Ledger", "Every small thing in its place."], ["The Unthanked Hand", "The work no one sees, done well anyway."]] },
  { realm: "The Hall of Scales", nameLead: "The Weighing", nameEm: "Hall", tagline: "Where every truth must answer to another.",
    el: "Air", modality: "Cardinal", arch: "The Arbiter", virtues: ["Balance", "Grace", "Justice"],
    line: "Here two truths are weighed until they balance.",
    lede: "The seventh territory, the first to face outward — where the self meets its equal and learns that fairness is not a feeling but a discipline, held level against the weight of the other.",
    star: "β Zubeneschamali", sqDeg: 538, myth: "The scales of the goddess of justice, the only sign that is neither beast nor person.",
    relics: [["The Even Beam", "It will not tilt for a friend."], ["The Weighed Feather", "Heavier than it looks, against the truth."], ["The Paired Mirror", "You, and the one across from you."], ["The Held Pause", "The breath before the verdict."]] },
  { realm: "The Crucible Depths", nameLead: "The Deepest", nameEm: "Water", tagline: "Where nothing stays buried forever.",
    el: "Water", modality: "Fixed", arch: "The Alchemist", virtues: ["Intensity", "Transformation", "Truth"],
    line: "You go down to be remade.",
    lede: "The eighth territory, the dark water beneath the still water — where love and loss turn out to be the same current, and what is destroyed here returns wearing a truer face.",
    star: "α Antares · the Rival of Mars", sqDeg: 497, myth: "The scorpion that felled the hunter, both raised to the sky on opposite shores.",
    relics: [["The Sealed Vault", "What you cannot bear to look at, kept safe."], ["The Phoenix Ash", "The remains that are also a beginning."], ["The Black Water", "It shows you only the truth."], ["The Last Door", "The one you swore you would never open."]] },
  { realm: "The Far Horizon", nameLead: "The Long", nameEm: "Horizon", tagline: "Where the arrow is loosed before the target is known.",
    el: "Fire", modality: "Mutable", arch: "The Seeker", virtues: ["Vision", "Freedom", "Quest"],
    line: "The edge of the map, where the arrow points past it.",
    lede: "The ninth territory, where the intensity of the depths turns outward and upward into a search — the restless aim at something larger than the self, fired toward a horizon that keeps receding.",
    star: "ε Kaus Australis", sqDeg: 867, myth: "The centaur archer, half beast and half sage, aiming at the heart of the sky.",
    relics: [["The Aimed Arrow", "Already flying, before the doubt arrives."], ["The Open Road", "It has no end you can see from here."], ["The Distant Fire", "The thing worth the whole journey."], ["The Unrolled Map", "It draws itself as you walk."]] },
  { realm: "The Summit Works", nameLead: "The Cold", nameEm: "Summit", tagline: "Where the long climb is the whole of the reward.",
    el: "Earth", modality: "Cardinal", arch: "The Architect", virtues: ["Discipline", "Mastery", "Ascent"],
    line: "Built stone by stone, by those who outlast the weather.",
    lede: "The tenth territory, the high and stony peak above the tree line — where time is the only currency and the patient, solitary climb toward mastery is undertaken for its own austere sake.",
    star: "δ Deneb Algedi", sqDeg: 414, myth: "The sea-goat, climbing from the deep onto the highest dry stone.",
    relics: [["The Cut Stone", "Shaped by patience, not by force."], ["The Long Stair", "Each step the work of a year."], ["The Patient Clock", "It keeps the only time that matters."], ["The Summit Mark", "Left by the few who arrived."]] },
  { realm: "The Signal Fields", nameLead: "The Pouring", nameEm: "Light", tagline: "Where the gift is poured out for those not yet born.",
    el: "Air", modality: "Fixed", arch: "The Visionary", virtues: ["Vision", "Independence", "Renewal"],
    line: "A current runs through here, carrying what comes next.",
    lede: "The eleventh territory, where the lone summit gives way to the wide human field — the cool, far-seeing mind that pours its strange water out for a future it will not live to drink.",
    star: "β Sadalsuud", sqDeg: 980, myth: "The water-bearer, pouring out a stream that never empties.",
    relics: [["The Living Current", "It carries what hasn't happened yet."], ["The Far Signal", "Sent to a stranger in another time."], ["The Open Circuit", "A gift with no return expected."], ["The Held Vision", "What the future will thank you for."]] },
  // ── PISCES — finished register, ported from v3 ──
  { realm: "The Dreaming Ocean", nameLead: "The Dreaming", nameEm: "Ocean", tagline: "Where every tide remembers the shape of a life.",
    el: "Water", modality: "Mutable", arch: "The Dreamer", virtues: ["Compassion", "Imagination", "Surrender"],
    line: "The shore dissolves, and you float in everything at once.",
    lede: "The twelfth and final territory, where the self loosens its outline and dissolves back into the great water — remembering everything at once, and holding none of it.",
    star: "α Alrescha · the Knot", sqDeg: 889, myth: "Aphrodite and Eros, bound by a cord, escaping as two fish.",
    relics: [["The Veil Pearl", ""], ["The Two Fish", ""], ["The Tideless Deep", ""], ["The Soft Light", ""]],
    passage: {
      lead: "Pisces closes the zodiac the way the sea closes a shore — without edge, and without argument.",
      paras: [
        "The ancients drew two fishes bound by a single cord, swimming in opposite directions yet unable to part: the soul pulled at once toward the world and away from it. It is the oldest tension we carry, and the last the wheel resolves. To stand in this territory is to feel the boundary between dreamer and dream go quiet.",
        "Here the vernal point now rests, drifting slowly backward through the Fishes — so that the year itself, by the reckoning of the old astronomers, quietly ends in water before it is struck again into fire.",
      ],
    },
    archive: [
      { no: "Entry 01", title: "Origin Myth", desc: "Aphrodite and Eros, bound by a cord, escape Typhon as two fish.", glyph: "M24 8c-7 4-12 4-15 3v24c3 1 8 1 15 5 7-4 12-4 15-5V11c-3 1-8 1-15-3Z M24 11v29" },
      { no: "Entry 02", title: "Celestial Coordinates", desc: "RA 23ʰ–2ʰ · Dec +2° to +33° · 889 square degrees of sky.", glyph: "M9 24a15 15 0 1 0 30 0a15 15 0 1 0 -30 0 M24 5v38 M5 24h38" },
      { no: "Entry 03", title: "The Guardian Star", desc: "Alrescha, the Knot — where the two cords are tied as one.", glyph: "M24 6l4 13 14 .4-11 8.5 4 13.4L24 46l-11 .3 4-13.4-11-8.5 14-.4Z" },
      { no: "Entry 04", title: "The Forgotten Passage", desc: "The vernal point drifts here, quietly ending the astronomical year.", glyph: "M14 42V16a10 10 0 0 1 20 0v26 M9 42h30 M24 24v10" },
      { no: "Entry 05", title: "Aligned Souls", desc: "Those born beneath the Fishes, and the company the cord keeps.", glyph: "M6 24a11 11 0 1 0 22 0a11 11 0 1 0 -22 0 M20 24a11 11 0 1 0 22 0a11 11 0 1 0 -22 0" },
      { no: "Entry 06", title: "The Tide Records", desc: "Every reading ever cast in this territory, kept in still water.", glyph: "M6 18c4-5 8-5 12 0s8 5 12 0 8-5 12 0 M6 30c4-5 8-5 12 0s8 5 12 0 8-5 12 0" },
      { no: "Entry 07", title: "The Astronomical Mirror", desc: "How the sky above this gate looked the night you were born.", glyph: "M8 24a16 16 0 1 0 32 0a16 16 0 1 0 -32 0 M24 8v32 M24 12c6 4 6 20 0 24" },
    ],
    relicsFull: [
      { ordinal: "I", id: "pisces.veil_pearl", name: "The Veil Pearl", blurb: "A pearl that shows the wearer only what they are ready to see.", state: "within_reach", sigil: "M16 38a18 18 0 1 0 36 0a18 18 0 1 0 -36 0 M27 38a7 7 0 1 0 14 0a7 7 0 1 0 -14 0 M14 26c8-9 32-9 40 0" },
      { ordinal: "II", id: "pisces.two_fish", name: "The Two Fish", blurb: "Two fish that swim forever apart, yet never break the cord.", state: "sealed", sigil: "M24 14C10 26 10 42 24 54 M44 14C58 26 58 42 44 54 M16 34h36" },
      { ordinal: "III", id: "pisces.tideless_deep", name: "The Tideless Deep", blurb: "The still place beneath all weather, where nothing ever moves.", state: "sealed", sigil: "M34 8 12 30v8c0 12 10 22 22 22s22-10 22-22v-8Z M18 38h32 M22 48h24" },
      { ordinal: "IV", id: "pisces.soft_light", name: "The Soft Light", blurb: "The last light of the zodiac — dim enough to look upon directly.", state: "sealed", sigil: "M25 34a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M34 6v8M34 54v8M6 34h8M54 34h8M14 14l6 6M48 48l6 6M54 14l-6 6M20 48l-6 6" },
    ] },
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const ord = ["I", "II", "III", "IV"];

function buildArchive(c: Core): ArchiveEntry[] {
  if (c.archive) return c.archive;
  return [ // DRAFT template — replace
    { no: "Entry 01", title: "Origin Myth", desc: c.myth, glyph: GL[0] },
    { no: "Entry 02", title: "Celestial Coordinates", desc: `${c.sqDeg} square degrees of sky.`, glyph: GL[1] },
    { no: "Entry 03", title: "The Guardian Star", desc: `${c.star}.`, glyph: GL[2] },
    { no: "Entry 04", title: "The Virtue", desc: `${c.virtues[0]} — what this territory asks of you.`, glyph: GL[3] },
    { no: "Entry 05", title: "Aligned Souls", desc: `Those born beneath this sign, and the company they keep.`, glyph: GL[4] },
    { no: "Entry 06", title: "The Astronomical Mirror", desc: "How the sky above this gate looked the night you were born.", glyph: GL[5] },
  ];
}

function buildRelics(c: Core, slug: string): Relic[] {
  if (c.relicsFull) return c.relicsFull;
  return c.relics.slice(0, 4).map(([name, blurb], k) => ({
    ordinal: ord[k], id: `${slug}.${slugify(name)}`, name, blurb,
    state: k === 0 ? "within_reach" : "sealed", sigil: SG[k % SG.length],
  }));
}

export const TERRITORIES: Territory[] = C.map((c, i) => {
  const slug = SIGN_KEY[i];
  const relics = buildRelics(c, slug);
  return {
    slug, i, ordinal: i + 1, sign: SIGN_NAME[i],
    abbr: ["Ari", "Tau", "Gem", "Cnc", "Leo", "Vir", "Lib", "Sco", "Sgr", "Cap", "Aqr", "Psc"][i],
    plate: `Plate ${ROMAN[i]} / XII`,
    el: c.el, arch: c.arch, modality: c.modality,
    realm: c.realm, nameLead: c.nameLead, nameEm: c.nameEm, line: c.line, tagline: c.tagline,
    keywords: c.virtues, artifacts: relics.length, artifactsList: relics.map((r) => r.name),
    lede: c.lede,
    skyCap: [`${SIGN_NAME[i]} — ${["the Ram","the Bull","the Twins","the Crab","the Lion","the Maiden","the Scales","the Scorpion","the Archer","the Sea-Goat","the Water-Bearer","the Fishes"][i]}`, `${c.sqDeg} sq. degrees`, c.star, "Ptolemy, 2ⁿᵈ century"],
    passage: c.passage ?? { lead: `${c.realm} — ${c.tagline.toLowerCase()}`, paras: [c.lede] }, // DRAFT for non-Pisces
    archive: buildArchive(c),
    relics,
    neighbors: {
      prev: { slug: SIGN_KEY[(i + 11) % 12], label: `${SIGN_NAME[(i + 11) % 12]} · ${C[(i + 11) % 12].realm}` },
      next: { slug: SIGN_KEY[(i + 1) % 12], label: `${SIGN_NAME[(i + 1) % 12]} · ${C[(i + 1) % 12].realm}` },
    },
  };
});

export function territoryByKey(key: string) {
  const t = TERRITORIES.find((x) => x.slug === key);
  return t ? { ...t, key: t.slug, name: t.sign } : null;
}
