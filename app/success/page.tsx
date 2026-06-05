import Link from "next/link";
import { DISCLAIMER, LANG_LABEL, PRODUCT_NAME, type Lang } from "@/lib/brand";
import { FD, FN, FT, NIGHT } from "@/lib/theme";

const COPY = {
  en: {
    cap: "Payment received",
    title: "Your sky is yours.",
    body: "The Founding Pass is confirmed. Open the instrument: cast your sky, seal a star, and let the daily Genius keep you honest.",
    cta: "Enter the instrument",
    note: "A receipt has been sent by Stripe. If access does not appear, it will be granted shortly.",
  },
  fr: {
    cap: "Paiement reçu",
    title: "Votre ciel est à vous.",
    body: "Le Pass Fondateur est confirmé. Ouvrez l'instrument : tracez votre ciel, scellez une étoile, et laissez le Genius quotidien vous garder honnête.",
    cta: "Entrer dans l'instrument",
    note: "Un reçu a été envoyé par Stripe. Si l'accès n'apparaît pas, il sera accordé sous peu.",
  },
} satisfies Record<Lang, Record<string, string>>;

function asLang(value: string | string[] | undefined): Lang {
  return value === "fr" ? "fr" : "en";
}

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }) {
  const lang = asLang((await searchParams).lang);
  const altLang: Lang = lang === "en" ? "fr" : "en";
  const t = COPY[lang];
  const pal = NIGHT;
  return (
    <main style={{ minHeight: "100svh", background: pal.bg, color: pal.ink, fontFamily: FT, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 22px" }}>
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <Link href={`/success?lang=${altLang}`} style={{ color: pal.accent, border: `1px solid ${pal.panelLine}`, borderRadius: 18, padding: "6px 12px", textDecoration: "none", fontFamily: FN, fontSize: 12 }}>{LANG_LABEL[altLang]}</Link>
        </div>
        <div style={{ fontFamily: FT, letterSpacing: 3, textTransform: "uppercase", fontSize: 11, color: pal.brass }}>{t.cap}</div>
        <h1 style={{ fontFamily: FD, fontStyle: "italic", fontSize: 44, lineHeight: 1.05, margin: "12px 0 16px", fontWeight: 500 }}>{t.title}</h1>
        <p style={{ color: pal.inkSoft, fontSize: 16, lineHeight: 1.6, margin: 0 }}>{t.body}</p>
        <Link href="/" style={{ display: "inline-flex", marginTop: 26, padding: "14px 36px", borderRadius: 30, background: pal.accent, color: pal.btnInk, textDecoration: "none", fontFamily: FT, fontWeight: 500, letterSpacing: 3, textTransform: "uppercase", fontSize: 12 }}>{t.cta}</Link>
        <p style={{ color: pal.inkSoft, fontSize: 12, lineHeight: 1.5, margin: "22px 0 0" }}>{t.note}</p>
        <p style={{ color: pal.inkSoft, fontSize: 11, lineHeight: 1.5, margin: "10px 0 0", opacity: 0.7 }}>{DISCLAIMER[lang]} · {PRODUCT_NAME}</p>
      </div>
    </main>
  );
}
