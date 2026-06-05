import Link from "next/link";
import { DISCLAIMER, LANG_LABEL, LEGAL_LINKS, PRODUCT_DOMAIN, PRODUCT_NAME, type Lang } from "@/lib/brand";
import { FD, FN, FT, NIGHT } from "@/lib/theme";

const COPY = {
  en: {
    title: "Digital report access",
    cap: "Checkout readiness",
    intro: "Payment is not active in this build. Before checkout is enabled, this page defines the customer-facing information that must be visible.",
    price: "Price and taxes",
    priceBody: "The final checkout must show the report price, applicable taxes, currency, and billing frequency before payment.",
    delivery: "Immediate digital delivery",
    deliveryBody: "The checkout must state when the personalized report is generated and whether immediate access affects withdrawal or refund rights.",
    refund: "Refund terms",
    refundBody: "Refund conditions must be visible before purchase and must link to the Refund Policy.",
    disclaimer: DISCLAIMER.en,
    back: "Return to the instrument",
  },
  fr: {
    title: "Accès au rapport numérique",
    cap: "Préparation du paiement",
    intro: "Le paiement n'est pas actif dans cette version. Avant activation, cette page définit les informations qui devront être visibles pour le client.",
    price: "Prix et taxes",
    priceBody: "Le paiement final devra afficher le prix du rapport, les taxes applicables, la devise et toute récurrence éventuelle avant validation.",
    delivery: "Livraison numérique immédiate",
    deliveryBody: "Le paiement devra préciser quand le rapport personnalisé est généré et si l'accès immédiat affecte le droit de rétractation ou le remboursement.",
    refund: "Conditions de remboursement",
    refundBody: "Les conditions de remboursement devront être visibles avant l'achat et renvoyer vers la Politique de remboursement.",
    disclaimer: DISCLAIMER.fr,
    back: "Retour à l'instrument",
  },
} satisfies Record<Lang, Record<string, string>>;

function asLang(value: string | string[] | undefined): Lang {
  return value === "fr" ? "fr" : "en";
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }) {
  const lang = asLang((await searchParams).lang);
  const t = COPY[lang];
  return {
    title: `${t.title} | ${PRODUCT_NAME}`,
    description: t.intro,
  };
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }) {
  const lang = asLang((await searchParams).lang);
  const altLang: Lang = lang === "en" ? "fr" : "en";
  const t = COPY[lang];
  const pal = NIGHT;
  const sections = [
    [t.price, t.priceBody],
    [t.delivery, t.deliveryBody],
    [t.refund, t.refundBody],
  ];

  return (
    <main style={{ minHeight: "100svh", background: pal.bg, color: pal.ink, fontFamily: FT, padding: "32px 22px 44px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", marginBottom: 44 }}>
          <Link href="/" style={{ color: pal.ink, textDecoration: "none", fontFamily: FD, fontSize: 22 }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 7, background: pal.brass, marginRight: 9 }} />
            {PRODUCT_NAME}
          </Link>
          <Link href={`/checkout?lang=${altLang}`} style={{ color: pal.accent, border: `1px solid ${pal.panelLine}`, borderRadius: 18, padding: "7px 12px", textDecoration: "none", fontFamily: FN, fontSize: 12 }}>
            {LANG_LABEL[altLang]}
          </Link>
        </header>

        <section style={{ borderBottom: `1px solid ${pal.panelLine}`, paddingBottom: 26, marginBottom: 28 }}>
          <div style={{ fontFamily: FT, letterSpacing: 3, textTransform: "uppercase", fontSize: 11, color: pal.brass }}>{t.cap}</div>
          <h1 style={{ fontFamily: FD, fontStyle: "italic", fontSize: 48, lineHeight: 1, margin: "14px 0 12px", fontWeight: 500 }}>{t.title}</h1>
          <p style={{ color: pal.inkSoft, fontSize: 16, lineHeight: 1.55, maxWidth: 720, margin: 0 }}>{t.intro}</p>
          <p style={{ color: pal.accent, fontSize: 14, lineHeight: 1.45, maxWidth: 720, margin: "16px 0 0" }}>{t.disclaimer}</p>
        </section>

        <div style={{ display: "grid", gap: 18 }}>
          {sections.map(([title, body]) => (
            <section key={title} style={{ background: pal.panel, border: `1px solid ${pal.panelLine}`, borderRadius: 4, padding: "20px 22px" }}>
              <h2 style={{ fontFamily: FD, fontStyle: "italic", fontSize: 26, lineHeight: 1.1, margin: 0, fontWeight: 500 }}>{title}</h2>
              <p style={{ color: pal.inkSoft, fontSize: 15, lineHeight: 1.6, margin: "12px 0 0" }}>{body}</p>
            </section>
          ))}
        </div>

        <footer style={{ marginTop: 36, paddingTop: 22, borderTop: `1px solid ${pal.panelLine}`, display: "flex", flexWrap: "wrap", gap: "10px 18px", alignItems: "center", color: pal.inkSoft }}>
          <Link href="/" style={{ color: pal.accent, fontFamily: FN, fontSize: 12, textDecoration: "none" }}>{t.back}</Link>
          <span style={{ fontFamily: FN, fontSize: 12 }}>{PRODUCT_DOMAIN}</span>
          {LEGAL_LINKS.map((link) => (
            <Link key={link.slug} href={`/legal/${link.slug}?lang=${lang}`} style={{ color: pal.inkSoft, fontFamily: FN, fontSize: 12, textDecoration: "none" }}>
              {link.label[lang]}
            </Link>
          ))}
        </footer>
      </div>
    </main>
  );
}
