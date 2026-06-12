// One machine, multiple masks. A doorway product changes the funnel, the lens,
// the section names and the theme — NEVER the engine, NEVER the voice. The VOICE
// bible, the antithesis lint and the judge run identically on every product's
// output; `tone` modulates within the bible, it does not replace it.
//
// Adding a doorway = adding one config file to lib/products and registering it.

export type ProductId = "core" | "lucy" | "shadow" | "path";

export interface FunnelQuestion {
  key: string;
  /** The small-caps label above the question ("The first question"). */
  label: string;
  /** The question as the visitor reads it. */
  q: string;
  placeholder?: string;
}

/** The door's visual mask — tokens only; the shell never changes per door. */
export interface DoorTheme {
  acc: string;
  accBright: string;
  accDeep: string;
  accRGB: string;
  brightRGB: string;
  star: string;
  ground: [string, string, string, string];
  cy: number;
  dawn: boolean;
}

export interface DoorFace {
  /** One line under the name — the door's whole claim. */
  tag: string;
  /** The plain sentence beneath it — what this is and what you receive. */
  purpose: string;
  emblem: "moon" | "eclipse" | "mountain";
  prevLabel: string;
  theme: DoorTheme;
}

export interface ProductLens {
  /** Bodies the method is told to lean on (the chart stays whole — emphasis, not omission). */
  bodies: string[];
  /** Houses the method watches (empty = all; ignored when the hour is unknown). */
  houses: number[];
  /** The themes this doorway reads for. */
  themes: string[];
}

export interface ProductConfig {
  productId: ProductId;
  /** Doors render and sell only when live. Drafts stay dark. */
  live: boolean;
  displayName: string;
  /** "relationship" | "shadow" | "vocation" | "the whole sky" — rides Stripe metadata. */
  doorway: string;
  funnelVersion: string;
  priceEur: number;
  priceLabel: string;
  /** Inflection WITHIN the house voice — never a replacement voice. */
  tone: string;
  lens: ProductLens;
  funnelQuestions: FunnelQuestion[];
  /** The pre-checkout taste — stops mid-thought. {slots} are computed astro facts. */
  previewTemplate: string;
  /** The report's movements, in order. Keys become the artifact's JSON keys. */
  sections: { key: string; label: string }[];
  visualTheme: {
    archetype: string;
    palette: string;
    pdfTemplate: "gold_register";
  };
  successRedirect: string;
  /** The doorway surface's mask (absent for core — core keeps its cabinet flow). */
  door?: DoorFace;
}
