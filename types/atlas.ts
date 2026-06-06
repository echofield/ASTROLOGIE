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
