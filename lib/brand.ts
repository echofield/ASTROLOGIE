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
