import type { ProductConfig } from "./types";

// LUCY — the relationship doorway. Same chart, same voice, same gate; the lens
// leans on Venus, the Moon, Mars and the seventh house. Questions, tag and
// preview are the design canonical set (design/The Doorway - Alive.html) —
// the sentence library, not drafts.
export const lucy: ProductConfig = {
  productId: "lucy",
  live: true,
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
    { key: "sure", label: "The first question", q: "When did you last feel sure of them?" },
    { key: "unsaid", label: "The second", q: "What do you keep not saying?" },
    { key: "remain", label: "The third", q: "If they left tomorrow, what would remain of you?" },
  ],
  previewTemplate:
    "You arrived with the Sun in {sunSign}, and Venus — the planet that holds this question — in {venusSign}. What you describe did not begin with this person; it has the shape of something older, kept the way {venusSign} keeps what it loves. And the thing you are not saying has a date on which it will ask to be said, because—",
  sections: [
    { key: "pattern", label: "The Pattern" },
    { key: "attraction", label: "The Attraction" },
    { key: "wound", label: "The Wound" },
    { key: "repetition", label: "The Repetition" },
    { key: "choice", label: "The Choice" },
    { key: "closing", label: "The Closing Message" },
  ],
  visualTheme: { archetype: "The Moon", palette: "lunar ivory, pearl, midnight", pdfTemplate: "gold_register" },
  successRedirect: "/door/lucy?sealed=1",
  door: {
    tag: "The pattern did not begin with this person.",
    emblem: "moon",
    prevLabel: "Lucy · The Moon · the first lines",
    theme: {
      acc: "#e7e2d8", accBright: "#f2eee4", accDeep: "#a8a294",
      accRGB: "231,226,216", brightRGB: "242,238,228", star: "226,230,242",
      ground: ["#0b1733", "#081027", "#04091a", "#02050e"], cy: 0.5, dawn: false,
    },
  },
};
