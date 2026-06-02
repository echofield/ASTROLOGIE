import type { Domain, DomainId, PlanetName } from "./types";

/**
 * The seven domains. Each is a real planetary signification — choosing a domain
 * anchors your North Star to that planet's place in your natal sky, so the
 * window that "opens" is the Moon making a true harmonious contact to it.
 */
export const DOMAINS: Domain[] = [
  {
    id: "begin",
    planet: "Sun",
    glyph: "☉",
    title: "Begin — launch what is mine to start",
    blurb: "Identity, vitality, the thing only you can author.",
  },
  {
    id: "feel",
    planet: "Moon",
    glyph: "☽",
    title: "Feel — tend what needs care",
    blurb: "Home, rest, the inner weather and what it asks.",
  },
  {
    id: "speak",
    planet: "Mercury",
    glyph: "☿",
    title: "Speak — say it, send it, learn it",
    blurb: "Words, study, the message that must move.",
  },
  {
    id: "love",
    planet: "Venus",
    glyph: "♀",
    title: "Love — make beauty, draw close",
    blurb: "Affection, craft, what you want to attract.",
  },
  {
    id: "act",
    planet: "Mars",
    glyph: "♂",
    title: "Act — push, build, fight for it",
    blurb: "Courage, drive, the move that takes nerve.",
  },
  {
    id: "grow",
    planet: "Jupiter",
    glyph: "♃",
    title: "Grow — expand, risk, say yes",
    blurb: "Opportunity, reach, the leap toward more.",
  },
  {
    id: "commit",
    planet: "Saturn",
    glyph: "♄",
    title: "Commit — endure, master, finish",
    blurb: "Discipline, structure, the long vow you keep.",
  },
];

export const DOMAIN_BY_ID: Record<DomainId, Domain> = Object.fromEntries(
  DOMAINS.map((d) => [d.id, d]),
) as Record<DomainId, Domain>;

export function planetForDomain(id: DomainId): PlanetName {
  return DOMAIN_BY_ID[id].planet;
}
