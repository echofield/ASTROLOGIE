import type { ProductConfig } from "./types";

// PATH — the vocation doorway. The lens leans on the Sun, the Midheaven, Saturn,
// Jupiter and the 2nd/6th/10th houses. Questions, tag and preview are the
// design canonical set — the sentence library.
export const path: ProductConfig = {
  productId: "path",
  live: true,
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
    { key: "work", label: "The first question", q: "What work leaves you less tired than rest does?" },
    { key: "want", label: "The second", q: "What did you want before anyone asked you to want?" },
    { key: "building", label: "The third", q: "What are you building that no one has named yet?" },
  ],
  previewTemplate:
    "The Sun that rose with you stands in {sunSign}; Saturn — the slow architect of every vocation — in {saturnSign}. The tiredness you describe is not weakness. It is the specific fatigue of carrying a calling inside a container built for a job, and the container has begun to—",
  sections: [
    { key: "ground", label: "The Ground" },
    { key: "measure", label: "The Measure" },
    { key: "rhythm", label: "The Rhythm" },
    { key: "build", label: "The Build" },
    { key: "season", label: "The Season" },
    { key: "closing", label: "The Closing Message" },
  ],
  visualTheme: { archetype: "The Mountain", palette: "slate, granite, dawn gold, ivory", pdfTemplate: "gold_register" },
  successRedirect: "/door/path?sealed=1",
  door: {
    tag: "The work was waiting before the name for it.",
    purpose: "Your work and its true direction, read from your chart — a written reading, yours to keep.",
    emblem: "mountain",
    prevLabel: "Path · The Mountain · the first lines",
    theme: {
      acc: "#b6a47a", accBright: "#cfc09a", accDeep: "#857757",
      accRGB: "182,164,122", brightRGB: "207,192,154", star: "236,233,224",
      ground: ["#1a2230", "#121925", "#0a0f18", "#04060b"], cy: 0.57, dawn: true,
    },
  },
};
