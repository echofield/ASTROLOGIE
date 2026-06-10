// THE SKY TONIGHT — the gloss table. The statement line is computed (phase,
// sign, degree, ruler); the gloss beneath it is curated, keyed on the computed
// fact. Terse, declarative, slightly oracular. Never cute, no exclamation.
//
// DRAFT SCAFFOLDING — operator's pen finalizes these lines (house rule:
// the user writes final copy). The table is built to grow toward ~40 lines
// as blessed variants accumulate.
import type { Planet } from "./planetary-hours";

/** Moon gloss, keyed by phase octant (0 new … 4 full … 7 waning crescent). */
export const MOON_GLOSS: string[] = [
  "The sky keeps its own counsel.",            // new
  "The tide is coming in.",                    // waxing crescent
  "Half-lit, and leaning forward.",            // first quarter
  "The light gathers toward full.",            // waxing gibbous
  "Nothing is hidden tonight.",                // full
  "The tide is going out.",                    // waning gibbous
  "What remains is being weighed.",            // last quarter
  "The month exhales.",                        // waning crescent
];

/** Hour gloss, keyed by the Chaldean ruler of the current hour. */
export const HOUR_GLOSS: Record<Planet, string> = {
  Saturn: "What is built now, holds.",
  Jupiter: "The hour opens wider than it looks.",
  Mars: "Edges are sharper in this hour.",
  Sun: "The hour stands in plain light.",
  Venus: "The hour inclines toward accord.",
  Mercury: "Words travel quickly in this hour.",
  Moon: "The hour moves with the tide.",
};

/** Today gloss, keyed by the Sun's sign. */
export const SUN_GLOSS: string[] = [
  "The year's fire starts here.",              // Aries
  "The ground here is slow and certain.",      // Taurus
  "The air moves fast here.",                  // Gemini
  "The tide remembers its shore.",             // Cancer
  "The light is at its most declarative.",     // Leo
  "The harvest is counted, grain by grain.",   // Virgo
  "The scales weigh day against night.",       // Libra
  "The water runs deep and unlit.",            // Scorpio
  "The arrow is already travelling.",          // Sagittarius
  "The mountain measures every step.",         // Capricorn
  "The air is thin, and very clear.",          // Aquarius
  "The two fish swim against each other.",     // Pisces
];

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];

/** Degrees within a sign, written out — "eleven", "twenty-three". */
export function degreesInWords(deg: number): string {
  const d = Math.max(0, Math.min(29, Math.floor(deg)));
  if (d < 20) return ONES[d];
  return d === 20 ? "twenty" : `twenty-${ONES[d - 20]}`;
}
