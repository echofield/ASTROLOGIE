import type { ProductConfig } from "./types";

// SHADOW — the unconscious-patterns doorway. The lens leans on the Moon, Saturn,
// Pluto and the 8th/12th houses, and reads for projection and defense.
// DRAFT — dark until its copy is blessed and Phase C wires the door.
export const shadow: ProductConfig = {
  productId: "shadow",
  live: false,
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
    { key: "undoes", label: "What do you do that undoes you?" },
    { key: "accused", label: "What do people keep accusing you of that feels unfair?" },
    { key: "night", label: "What thought returns at night?" },
  ],
  previewTemplate:
    "The habit you fight in daylight is fed at night. Saturn in {saturnSign} keeps the ledger of every time softness cost you — and the defense it built has outlived its war: ",
  sections: [
    { key: "mechanism", label: "The Mechanism" },
    { key: "origin", label: "The Origin" },
    { key: "projection", label: "The Projection" },
    { key: "cost", label: "The Cost" },
    { key: "undoing", label: "The Undoing" },
    { key: "closing", label: "The Closing Message" },
  ],
  visualTheme: { archetype: "The Eclipse", palette: "black, iron, ember, dim gold", pdfTemplate: "gold_register" },
  successRedirect: "/door/shadow/sealed",
};
