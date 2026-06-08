export const PRODUCT_NAME = "The AstroLab";
export const PRODUCT_DOMAIN = "https://the-astrolab.app";

export type Lang = "en" | "fr";

export const LANG_LABEL: Record<Lang, string> = {
  en: "EN",
  fr: "FR",
};

export const DEFAULT_LANG: Lang = "en";

export type LegalSlug = "privacy" | "terms" | "refund" | "notice";

export const LEGAL_LINKS: { slug: LegalSlug; label: Record<Lang, string> }[] = [
  { slug: "privacy", label: { en: "Privacy Policy", fr: "Confidentialité" } },
  { slug: "terms", label: { en: "Terms", fr: "CGU / CGV" } },
  { slug: "refund", label: { en: "Refund Policy", fr: "Remboursement" } },
  { slug: "notice", label: { en: "Legal Notice", fr: "Mentions légales" } },
];

export const DISCLAIMER: Record<Lang, string> = {
  en: "This content is for entertainment and self-reflection purposes only.",
  fr: "Ce contenu est fourni à des fins de divertissement et de réflexion personnelle uniquement.",
};

// Public Stripe Payment Link (safe to expose). Live €60 "The Reading" link; set its
// post-payment redirect to /success in the Stripe dashboard. NEXT_PUBLIC_PAYMENT_LINK
// overrides it (e.g. a Stripe test link for test-card runs); unset → live.
export const PAYMENT_LINK = process.env.NEXT_PUBLIC_PAYMENT_LINK || "https://buy.stripe.com/bJe00k0pcbI7ggkaXK3Je00";

// The Reading — one reading, drawn for a sealed question, kept in the Cabinet.
// One price, no anchor, no "lifetime / beta / future features" — we deliver one reading.
export const PRICING = {
  name: { en: "The Reading", fr: "La Lecture" } as Record<Lang, string>,
  offer: 60,
  currency: "€",
  badge: { en: "A single moment", fr: "Un seul moment" } as Record<Lang, string>,
  cta: { en: "Have it drawn", fr: "Faire tirer la lecture" } as Record<Lang, string>,
  note: {
    en: "A single reading, drawn for a question you seal, against the sky exactly as it stands. Yours to keep in your Cabinet, to return to.",
    fr: "Une seule lecture, tirée pour une question que vous scellez, sous le ciel tel qu'il se tient. À garder dans votre Cabinet, pour y revenir.",
  } as Record<Lang, string>,
};
