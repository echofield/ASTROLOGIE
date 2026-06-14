import { Document, Page, View, Text, StyleSheet, Font, Svg, Circle, Path } from "@react-pdf/renderer";
import { NatalWheelPdf } from "@/lib/atlas/natal-wheel-pdf";
import type { PlateData } from "@/lib/atlas/plate";

// The Reading as a keepable artifact — midnight/gold register, EB Garamond body, the
// wax-seal colophon. Server-rendered (renderToBuffer in /api/read/pdf). Left-ragged,
// editorial — not a browser print.

const F = "https://cdn.jsdelivr.net/fontsource/fonts";
Font.register({ family: "EBGaramond", fonts: [
  { src: `${F}/eb-garamond@latest/latin-400-normal.ttf` },
  { src: `${F}/eb-garamond@latest/latin-400-italic.ttf`, fontStyle: "italic" },
  { src: `${F}/eb-garamond@latest/latin-500-normal.ttf`, fontWeight: 500 },
] });
Font.register({ family: "Cormorant", fonts: [
  { src: `${F}/cormorant-garamond@latest/latin-500-normal.ttf`, fontWeight: 500 },
] });
Font.register({ family: "PlexMono", src: `${F}/ibm-plex-mono@latest/latin-400-normal.ttf` });
Font.registerHyphenationCallback((w) => [w]); // ragged right, no hyphenation

// Break the f-ligatures (fi/fl/ff) with a zero-width non-joiner — the latin-subset TTF
// drops the ligature glyphs, so without this "files" renders "fles". ZWNJ is invisible.
const noLig = (t: string) => t.replace(/f(?=[ifl])/g, "f‌");

const C = { bg: "#080d1c", ivory: "#ece4d2", ivoryDim: "#b6b1a3", gold: "#c2a25f", goldBright: "#e3c884", goldDeep: "#8a7140", slate: "#6f7894", rule: "#1e2742" };

const s = StyleSheet.create({
  page: { backgroundColor: C.bg, paddingTop: 56, paddingBottom: 64, paddingHorizontal: 60, fontFamily: "EBGaramond" },
  eyebrow: { fontFamily: "PlexMono", fontSize: 8.5, letterSpacing: 2.6, textTransform: "uppercase", color: C.gold, marginBottom: 16 },
  title: { fontFamily: "Cormorant", fontSize: 33, fontWeight: 500, color: C.ivory, marginBottom: 16, letterSpacing: 0.5 },
  asked: { fontFamily: "EBGaramond", fontStyle: "italic", fontSize: 13, color: C.slate, marginBottom: 4 },
  askedQ: { color: C.ivoryDim },
  rule: { borderBottomWidth: 1, borderBottomColor: C.rule, marginTop: 20, marginBottom: 4 },
  label: { fontFamily: "PlexMono", fontSize: 8, letterSpacing: 2.6, textTransform: "uppercase", color: C.goldDeep, marginTop: 22, marginBottom: 10 },
  para: { fontFamily: "EBGaramond", fontSize: 10.5, lineHeight: 1.62, color: C.ivoryDim, marginBottom: 8, textAlign: "left" },
  ill: { color: C.goldBright },
  colo: { marginTop: 38, paddingTop: 24, borderTopWidth: 1, borderTopColor: C.rule, alignItems: "center" },
  coloText: { fontFamily: "PlexMono", fontSize: 8, letterSpacing: 2.4, textTransform: "uppercase", color: C.slate, marginTop: 16 },
  coloMark: { fontFamily: "PlexMono", fontSize: 8.5, letterSpacing: 3.4, textTransform: "uppercase", color: C.gold, marginTop: 6 },
  // the geometry plate — the wheel the CHART section then reads aloud
  plate: { marginTop: 26, marginBottom: 4, alignItems: "center" },
  plateCapWrap: { marginTop: 14, alignItems: "center" },
  plateCap: { fontFamily: "PlexMono", fontSize: 7.5, letterSpacing: 2.2, textTransform: "uppercase", color: C.slate, marginTop: 3 },
  plateCapBright: { fontFamily: "PlexMono", fontSize: 7.5, letterSpacing: 2.2, textTransform: "uppercase", color: C.gold, marginTop: 3 },
  plateHour: { fontFamily: "EBGaramond", fontStyle: "italic", fontSize: 9.5, color: C.slate, marginTop: 8 },
});

export interface PdfRead { signature: string; chart: string; pattern: string; star: string; yearAhead: string; counsel: string }
type ReadKey = keyof PdfRead;
const KEY_ORDER: ReadKey[] = ["signature", "chart", "pattern", "star", "yearAhead", "counsel"];
// section labels per language; the paid flow passes no lang → English, unchanged
const LABELS: Record<"en" | "fr", Record<ReadKey, string>> = {
  en: { signature: "Signature", chart: "Chart", pattern: "Pattern", star: "Your star", yearAhead: "Year ahead", counsel: "Counsel" },
  fr: { signature: "Signature", chart: "Thème", pattern: "Motif", star: "Votre étoile", yearAhead: "L'année à venir", counsel: "Conseil" },
};
const COPY: Record<"en" | "fr", { eyebrow: string; title: string; asked: string; sealed: string }> = {
  en: { eyebrow: "The Reading", title: "Drawn for the question you carried", asked: "You asked", sealed: "Sealed by The AstroLab — read once" },
  fr: { eyebrow: "La Lecture", title: "Tirée pour la question que vous portiez", asked: "Vous avez demandé", sealed: "Scellé par The AstroLab — à lire une fois" },
};

function Paras({ text }: { text: string }) {
  const ps = noLig(text || "").split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  return <>{ps.map((p, i) => (
    <Text key={i} style={s.para}>{p.split("**").map((seg, j) => (j % 2 ? <Text key={j} style={s.ill}>{seg}</Text> : seg))}</Text>
  ))}</>;
}

function GeometryPlate({ plate }: { plate: PlateData }) {
  return (
    <View style={s.plate} wrap={false}>
      <Text style={s.label}>The geometry of the hour</Text>
      <NatalWheelPdf input={plate.input} width={300} />
      <View style={s.plateCapWrap}>
        <Text style={s.plateCap}>{noLig([plate.starName, plate.birthLabel].filter(Boolean).join(" — "))}</Text>
        {plate.aspectLabels.map((l, i) => <Text key={i} style={s.plateCapBright}>{noLig(l)}</Text>)}
        {plate.hourUnknown && <Text style={s.plateHour}>Hour unknown — the wheel is drawn without its horizon.</Text>}
      </View>
    </View>
  );
}

export function ReadingPDF({ read, question, plate, lang = "en" }: { read: PdfRead; question: string; plate?: PlateData | null; lang?: "en" | "fr" }) {
  const L = lang === "fr" ? "fr" : "en";
  const labels = LABELS[L];
  const copy = COPY[L];
  return (
    <Document title="The Reading — The AstroLab" author="The AstroLab">
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>{copy.eyebrow}</Text>
        <Text style={s.title}>{copy.title}</Text>
        <Text style={s.asked}>{copy.asked} — <Text style={s.askedQ}>{`“${noLig(question)}”`}</Text></Text>
        <View style={s.rule} />
        {KEY_ORDER.map((key) => (
          <View key={key}>
            <Text style={s.label}>{labels[key]}</Text>
            <Paras text={read[key]} />
            {/* the plate sits between SIGNATURE and CHART — the wheel the chart section reads aloud */}
            {key === "signature" && plate ? <GeometryPlate plate={plate} /> : null}
          </View>
        ))}
        <View style={s.colo}>
          <Svg width={50} height={50} viewBox="0 0 50 50">
            <Circle cx={25} cy={25} r={22} stroke={C.goldDeep} strokeWidth={1} fill="none" />
            <Circle cx={25} cy={25} r={15} stroke={C.gold} strokeWidth={1} fill="none" />
            <Circle cx={25} cy={19} r={8.5} stroke={C.goldBright} strokeWidth={1} fill="none" />
            <Path d="M25 7v6 M25 43v-6 M7 25h6 M43 25h-6" stroke={C.gold} strokeWidth={1} />
            <Circle cx={25} cy={25} r={1.7} fill={C.goldBright} />
          </Svg>
          <Text style={s.coloText}>{copy.sealed}</Text>
          <Text style={s.coloMark}>The AstroLab</Text>
        </View>
      </Page>
    </Document>
  );
}
