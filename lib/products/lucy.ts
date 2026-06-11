import type { ProductConfig } from "./types";

// LUCY — the relationship doorway. Same chart, same voice, same gate; the lens
// leans on Venus, the Moon, Mars and the seventh house, and reads for the
// attachment pattern and its repetitions.
//
// DRAFT COPY THROUGHOUT (questions, preview, section names) — scaffolding for
// the operator's pen. live:false until Phase C wires the door and the copy is blessed.
export const lucy: ProductConfig = {
  productId: "lucy",
  live: false,
  displayName: "Lucy",
  doorway: "relationship",
  funnelVersion: "lucy_v1",
  priceEur: 60,
  priceLabel: "€60",
  tone: "intimate, cinematic, precise — emotionally exact, never consoling",
  lens: {
    bodies: ["Venus", "Moon", "Mars"],
    houses: [5, 7, 8],
    themes: ["attachment pattern", "what attracts", "what repeats in love", "the choice"],
  },
  funnelQuestions: [
    { key: "drawn", label: "Who are you drawn to — and what does it cost you?" },
    { key: "repeats", label: "What keeps happening, with different people?" },
    { key: "afraid", label: "What are you afraid love will ask of you?" },
  ],
  previewTemplate:
    "The pattern did not begin with this person. It began with the way your chart learned to recognize intensity as meaning — Venus in {venusSign}, watching the door. And the part you call bad luck has a shape: ",
  sections: [
    { key: "pattern", label: "The Pattern" },
    { key: "attraction", label: "The Attraction" },
    { key: "wound", label: "The Wound" },
    { key: "repetition", label: "The Repetition" },
    { key: "choice", label: "The Choice" },
    { key: "closing", label: "The Closing Message" },
  ],
  visualTheme: { archetype: "The Moon", palette: "deep blue, pearl, black, soft gold", pdfTemplate: "gold_register" },
  successRedirect: "/door/lucy/sealed",
};
