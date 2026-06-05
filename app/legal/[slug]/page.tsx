import Link from "next/link";
import { notFound } from "next/navigation";
import { DISCLAIMER, LANG_LABEL, LEGAL_LINKS, PRODUCT_DOMAIN, PRODUCT_NAME, type Lang, type LegalSlug } from "@/lib/brand";
import { LEGAL_PAGES } from "@/lib/legal";
import { FD, FN, FT, NIGHT } from "@/lib/theme";

const slugs = LEGAL_LINKS.map((l) => l.slug);

export function generateStaticParams() {
  return slugs.map((slug) => ({ slug }));
}

function asLang(value: string | string[] | undefined): Lang {
  return value === "fr" ? "fr" : "en";
}

function asSlug(value: string): LegalSlug | null {
  return slugs.includes(value as LegalSlug) ? (value as LegalSlug) : null;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = asSlug(rawSlug);
  if (!slug) return {};
  const lang = asLang((await searchParams).lang);
  const page = LEGAL_PAGES[slug][lang];
  return {
    title: `${page.title} | ${PRODUCT_NAME}`,
    description: page.intro,
  };
}

export default async function LegalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = asSlug(rawSlug);
  if (!slug) notFound();

  const lang = asLang((await searchParams).lang);
  const altLang: Lang = lang === "en" ? "fr" : "en";
  const page = LEGAL_PAGES[slug][lang];
  const pal = NIGHT;

  return (
    <main style={{
      minHeight: "100svh",
      background: pal.bg,
      color: pal.ink,
      fontFamily: FT,
      padding: "32px 22px 44px",
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", marginBottom: 44 }}>
          <Link href="/" style={{ color: pal.ink, textDecoration: "none", fontFamily: FD, fontSize: 22 }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 7, background: pal.brass, marginRight: 9 }} />
            {PRODUCT_NAME}
          </Link>
          <Link
            href={`/legal/${slug}?lang=${altLang}`}
            style={{
              color: pal.accent,
              border: `1px solid ${pal.panelLine}`,
              borderRadius: 18,
              padding: "7px 12px",
              textDecoration: "none",
              fontFamily: FN,
              fontSize: 12,
            }}
          >
            {LANG_LABEL[altLang]}
          </Link>
        </header>

        <section style={{ borderBottom: `1px solid ${pal.panelLine}`, paddingBottom: 26, marginBottom: 28 }}>
          <div style={{ fontFamily: FT, letterSpacing: 3, textTransform: "uppercase", fontSize: 11, color: pal.brass }}>
            {lang === "fr" ? "Dernière mise à jour" : "Last updated"} · {page.updated}
          </div>
          <h1 style={{ fontFamily: FD, fontStyle: "italic", fontSize: 48, lineHeight: 1, margin: "14px 0 12px", fontWeight: 500 }}>
            {page.title}
          </h1>
          <p style={{ color: pal.inkSoft, fontSize: 16, lineHeight: 1.55, maxWidth: 720, margin: 0 }}>
            {page.intro}
          </p>
          <p style={{ color: pal.accent, fontSize: 14, lineHeight: 1.45, maxWidth: 720, margin: "16px 0 0" }}>
            {DISCLAIMER[lang]}
          </p>
        </section>

        <div style={{ display: "grid", gap: 24 }}>
          {page.sections.map((section) => (
            <section key={section.title} style={{ background: pal.panel, border: `1px solid ${pal.panelLine}`, borderRadius: 4, padding: "20px 22px" }}>
              <h2 style={{ fontFamily: FD, fontStyle: "italic", fontSize: 26, lineHeight: 1.1, margin: 0, fontWeight: 500 }}>
                {section.title}
              </h2>
              {section.body.map((p) => (
                <p key={p} style={{ color: pal.inkSoft, fontSize: 15, lineHeight: 1.6, margin: "12px 0 0" }}>{p}</p>
              ))}
            </section>
          ))}
        </div>

        <footer style={{ marginTop: 36, paddingTop: 22, borderTop: `1px solid ${pal.panelLine}`, display: "flex", flexWrap: "wrap", gap: "10px 18px", alignItems: "center", color: pal.inkSoft }}>
          <span style={{ fontFamily: FN, fontSize: 12 }}>{PRODUCT_DOMAIN}</span>
          {LEGAL_LINKS.map((link) => (
            <Link key={link.slug} href={`/legal/${link.slug}?lang=${lang}`} style={{ color: link.slug === slug ? pal.accent : pal.inkSoft, fontFamily: FN, fontSize: 12, textDecoration: "none" }}>
              {link.label[lang]}
            </Link>
          ))}
        </footer>
      </div>
    </main>
  );
}
