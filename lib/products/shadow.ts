import type { ProductConfig } from "./types";

// SHADOW — the unconscious-patterns doorway. The lens leans on the Moon, Saturn,
// Pluto and the 8th/12th houses. Questions, tag and preview are the design
// canonical set — the sentence library.
export const shadow: ProductConfig = {
  productId: "shadow",
  live: true,
  displayName: "Shadow",
  doorway: "shadow",
  funnelVersion: "shadow_v1",
  priceEur: 60,
  priceLabel: "€60",
  tone: "grave, forensic, unflinching — names the mechanism without cruelty",
  lens: {
    bodies: ["Moon", "Saturn", "Pluto"],
    houses: [8, 12],
    themes: ["self-sabotage", "projections", "defense mechanisms", "what is disowned"],
  },
  funnelQuestions: [
    { key: "again", label: "The first question", q: "What do you do again, although you swore you would stop?" },
    { key: "voice", label: "The second", q: "Whose voice does it speak in, when it speaks?" },
    { key: "cost", label: "The third", q: "What would it cost you to be seen entirely?" },
  ],
  previewTemplate:
    "Your Sun stands in {sunSign}, but this letter is not about your light. Saturn, in {saturnSign}, keeps a ledger you never agreed to sign — and the thing you swore to stop is written in it twice. It is not a flaw in the pattern. It is the pattern, and it began the year—",
  sections: [
    { key: "mechanism", label: "The Mechanism" },
    { key: "origin", label: "The Origin" },
    { key: "projection", label: "The Projection" },
    { key: "cost", label: "The Cost" },
    { key: "undoing", label: "The Undoing" },
    { key: "closing", label: "The Closing Message" },
  ],
  visualTheme: { archetype: "The Eclipse", palette: "black, iron, ember, dim gold", pdfTemplate: "gold_register" },
  successRedirect: "/door/shadow?sealed=1",
  door: {
    tag: "What repeats is asking to be read.",
    purpose: "The thing that repeats, read from your chart — a written reading, yours to keep.",
    emblem: "eclipse",
    prevLabel: "Shadow · The Eclipse · the first lines",
    theme: {
      acc: "#b96a44", accBright: "#dd9468", accDeep: "#7e4a30",
      accRGB: "185,106,68", brightRGB: "221,148,104", star: "228,196,176",
      ground: ["#141114", "#0d0b0e", "#080709", "#030203"], cy: 0.5, dawn: false,
    },
  },
};
