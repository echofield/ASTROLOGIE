import type { ProductConfig } from "./types";

// PATH — the vocation doorway. The lens leans on the Sun, the Midheaven, Saturn,
// Jupiter and the 2nd/6th/10th houses, and reads for direction and the rhythm of work.
// DRAFT — dark until its copy is blessed and Phase C wires the door.
export const path: ProductConfig = {
  productId: "path",
  live: false,
  displayName: "Path",
  doorway: "vocation",
  funnelVersion: "path_v1",
  priceEur: 60,
  priceLabel: "€60",
  tone: "steady, structural, long-sighted — builds, never cheers",
  lens: {
    bodies: ["Sun", "Saturn", "Jupiter"],
    houses: [2, 6, 10],
    themes: ["vocation", "direction", "the rhythm of work", "what is owed to the build"],
  },
  funnelQuestions: [
    { key: "work", label: "What does your work take from you that it shouldn't?" },
    { key: "unbuilt", label: "What have you not built yet that you keep describing?" },
    { key: "measure", label: "Whose measure are you still using?" },
  ],
  previewTemplate:
    "The direction was never missing — it was unread. The Sun in {sunSign} takes its tenth-house orders from a measure you did not choose, and the work that would hold you is ",
  sections: [
    { key: "ground", label: "The Ground" },
    { key: "measure", label: "The Measure" },
    { key: "rhythm", label: "The Rhythm" },
    { key: "build", label: "The Build" },
    { key: "season", label: "The Season" },
    { key: "closing", label: "The Closing Message" },
  ],
  visualTheme: { archetype: "The Mountain", palette: "slate, granite, dawn gold, ivory", pdfTemplate: "gold_register" },
  successRedirect: "/door/path/sealed",
};
