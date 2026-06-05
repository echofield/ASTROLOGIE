import Link from "next/link";
import { DISCLAIMER, LANG_LABEL, PRODUCT_NAME, type Lang } from "@/lib/brand";
import { FD, FN, FT, NIGHT } from "@/lib/theme";
import SuccessAccessForm from "./SuccessAccessForm";

const COPY = {
  en: {
    cap: "Payment received",
    title: "Your sky is yours.",
    body: "The Founding Pass is confirmed. Confirm the email you paid with to unlock your Complete Read.",
    cta: "Enter the instrument",
    note: "A receipt has been sent by Stripe. If access does not appear, it will be granted shortly.",
    emailLabel: "Confirm the email you paid with",
    emailPlaceholder: "you@example.com",
    confirm: "Unlock my read",
    denied: "No payment found for this email. Try again or contact support.",
    skip: "Enter without the read →",
  },
  fr: {
    cap: "Paiement reçu",
    title: "Votre ciel est à vous.",
    body: "Le Pass Fondateur est confirmé. Confirmez l'e-mail utilisé pour le paiement afin de débloquer votre Lecture Complète.",
    cta: "Entrer dans l'instrument",
    note: "Un reçu a été envoyé par Stripe. Si l'accès n'apparaît pas, il sera accordé sous peu.",
    emailLabel: "Confirmez l'e-mail utilisé pour le paiement",
    emailPlaceholder: "vous@exemple.com",
    confirm: "Débloquer ma lecture",
    denied: "Aucun paiement trouvé pour cet e-mail. Réessayez ou contactez le support.",
    skip: "Entrer sans la lecture →",
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
        <SuccessAccessForm pal={pal} lang={lang} copy={{
          emailLabel: t.emailLabel,
          emailPlaceholder: t.emailPlaceholder,
          confirm: t.confirm,
          denied: t.denied,
          skip: t.skip,
        }} />
        <p style={{ color: pal.inkSoft, fontSize: 12, lineHeight: 1.5, margin: "22px 0 0" }}>{t.note}</p>
        <p style={{ color: pal.inkSoft, fontSize: 11, lineHeight: 1.5, margin: "10px 0 0", opacity: 0.7 }}>{DISCLAIMER[lang]} · {PRODUCT_NAME}</p>
      </div>
    </main>
  );
}
