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

// Public Stripe Payment Link (safe to expose). Set its post-payment redirect to
// /success in the Stripe dashboard.
export const PAYMENT_LINK = "https://buy.stripe.com/8x25kF3OhefR4Reeqf8k800";

export const PRICING = {
  name: { en: "The AstroLab Founding Pass", fr: "The AstroLab — Pass Fondateur" } as Record<Lang, string>,
  full: 89,
  offer: 59,
  currency: "€",
  badge: { en: "Launch Offer", fr: "Offre de lancement" } as Record<Lang, string>,
  cta: { en: "Get the Founding Pass", fr: "Obtenir le Pass Fondateur" } as Record<Lang, string>,
  note: {
    en: "One-time payment · your sky, your star, and the daily Genius, kept.",
    fr: "Paiement unique · votre ciel, votre étoile et le Genius quotidien, gardés.",
  } as Record<Lang, string>,
};
