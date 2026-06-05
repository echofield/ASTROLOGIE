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

const updated = "June 5, 2026";
const updatedFr = "5 juin 2026";

export const LEGAL_PAGES: Record<LegalSlug, Record<Lang, LegalPage>> = {
  privacy: {
    en: {
      title: "Privacy Policy",
      intro: `${PRODUCT_NAME} keeps the service local-first where possible and uses only the data needed to generate and preserve your digital self-reflection report.`,
      updated,
      sections: [
        {
          title: "What we collect",
          body: [
            "Birth date, birth time, birth place, sealed intentions, saved reflections, technical identifiers, and payment status when checkout is active.",
            "Anonymous authentication may be used to preserve your profile, journal, and star ledger across sessions.",
          ],
        },
        {
          title: "How we use data",
          body: [
            "We use your data to cast the report, save your record, provide the Genius dialogue, protect the service from abuse, and process digital access when payment is available.",
            DISCLAIMER.en,
          ],
        },
        {
          title: "Processors and storage",
          body: [
            "The service may use hosting, database, analytics, payment, and AI infrastructure providers. Provider access is limited to what is needed to operate the service.",
            "Server secrets stay server-side. Public browser keys are limited to client-safe service access.",
          ],
        },
        {
          title: "Your choices",
          body: [
            "You can reset the in-app cabinet from the app. This clears local profile, journal, and star data on the device and requests deletion of the cloud copy when cloud sync is configured.",
            "For access, correction, export, or deletion requests, contact the operator at the support address published on the Legal Notice page once commercial launch details are finalized.",
          ],
        },
      ],
    },
    fr: {
      title: "Politique de confidentialité",
      intro: `${PRODUCT_NAME} privilégie un fonctionnement local lorsque c'est possible et ne traite que les données utiles à la génération et à la conservation de votre rapport numérique de réflexion personnelle.`,
      updated: updatedFr,
      sections: [
        {
          title: "Données traitées",
          body: [
            "Date, heure et lieu de naissance, intentions scellées, réflexions enregistrées, identifiants techniques et statut de paiement lorsque le paiement est activé.",
            "Une authentification anonyme peut être utilisée pour conserver votre profil, votre journal et votre registre d'étoiles entre plusieurs sessions.",
          ],
        },
        {
          title: "Finalités",
          body: [
            "Ces données servent à établir le rapport, conserver votre historique, fournir le dialogue Genius, protéger le service contre les abus et gérer l'accès numérique lorsque le paiement est disponible.",
            DISCLAIMER.fr,
          ],
        },
        {
          title: "Sous-traitants et hébergement",
          body: [
            "Le service peut utiliser des prestataires d'hébergement, de base de données, d'analyse, de paiement et d'IA. Leur accès est limité au strict nécessaire pour opérer le service.",
            "Les secrets serveur restent côté serveur. Les clés visibles dans le navigateur sont limitées à des usages compatibles avec le client.",
          ],
        },
        {
          title: "Vos choix",
          body: [
            "Vous pouvez réinitialiser le cabinet depuis l'application. Cette action efface les données locales de profil, de journal et d'étoile sur l'appareil, et demande la suppression de la copie cloud lorsque la synchronisation est configurée.",
            "Pour toute demande d'accès, de rectification, d'export ou de suppression, contactez l'opérateur à l'adresse indiquée dans les Mentions légales lorsque les informations de lancement commercial seront finalisées.",
          ],
        },
      ],
    },
  },
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
  refund: {
    en: {
      title: "Refund Policy",
      intro: `${PRODUCT_NAME} sells digital access when checkout is active. Refund terms are shown before purchase.`,
      updated,
      sections: [
        {
          title: "Before digital delivery",
          body: [
            "If paid access is available and the digital report has not been generated or accessed, you may request cancellation and refund according to the checkout terms shown at purchase.",
          ],
        },
        {
          title: "After immediate access",
          body: [
            "For digital content delivered immediately, refund rights may depend on the consent and waiver shown at checkout, applicable consumer law, and whether the content has already been generated or accessed.",
            "This does not limit mandatory consumer rights for faulty or unavailable digital services.",
          ],
        },
        {
          title: "How to request support",
          body: [
            "Use the support contact published on the Legal Notice page once commercial launch details are finalized. Include purchase email, order ID, and a short description of the issue.",
          ],
        },
      ],
    },
    fr: {
      title: "Politique de remboursement",
      intro: `${PRODUCT_NAME} vend un accès numérique lorsque le paiement est activé. Les conditions de remboursement sont affichées avant l'achat.`,
      updated: updatedFr,
      sections: [
        {
          title: "Avant livraison numérique",
          body: [
            "Si l'accès payant est disponible et que le rapport numérique n'a pas été généré ou consulté, vous pouvez demander une annulation et un remboursement selon les conditions indiquées au moment de l'achat.",
          ],
        },
        {
          title: "Après accès immédiat",
          body: [
            "Pour un contenu numérique fourni immédiatement, le droit au remboursement peut dépendre du consentement et de la renonciation présentés lors du paiement, du droit applicable et du fait que le contenu ait déjà été généré ou consulté.",
            "Cette politique ne limite pas les droits impératifs des consommateurs en cas de service numérique défectueux ou indisponible.",
          ],
        },
        {
          title: "Demande d'assistance",
          body: [
            "Utilisez le contact support indiqué dans les Mentions légales lorsque les informations de lancement commercial seront finalisées. Ajoutez l'adresse email d'achat, le numéro de commande et une brève description du problème.",
          ],
        },
      ],
    },
  },
  notice: {
    en: {
      title: "Legal Notice",
      intro: `Legal and publisher information for ${PRODUCT_NAME}.`,
      updated,
      sections: [
        {
          title: "Publisher",
          body: [
            `${PRODUCT_NAME} is available at ${PRODUCT_DOMAIN}.`,
            "Publisher/operator legal identity, registered address, registration number, VAT number if applicable, and support email must be completed before commercial launch.",
          ],
        },
        {
          title: "Hosting",
          body: [
            "Hosting provider details must be completed before commercial launch. The production deployment is expected to run on Vercel unless changed by the operator.",
          ],
        },
        {
          title: "Intellectual property",
          body: [
            "The product name, interface, copy, reports, code, and visual design are protected unless otherwise stated.",
            "Users keep responsibility for the personal text they enter into the service.",
          ],
        },
        {
          title: "Purpose limitation",
          body: [
            DISCLAIMER.en,
            "The service does not provide regulated advice and does not replace a qualified professional.",
          ],
        },
      ],
    },
    fr: {
      title: "Mentions légales",
      intro: `Informations légales et éditoriales relatives à ${PRODUCT_NAME}.`,
      updated: updatedFr,
      sections: [
        {
          title: "Éditeur",
          body: [
            `${PRODUCT_NAME} est disponible à l'adresse ${PRODUCT_DOMAIN}.`,
            "L'identité légale de l'éditeur/opérateur, l'adresse du siège, le numéro d'immatriculation, le numéro de TVA le cas échéant et l'email de support doivent être complétés avant le lancement commercial.",
          ],
        },
        {
          title: "Hébergement",
          body: [
            "Les informations relatives à l'hébergeur doivent être complétées avant le lancement commercial. Le déploiement de production est prévu sur Vercel sauf modification par l'opérateur.",
          ],
        },
        {
          title: "Propriété intellectuelle",
          body: [
            "Le nom du produit, l'interface, les textes, les rapports, le code et le design sont protégés sauf mention contraire.",
            "Les utilisateurs restent responsables des textes personnels qu'ils saisissent dans le service.",
          ],
        },
        {
          title: "Limite d'usage",
          body: [
            DISCLAIMER.fr,
            "Le service ne fournit pas de conseil réglementé et ne remplace pas un professionnel qualifié.",
          ],
        },
      ],
    },
  },
};
