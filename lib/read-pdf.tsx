import { Document, Page, View, Text, StyleSheet, Font, Svg, Circle, Path } from "@react-pdf/renderer";

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
});

export interface PdfRead { signature: string; chart: string; pattern: string; star: string; yearAhead: string; counsel: string }
const ORDER: [string, keyof PdfRead][] = [["Signature", "signature"], ["Chart", "chart"], ["Pattern", "pattern"], ["Your star", "star"], ["Year ahead", "yearAhead"], ["Counsel", "counsel"]];

function Paras({ text }: { text: string }) {
  const ps = noLig(text || "").split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  return <>{ps.map((p, i) => (
    <Text key={i} style={s.para}>{p.split("**").map((seg, j) => (j % 2 ? <Text key={j} style={s.ill}>{seg}</Text> : seg))}</Text>
  ))}</>;
}

export function ReadingPDF({ read, question }: { read: PdfRead; question: string }) {
  return (
    <Document title="The Reading — The AstroLab" author="The AstroLab">
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>The Reading</Text>
        <Text style={s.title}>Drawn for the question you carried</Text>
        <Text style={s.asked}>You asked — <Text style={s.askedQ}>{`“${noLig(question)}”`}</Text></Text>
        <View style={s.rule} />
        {ORDER.map(([label, key]) => (
          <View key={key}>
            <Text style={s.label}>{label}</Text>
            <Paras text={read[key]} />
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
          <Text style={s.coloText}>Sealed by The AstroLab — read once</Text>
          <Text style={s.coloMark}>The AstroLab</Text>
        </View>
      </Page>
    </Document>
  );
}
