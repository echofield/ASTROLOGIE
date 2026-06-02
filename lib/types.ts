// Core domain types for Lodestar.

export type PlanetName =
  | "Sun"
  | "Moon"
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn";

/** A point on the tropical zodiac, in ecliptic longitude degrees [0, 360). */
export type Longitude = number;

/** The seven life domains. Each maps to a natal planet that anchors a North Star. */
export type DomainId =
  | "begin"
  | "feel"
  | "speak"
  | "love"
  | "act"
  | "grow"
  | "commit";

export interface Domain {
  id: DomainId;
  planet: PlanetName;
  glyph: string;
  /** Short verb-phrase shown in the picker. */
  title: string;
  /** One-line meaning of acting under this planet. */
  blurb: string;
}

/** The user's fixed sky — computed once from birth data. */
export interface NatalChart {
  positions: Record<PlanetName, Longitude>;
  birthISO: string; // raw birth datetime as entered (local), for recompute/refine later
}

export interface Profile {
  name: string;
  birthISO: string;
  natal: NatalChart;
  createdAt: string;
}

/** A guiding intention anchored to a natal planet. */
export interface NorthStar {
  id: string;
  intention: string;
  domain: DomainId;
  anchor: Longitude; // = natal position of the domain's planet
  createdAt: string;
  active: boolean;
}

/** A moment the user sealed while a threshold was open. The seed of the constellation. */
export interface Passage {
  id: string;
  northStarId: string;
  intention: string;
  domain: DomainId;
  sealedAt: string; // ISO timestamp
  moonLon: Longitude; // where the Moon stood when sealed — its star in the constellation
  aspect: AspectName; // which contact was open
  note?: string;
}

export type AspectName =
  | "conjunction"
  | "sextile"
  | "square"
  | "trine"
  | "opposition";

export type AspectTone = "harmony" | "tension";

export interface AspectInfo {
  name: AspectName;
  angle: number; // exact separation, degrees
  tone: AspectTone;
  glyph: string;
}

/** The Moon's live relationship to a North Star at a given instant. */
export interface Contact {
  separation: number; // 0..180 to the anchor
  nearest: AspectInfo;
  orb: number; // distance from the exact aspect angle (degrees)
  /** Within a wide orb — a window is forming. */
  forming: boolean;
  /** Within a tight orb of a harmonious aspect — the threshold is open. */
  open: boolean;
  tone: AspectTone;
}

export type StageId = "witness" | "keeper" | "mythmaker";

export interface Stage {
  id: StageId;
  index: number; // 1, 2, 3
  title: string;
  motto: string;
}
