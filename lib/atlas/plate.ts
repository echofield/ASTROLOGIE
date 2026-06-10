// The geometry plate's data — built once, used by the web reading, the PDF,
// and the Cabinet shelf. Pulls the same functions the reading pipeline used
// (displaySky, ascendant, tightestNatalAspects), so the chords the reader sees
// are the exact aspects the prose interprets — same math, same orbs.
import { displaySky } from "@/lib/chart";
import { ascendant, midheaven } from "@/lib/ascendant";
import { tightestNatalAspects } from "@/lib/transits";
import type { Profile } from "@/lib/storage";
import type { NatalWheelInput } from "./natal-wheel-geometry";

export interface PlateData {
  input: NatalWheelInput;
  /** "Sun conjunct Pluto · 0°15′" — the named aspects, for the caption block. */
  aspectLabels: string[];
  /** "23 September 1994 · Montreuil" */
  birthLabel: string;
  hourUnknown: boolean;
  starName?: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pointName = (k: string) => (k === "asc" ? "ASC" : k === "mc" ? "MC" : cap(k));

function orbLabel(orb: number): string {
  const d = Math.floor(orb);
  const m = Math.round((orb - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}′`;
}

export function buildPlate(profile: Profile, starName?: string): PlateData {
  const birth = new Date(profile.birthISO);
  const natal = displaySky(birth);
  const hourUnknown = Boolean(profile.timeUnknown);

  let asc: number | null = null;
  let mc: number | null = null;
  if (profile.lat != null && profile.lon != null && !hourUnknown) {
    asc = ascendant(birth, profile.lat, profile.lon);
    mc = midheaven(birth, profile.lon);
  }

  // the pipeline names the 3 tightest (payload: tightestNatalAspects(..., 3));
  // the plate also carries the next-tightest as hairlines, up to 10 in all
  const all = tightestNatalAspects(natal, asc, mc, 10);
  const named = all.slice(0, 3);

  const planets: Record<string, number> = {};
  for (const [k, v] of Object.entries(natal)) planets[cap(k)] = v as number;

  const input: NatalWheelInput = {
    planets,
    asc,
    mc,
    hasHouses: asc != null,
    aspects: all.map((a, i) => ({ a: pointName(a.bodyA), b: pointName(a.bodyB), named: i < 3 })),
  };

  const birthLabel = [
    birth.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    profile.place || null,
  ].filter(Boolean).join(" · ");

  return {
    input,
    aspectLabels: named.map((a) => `${pointName(a.bodyA)} ${a.aspect} ${pointName(a.bodyB)} · ${orbLabel(a.orb)}`),
    birthLabel,
    hourUnknown,
    starName,
  };
}
