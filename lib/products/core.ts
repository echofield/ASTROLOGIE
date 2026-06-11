import type { ProductConfig } from "./types";

// THE READING — the existing product, described as the first config. This file
// changes nothing about how core behaves; it proves the registry on the product
// that already sells, so every doorway that follows inherits a tested shape.
export const core: ProductConfig = {
  productId: "core",
  live: true,
  displayName: "The Reading",
  doorway: "the whole sky",
  funnelVersion: "core_v1",
  priceEur: 60,
  priceLabel: "€60",
  tone: "the house voice, whole — warm then cool, observed, uncomforting",
  lens: {
    bodies: ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"],
    houses: [],
    themes: ["the sealed question", "the standing pattern", "the year ahead"],
  },
  funnelQuestions: [
    { key: "season", label: "What season are you in?" },
    { key: "repeating", label: "What keeps repeating?" },
    { key: "afraid", label: "What are you afraid of?" },
  ],
  previewTemplate: "",
  sections: [
    { key: "signature", label: "Signature" },
    { key: "chart", label: "Chart" },
    { key: "pattern", label: "Pattern" },
    { key: "star", label: "Your star" },
    { key: "yearAhead", label: "Year ahead" },
    { key: "counsel", label: "Counsel" },
  ],
  visualTheme: { archetype: "The Observatory", palette: "midnight, gold leaf, ivory", pdfTemplate: "gold_register" },
  successRedirect: "/success",
};
