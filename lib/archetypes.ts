// The hidden engine of meaning.
//
// 21 archetypal voices (the ARE architecture) sit BEHIND the glass — never a
// picker, never a taxonomy the user sees. Each sealed star is quietly governed
// by one of them, derived from its planetary ruler (7) × a refinement (3) = 21.
// The Genius borrows that voice when it speaks about the star.
//
// The Genius's own native temperament is Witness + Oracle: it observes the sky
// without distortion and senses what is coming. So while the Moon is far it
// speaks in that base voice; as the Moon nears and arrives, the star's archetype
// takes over.
//
// `geniusLine()` is the templated default. A thin Claude layer can replace it
// with an async call using the same inputs (star words + archetype persona +
// live transit) — the seam is intentional.

import type { SealedStar } from "./star";
import type { PlanetName } from "./types";
import type { Reach } from "./star";

export interface Archetype {
  id: number;
  name: string;
  essence: string;
  near: string; // the threshold forms
  arrived: string; // the Moon stands on the star
}

const ARCH: Record<number, Archetype> = {
  1:  { id: 1,  name: "Architect", essence: "designs realities", near: "The structure you began is almost in reach. Hold the line.", arrived: "The Moon stands on it. What you designed can bear weight now." },
  2:  { id: 2,  name: "Oracle", essence: "senses trajectories", near: "What you sensed is arriving. Don't look away now.", arrived: "The Moon touches your star. What you foresaw is at the door." },
  3:  { id: 3,  name: "Herald", essence: "announces emergence", near: "The announcement is forming. Soon you say it aloud.", arrived: "The Moon arrives. Speak it — a cycle opens tonight." },
  4:  { id: 4,  name: "Alchemist", essence: "transmutes pain into value", near: "The raw thing is nearly turned. Stay with the heat.", arrived: "The Moon is here. What hurt can become gold tonight — not by force." },
  5:  { id: 5,  name: "Sovereign", essence: "creates order and direction", near: "Your ground is almost set. Decide who you are in it.", arrived: "The Moon crowns your star. Set the boundary; claim the ground." },
  6:  { id: 6,  name: "Sage", essence: "seeks truth", near: "The truth of it is clearing. Let the illusion fall.", arrived: "The Moon reaches your star. See it plainly — that is enough." },
  7:  { id: 7,  name: "Seeker", essence: "expands horizons", near: "The horizon you wanted is close. Keep moving.", arrived: "The Moon arrives. The unknown opens — go toward it." },
  8:  { id: 8,  name: "Magician", essence: "connects invisible forces", near: "The unseen threads are tightening into something real.", arrived: "The Moon stands on your star. The invisible becomes visible now." },
  9:  { id: 9,  name: "Creator", essence: "gives form", near: "What didn't exist is nearly formed. Make room.", arrived: "The Moon touches it. Give it shape tonight — it's ready to be born." },
  10: { id: 10, name: "Builder", essence: "turns vision into structure", near: "Vision is almost structure. Lay the next stone.", arrived: "The Moon arrives. Build — what you make will hold today." },
  11: { id: 11, name: "Guardian", essence: "protects the precious", near: "What you protect is near its hour. Stay close.", arrived: "The Moon reaches your star. Guard it; it is precious and ready." },
  12: { id: 12, name: "Warrior", essence: "confronts resistance", near: "The resistance thins. Gather your discipline.", arrived: "The Moon stands on it. It is within reach — move." },
  13: { id: 13, name: "Lover", essence: "creates connection and meaning", near: "The closeness you wanted is almost here. Soften.", arrived: "The Moon touches your star. Reach toward it — let it matter." },
  14: { id: 14, name: "Healer", essence: "restores coherence", near: "The fracture is nearly whole. Be gentle a little longer.", arrived: "The Moon arrives. Coherence can return tonight — let it." },
  15: { id: 15, name: "Mentor", essence: "transmits growth", near: "What you must pass on is almost ready to be given.", arrived: "The Moon reaches your star. Transmit it now — growth quickens." },
  16: { id: 16, name: "Trickster", essence: "breaks stagnant patterns", near: "The stuck pattern is loosening. A small disruption nears.", arrived: "The Moon stands on it. Break the old shape — on purpose." },
  17: { id: 17, name: "Rebel", essence: "challenges the dead", near: "What no longer serves is almost yours to refuse.", arrived: "The Moon arrives. Refuse what's dead; choose life." },
  18: { id: 18, name: "Witness", essence: "observes without distortion", near: "It's nearly clear. Keep watching without flinching.", arrived: "The Moon touches your star. Simply see it — the truth is here." },
  19: { id: 19, name: "Twin", essence: "mirrors the hidden self", near: "A hidden part of you is surfacing toward the light.", arrived: "The Moon reaches your star. Meet what mirrors you." },
  20: { id: 20, name: "Flame", essence: "ignites initiation", near: "The spark is catching. Shield it from the wind.", arrived: "The Moon stands on it. Ignite — this is the initiation." },
  21: { id: 21, name: "Ouroboros", essence: "renews through cycles", near: "The cycle is closing to begin again. Let the old end.", arrived: "The Moon arrives. What ends here is what renews you." },
};

// 7 classical rulers × a triad of 3 = the 21, each used once.
const PLANET_TRIADS: Record<PlanetName, [number, number, number]> = {
  Sun:     [5, 20, 9],   // Sovereign · Flame · Creator
  Moon:    [14, 18, 19], // Healer · Witness · Twin
  Mercury: [3, 8, 16],   // Herald · Magician · Trickster
  Venus:   [13, 11, 4],  // Lover · Guardian · Alchemist
  Mars:    [12, 17, 7],  // Warrior · Rebel · Seeker
  Jupiter: [6, 15, 2],   // Sage · Mentor · Oracle
  Saturn:  [1, 10, 21],  // Architect · Builder · Ouroboros
};

const FAR = [
  "The Moon is far from {name} tonight. The sky is only moving.",
  "Nothing presses yet. The heavens are still travelling toward {name}.",
  "I am watching {name}. The Moon has {days} to cross.",
  "Quiet. The distance to your star is closing, slowly.",
];
const KEPT = "{name} has risen. It is kept in your sky now.";

function tinyHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** The hidden archetype governing a star (derived; no migration needed). */
export function archetypeForStar(star: SealedStar): Archetype {
  const triad = PLANET_TRIADS[(star.ruler as PlanetName)] ?? PLANET_TRIADS.Sun;
  const pick = tinyHash(star.must + "·" + star.name) % 3;
  return ARCH[triad[pick]];
}

export type Phase = "far" | "near" | "arrived" | "kept";

export function geniusPhase(reach: Reach, fulfilled: boolean): Phase {
  if (fulfilled) return "kept";
  const g = reach.gap;
  if (g <= 3 || g >= 357) return "arrived";
  if (g <= 14 || g >= 346) return "near";
  return "far";
}

/** One true line, in the voice the moment calls for. Templated; Claude-ready. */
export function geniusLine(star: SealedStar, reach: Reach, fulfilled: boolean): string {
  const phase = geniusPhase(reach, fulfilled);
  const a = archetypeForStar(star);
  if (phase === "kept") return fill(KEPT, star, reach);
  if (phase === "arrived") return a.arrived;
  if (phase === "near") return a.near;
  const idx = Math.floor(Math.max(0, reach.days)) % FAR.length;
  return fill(FAR[idx], star, reach);
}

function fill(t: string, star: SealedStar, reach: Reach): string {
  const days = Math.max(1, Math.round(reach.days));
  return t.replace("{name}", star.name).replace("{days}", days + (days === 1 ? " day" : " days"));
}
