// Shared contract for the Atlas constellation system (Pass 1).
// The fuller Territory/Codex contract from the master brief is deferred.

export interface AtlasStar {
  id: string;
  ra: number;   // hours, 0–24
  dec: number;  // degrees
  mag: number;
  faint?: boolean;
  hip?: number;
  unverified?: boolean; // seed coord kept (no catalog match within tolerance)
}

export interface Sigil { k: number; paths: string[]; }

export interface Editorial {
  eyebrow: string; name: string; tagline: string;
  attr: string; lede: string; plaque: string; cap: string;
}

export interface ConstellationData {
  abbr: string;
  plate: string;
  sigil: Sigil;
  ed: Editorial;
  stars: AtlasStar[];
  lines: [string, string][];
}

export interface ConstellationTable {
  _provenance: Record<string, string>;
  signs: Record<string, ConstellationData>;
}

// ── Territory contract (Phase 0 lock; consumed by FRONT and BACK) ──────────────
export type Element = "Fire" | "Earth" | "Air" | "Water";
export type Modality = "Cardinal" | "Fixed" | "Mutable";

export interface ArchiveEntry { no: string; title: string; desc: string; glyph: string; } // glyph = SVG path d
export interface Relic {
  ordinal: string;          // 'I'..'IV'
  id: string;               // stable artifact_id, e.g. 'pisces.veil_pearl'
  name: string;
  blurb: string;
  sigil: string;            // SVG path d
  state: "within_reach" | "sealed"; // baseline availability (static)
}

export interface Territory {
  slug: string;             // 'pisces'
  i: number;                // 0..11 zodiac index
  ordinal: number;          // 1..12
  sign: string;             // 'Pisces'
  abbr: string;             // 'Psc'
  plate: string;            // 'Plate XII / XII'
  el: Element;
  arch: string;             // archetype
  modality: Modality;
  realm: string;            // place-name ('The Dreaming Ocean')
  nameLead: string;         // hero name, first part ('The Dreaming')
  nameEm: string;           // hero name, emphasized block ('Ocean')
  line: string;             // one short poetic line (atlas hub)
  tagline: string;          // hero italic
  keywords: string[];       // virtues (attr triad)
  artifacts: number;        // = relics.length
  artifactsList: string[];  // relic names (back-compat)
  lede: string;
  skyCap: string[];         // catalog metadata line items
  passage: { lead: string; paras: string[] };
  archive: ArchiveEntry[];
  relics: Relic[];
  neighbors: { prev: { slug: string; label: string }; next: { slug: string; label: string } };
}

// user-state contracts (Milestone B; derived, not stored as tables)
export interface DiscoveryState { found: string[]; } // artifact_ids
export interface Codex {
  byTerritory: Record<string, { found: number; total: number }>;
  foundTotal: number;
  total: number;
}
