import { DISCLAIMER, PRODUCT_DOMAIN, PRODUCT_NAME, type Lang, type LegalSlug } from "./brand";

export interface LegalSection {
  title: string;
  body: string[];
}

export interface LegalPage {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}

const updated = "June 9, 2026";
const updatedFr = "9 juin 2026";

// Privacy, Refund, and the Legal Notice are English-only (the same content is served for both
// language toggles), written in the product's register — plain, short, honest. Support runs
// through contact@symi.io.
const privacyEn: LegalPage = {
  title: "Privacy Policy",
  intro: `${PRODUCT_NAME} is a personalized digital product. We keep only what's needed to draw your reading and keep it for you — and we never share it with third parties for their own use.`,
  updated,
  sections: [
    {
      title: "What we keep",
      body: [
        "Your birth details, the question you sealed, the reading drawn for it, and the email tied to your purchase — used only to cast your reading, deliver it, and let you reopen it later.",
      ],
    },
    {
      title: "No selling, no sharing",
      body: [
        "We don't sell your data, and we don't share it with third parties for their own purposes. Hosting, database, payment, and AI providers process it only to run the service, on our instructions.",
      ],
    },
    {
      title: "Anything at all",
      body: [
        "You can reset your Cabinet from the app at any time, which clears your saved profile, journal, and readings on the device.",
        "For access, correction, export, deletion, or any issue at all, write to contact@symi.io.",
      ],
    },
  ],
};

const refundEn: LegalPage = {
  title: "Refund Policy",
  intro: `The Reading is a personalized digital product, drawn for the single question you seal and delivered to you. Here is how refunds work.`,
  updated,
  sections: [
    {
      title: "Before it is drawn",
      body: [
        "If you have paid but your reading has not been generated yet, write to us — we will cancel and refund it, no questions asked.",
      ],
    },
    {
      title: "Once it is drawn",
      body: [
        "Because each reading is personalized and delivered immediately, it cannot usually be refunded once it has been generated — the work is done and it is yours.",
        "If something went wrong — it never arrived, or it did not come out right — tell us and we will make it right.",
      ],
    },
    {
      title: "Reach a person",
      body: [
        "For a refund, a problem, or any question, write to contact@symi.io with the email you used to buy. A person reads it.",
      ],
    },
  ],
};

const noticeEn: LegalPage = {
  title: "Legal Notice",
  intro: "The AstroLab is published by an independent operator.",
  updated,
  sections: [
    {
      title: "Publisher & hosting",
      body: [
        "Contact: contact@symi.io",
        "Hosting: Vercel Inc. — vercel.com",
      ],
    },
    {
      title: "Your data",
      body: [
        "Personal data collected (birth date, time, place, and sealed question) is used solely to generate and deliver your reading. It is never shared with third parties for their own purposes. For any deletion or access request: contact@symi.io",
      ],
    },
    {
      title: "Delivery & withdrawal",
      body: [
        "The Reading is a personalized digital product delivered immediately upon generation. The right of withdrawal does not apply once the reading has been drawn.",
      ],
    },
  ],
};

export const LEGAL_PAGES: Record<LegalSlug, Record<Lang, LegalPage>> = {
  privacy: { en: privacyEn, fr: privacyEn },
  terms: {
    en: {
      title: "Terms of Service",
      intro: `These terms govern access to ${PRODUCT_NAME} at ${PRODUCT_DOMAIN}.`,
      updated,
      sections: [
        {
          title: "Service",
          body: [
            `${PRODUCT_NAME} provides personalized digital entertainment and self-discovery reports using astronomical calculations, reflective prompts, and optional AI-generated dialogue.`,
            DISCLAIMER.en,
          ],
        },
        {
          title: "No professional advice",
          body: [
            "Reports and dialogue are not medical, legal, financial, psychological, therapeutic, or professional advice.",
            "Do not rely on the service for decisions that require a qualified professional.",
          ],
        },
        {
          title: "Account and acceptable use",
          body: [
            "You are responsible for the information you enter and for using the service lawfully.",
            "Do not attempt to reverse engineer, overload, scrape, or misuse the service or its AI endpoints.",
          ],
        },
        {
          title: "Digital access and payment",
          body: [
            "When payment is enabled, the checkout page will show price, tax, refund conditions, and any immediate-access waiver before purchase.",
            "Access may be refused or suspended for fraud, abuse, payment failure, or unlawful use.",
          ],
        },
      ],
    },
    fr: {
      title: "Conditions générales d'utilisation / vente",
      intro: `Ces conditions encadrent l'accès à ${PRODUCT_NAME} sur ${PRODUCT_DOMAIN}.`,
      updated: updatedFr,
      sections: [
        {
          title: "Service",
          body: [
            `${PRODUCT_NAME} fournit des rapports numériques personnalisés de divertissement et de connaissance de soi, à partir de calculs astronomiques, de questions de réflexion et, le cas échéant, d'un dialogue généré par IA.`,
            DISCLAIMER.fr,
          ],
        },
        {
          title: "Absence de conseil professionnel",
          body: [
            "Les rapports et dialogues ne constituent pas un avis médical, juridique, financier, psychologique, thérapeutique ou professionnel.",
            "N'utilisez pas le service pour prendre une décision nécessitant l'avis d'un professionnel qualifié.",
          ],
        },
        {
          title: "Compte et usage acceptable",
          body: [
            "Vous êtes responsable des informations saisies et de votre usage du service.",
            "Il est interdit de tenter de contourner, surcharger, extraire massivement ou détourner le service et ses routes d'IA.",
          ],
        },
        {
          title: "Accès numérique et paiement",
          body: [
            "Lorsque le paiement sera activé, la page de paiement indiquera le prix, les taxes, les conditions de remboursement et toute renonciation à l'accès différé avant l'achat.",
            "L'accès peut être refusé ou suspendu en cas de fraude, d'abus, d'échec de paiement ou d'usage illicite.",
          ],
        },
      ],
    },
  },
  refund: { en: refundEn, fr: refundEn },
  notice: { en: noticeEn, fr: noticeEn },
};
