// The contract between ATLAS_VISUAL §IX and the engine. Twelve calibrations of
// ONE world — never twelve styles. v1 ships four (they span burst / lattice /
// network / vortex); the other eight are stubs awaiting a creative pass with
// Mars, not engineering work.
export type Filament = "sharp" | "soft" | "paired" | "branching" | "spoke" | "lattice" | "vector";
export type Motion =
  | "burst" | "concentric" | "oscillation" | "tidal" | "bloom" | "crystalline"
  | "equilibrium" | "infall" | "trajectory" | "ascent" | "network" | "vortex";

export type SignId =
  | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
  | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export type SignCalibration = {
  id: SignId;
  density: number;                // 0..1 — particle count relative to max
  flow: number;                   // 0..1 — drift force on particles
  filaments: Filament;            // line behavior between particles
  motion: Motion;                 // global motion pattern
  goldRatio: number;              // 0..1 — fraction of particles drawn in Or
  constellationThreshold: number; // 0..1 — distance for line drawing
  geometryOpacity: number;        // 0..1 — sacred geometry overlay strength
  cameraMode: "orbit" | "dolly-through" | "static-radial";
  /** v1: only calibrated signs are selectable. */
  ready: boolean;
};

const stub = (id: SignId, motion: Motion, filaments: Filament): SignCalibration => ({
  // TODO(creative pass with Mars): calibrate — these are neutral placeholders.
  id, density: 0.5, flow: 0.4, filaments, motion, goldRatio: 0.08,
  constellationThreshold: 0.35, geometryOpacity: 0.5, cameraMode: "orbit", ready: false,
});

export const CALIBRATIONS: Record<SignId, SignCalibration> = {
  // ── v1: the four corners of the parameter space ──
  aries: {
    id: "aries",
    density: 0.55, flow: 0.85, filaments: "sharp", motion: "burst",
    goldRatio: 0.18, constellationThreshold: 0.22, geometryOpacity: 0.45,
    cameraMode: "orbit", ready: true,
  },
  virgo: {
    id: "virgo",
    density: 0.85, flow: 0.06, filaments: "lattice", motion: "crystalline",
    goldRatio: 0.05, constellationThreshold: 0.30, geometryOpacity: 0.75,
    cameraMode: "static-radial", ready: true, // the precision IS the stillness
  },
  aquarius: {
    id: "aquarius",
    density: 0.6, flow: 0.35, filaments: "branching", motion: "network",
    goldRatio: 0.10, constellationThreshold: 0.42, geometryOpacity: 0.35,
    cameraMode: "orbit", ready: true,
  },
  pisces: {
    id: "pisces",
    density: 0.7, flow: 0.95, filaments: "soft", motion: "vortex",
    goldRatio: 0.08, constellationThreshold: 0.30, geometryOpacity: 0.25,
    cameraMode: "dolly-through", ready: true,
  },
  // ── stubs — TODO(creative pass) ──
  taurus: stub("taurus", "concentric", "soft"),
  gemini: stub("gemini", "oscillation", "paired"),
  cancer: stub("cancer", "tidal", "soft"),
  leo: stub("leo", "bloom", "spoke"),
  libra: stub("libra", "equilibrium", "paired"),
  scorpio: stub("scorpio", "infall", "sharp"),
  sagittarius: stub("sagittarius", "trajectory", "vector"),
  capricorn: stub("capricorn", "ascent", "lattice"),
};

export const SIGN_ORDER: SignId[] = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];
