"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject, type ReactNode } from "react";
import IntakeForm from "@/components/read/IntakeForm";
import ReadArtifact from "@/components/read/ReadArtifact";
import CastingScreen from "@/components/read/CastingScreen";
import ReadReveal from "@/components/read/ReadReveal";
import { buildPlate } from "@/lib/atlas/plate";
import SkyWheel from "@/components/sky/SkyWheel";
import PlanetMedallion from "@/components/sky/PlanetMedallion";
import StarField from "@/components/sky/StarField";
import DayRecord from "@/components/atlas/DayRecord";
import Header from "@/components/atlas/Header";
import AtlasChrome from "@/components/atlas/AtlasChrome";
import AtlasCalendar from "@/components/atlas/AtlasCalendar";
import { Cap, Btn, StatusBar, ModeToggle, TabBar, type TabId } from "@/components/sky/chrome";
import { useParallax, useSlowRotation, useSkyClock, useMediaQuery } from "@/components/sky/hooks";
import { NIGHT, DAY, type Palette, FD, FT, FG, FN } from "@/lib/theme";
import {
  displaySky, signOf, degStr, shortPos, SIGN_NAME, PLANETS, PLANET_GLYPH, PLANET_NAME, type LonMap,
} from "@/lib/chart";
import { ascendant } from "@/lib/ascendant";
import { natalChart } from "@/lib/sky";
import { makeStar, reachOf, type SealedStar } from "@/lib/star";
import { archetypeForStar, geniusLine, geniusPhase } from "@/lib/archetypes";
import {
  askGenius, appendMessage, loadMessages, journalEntries, remainingExchanges, DAILY_EXCHANGE_LIMIT,
} from "@/lib/dialogue";
import type { ChatMessage } from "@/lib/llm/types";
import {
  getProfile, saveProfile, getStar, saveStar, getStarLedger, saveStarLedger, recordStar, resetAll,
  getRead, saveRead, type Profile, type CompleteRead,
} from "@/lib/storage";
import { pull as cloudPull, push as cloudPush, wipe as cloudWipe, pullRead as cloudPullRead, pushRead as cloudPushRead, userId as cloudUserId } from "@/lib/cloud";
import { logEvent } from "@/lib/atlas/events";
import {
  DEFAULT_LANG, DISCLAIMER, LANG_LABEL, LEGAL_LINKS, PRICING, PRODUCT_NAME, type Lang,
} from "@/lib/brand";

type Screen = "cabinet" | "theme" | "star" | "genius" | "calendar";
const SCREENS: Screen[] = ["cabinet", "theme", "star", "genius"];

const COPY = {
  en: {
    titles: { cabinet: "Cabinet", theme: "Your Theme", star: "Your Star", genius: "Your Genius", calendar: "Calendar" },
    tabs: { cabinet: "Cabinet", theme: "Theme", star: "Star", genius: "Genius", calendar: "Calendar" },
    mode: { night: "Observatory", day: "Cabinet", toggle: "Day / Night" },
    onboarding: {
      cap: "Your fixed sky",
      title: "When did you begin?",
      intro: "Your birth moment fixes the sky you carry. Cast it once.",
      birthDate: "Date of birth",
      birthTime: "Time of birth",
      birthPlace: "City of birth",
      birthPlacePlaceholder: "Paris",
      cast: "Cast the sky",
    },
    ritual: {
      questionCap: "One question",
      question: "What must happen?",
      questionPlaceholder: "Send the proposal before Friday.",
      nameCap: "Name it",
      namePlaceholder: "FRIDAY PROPOSAL",
      irreversible: "This cannot be undone tonight",
      seal: "Seal it",
      starStands: "A star now stands in your sky",
      enter: "Enter",
      continue: "Continue",
      sign: "Sign",
      degree: "Degree",
      house: "House",
      ruler: "Ruler",
    },
    cabinet: {
      todaySky: "Today's sky",
      moonFrom: (headline: string, name: string) => `${name} draws closer — ${headline} away.`,
      moonSun: "Sun",
      journal: "Genius journal",
      saved: (n: number) => `${n} saved`,
      emptyJournal: "No reflection saved yet. Ask the Genius, and the answer will be kept here.",
      ledger: "Star ledger",
      ledgerScale: "sealed / approaching / reached / kept",
      sealStar: "Seal a star",
      close: "close the cabinet",
      closeConfirm: "Close the cabinet? This clears your sky, journal, and star ledger.",
      checkoutTitle: "Digital report access",
      checkoutBody: "Checkout will show price, tax, refund terms, and immediate-access consent before payment is accepted.",
      checkoutLink: "View checkout terms",
    },
    status: {
      kept: "kept",
      keptDetail: "kept in the cabinet",
      reached: "reached",
      reachedDetail: "the Moon stands on it",
      approaching: "approaching",
      toGo: (gap: string) => `${gap} deg to go`,
      sealed: "sealed",
      sealedAt: (time: string) => `sealed at ${time}`,
      undated: "undated",
    },
    completeRead: {
      cta: `The Reading — ${PRICING.offer}${PRICING.currency}`,
    },
    intake: {
      cap: "Before your read",
      title: "Three questions, in your own words.",
      season: "What season of life are you in?",
      repeating: "What keeps repeating?",
      afraid: "What are you afraid to want?",
      submit: "Generate my read",
      generating: "Writing your read…",
      error: "The sky didn't answer this time. Try again, or write to us at contact@symi.io.",
    },
    read: {
      signature: "Signature",
      chart: "Chart",
      pattern: "Pattern",
      star: "Your star",
      yearAhead: "Year ahead",
      counsel: "Counsel",
      savePdf: "Save as PDF",
    },
    theme: {
      bigThree: (sun: string, moon: string, rising?: string) =>
        rising ? `Sun in ${sun} · Moon in ${moon} · Rising ${rising}` : `Sun in ${sun} · Moon in ${moon}`,
      signNames: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
      touchSign: "Touch a sign for its constellation",
      bornUnder: "this is the sky you were born under.",
      read: {
        sun: "How you shine, and what you cannot help but become.",
        moon: "What you feel deeply, without always showing it.",
        mercury: "How your mind moves, and the voice it reaches for.",
        venus: "What you are drawn toward, and how you love.",
        mars: "What you burn for, and how you go after it.",
        jupiter: "Where the world opens generously for you.",
        saturn: "The work that is yours, and yours alone, to do.",
        uranus: "Where you refuse to be like anyone else.",
        neptune: "What you long for past the edge of the visible.",
        pluto: "What in you must end so something truer can begin.",
      },
    },
    star: {
      in: "in",
      moonWillReach: "the Moon will reach",
      advance: "Advance the sky",
      today: "today",
      toGo: "to go",
      darkCap: "Your sky is still dark",
      darkBody: "A star may be named, when something becomes necessary.",
      keep: "Keep this star",
      keptOn: "Kept on",
    },
    genius: {
      heldBy: "held by the",
      today: "today",
      record: "The day's record",
      keep: "keep this line",
      emptyRecord: "Nothing kept yet today. Leave the first line.",
      awaiting: "Awaiting your star",
      closed: "The Genius is closed till tomorrow.",
      wake: "Seal a star, and I will wake.",
      placeholder: "what moves in you tonight…",
      closedPlaceholder: "closed till tomorrow",
      reflect: "Reflect",
      listening: "listening…",
      closedButton: "Closed",
      fallback: "I hold your star in view. Stay with the question; the sky is slow, and so is what matters.",
    },
    loading: "Preparing your sky.",
  },
  fr: {
    titles: { cabinet: "Cabinet", theme: "Votre thème", star: "Votre étoile", genius: "Votre Genius", calendar: "Calendrier" },
    tabs: { cabinet: "Cabinet", theme: "Thème", star: "Étoile", genius: "Genius", calendar: "Calendrier" },
    mode: { night: "Observatoire", day: "Cabinet", toggle: "Jour / Nuit" },
    onboarding: {
      cap: "Votre ciel fixe",
      title: "Quand avez-vous commencé ?",
      intro: "Votre moment de naissance fixe le ciel que vous portez. Calculez-le une seule fois.",
      birthDate: "Date de naissance",
      birthTime: "Heure de naissance",
      birthPlace: "Ville de naissance",
      birthPlacePlaceholder: "Paris",
      cast: "Calculer le ciel",
    },
    ritual: {
      questionCap: "Une question",
      question: "Qu'est-ce qui doit arriver ?",
      questionPlaceholder: "Envoyer la proposition avant vendredi.",
      nameCap: "Nommez-le",
      namePlaceholder: "PROPOSITION",
      irreversible: "Ce geste ne peut pas être défait ce soir",
      seal: "Sceller",
      starStands: "Une étoile se tient maintenant dans votre ciel",
      enter: "Entrer",
      continue: "Continuer",
      sign: "Signe",
      degree: "Degré",
      house: "Maison",
      ruler: "Maître",
    },
    cabinet: {
      todaySky: "Ciel du jour",
      moonFrom: (headline: string, name: string) => `${name} se rapproche — encore ${headline}.`,
      moonSun: "Soleil",
      journal: "Journal Genius",
      saved: (n: number) => `${n} enregistré${n > 1 ? "s" : ""}`,
      emptyJournal: "Aucune réflexion enregistrée. Interrogez Genius, et la réponse sera conservée ici.",
      ledger: "Registre des étoiles",
      ledgerScale: "scellée / approche / atteinte / gardée",
      sealStar: "Sceller une étoile",
      close: "fermer le cabinet",
      closeConfirm: "Fermer le cabinet ? Cela efface votre ciel, votre journal et votre registre d'étoiles.",
      checkoutTitle: "Accès au rapport numérique",
      checkoutBody: "Le paiement affichera le prix, les taxes, les conditions de remboursement et le consentement à l'accès immédiat avant toute validation.",
      checkoutLink: "Voir les conditions de paiement",
    },
    status: {
      kept: "gardée",
      keptDetail: "gardée dans le cabinet",
      reached: "atteinte",
      reachedDetail: "la Lune se tient dessus",
      approaching: "approche",
      toGo: (gap: string) => `${gap} deg restants`,
      sealed: "scellée",
      sealedAt: (time: string) => `scellée à ${time}`,
      undated: "sans date",
    },
    completeRead: {
      cta: `La Lecture — ${PRICING.offer}${PRICING.currency}`,
    },
    intake: {
      cap: "Avant votre lecture",
      title: "Trois questions, dans vos propres mots.",
      season: "Dans quelle saison de vie êtes-vous ?",
      repeating: "Qu'est-ce qui revient sans cesse ?",
      afraid: "Qu'avez-vous peur de vouloir ?",
      submit: "Générer ma lecture",
      generating: "Rédaction de votre lecture…",
      error: "Le ciel n'a pas répondu cette fois. Réessayez, ou écrivez-nous à contact@symi.io.",
    },
    read: {
      signature: "Signature",
      chart: "Thème",
      pattern: "Motif",
      star: "Votre étoile",
      yearAhead: "L'année à venir",
      counsel: "Conseil",
      savePdf: "Enregistrer en PDF",
    },
    theme: {
      bigThree: (sun: string, moon: string, rising?: string) =>
        rising ? `Soleil en ${sun} · Lune en ${moon} · Ascendant ${rising}` : `Soleil en ${sun} · Lune en ${moon}`,
      signNames: ["Bélier", "Taureau", "Gémeaux", "Cancer", "Lion", "Vierge", "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"],
      touchSign: "Touchez un signe pour voir sa constellation",
      bornUnder: "voici le ciel sous lequel vous êtes né.",
      read: {
        sun: "Votre manière de rayonner et ce que vous ne pouvez pas éviter de devenir.",
        moon: "Ce que vous ressentez profondément, même lorsque vous ne le montrez pas.",
        mercury: "La façon dont votre esprit se déplace et la voix qu'il cherche.",
        venus: "Ce qui vous attire et la manière dont vous aimez.",
        mars: "Ce qui vous met en mouvement et la force avec laquelle vous agissez.",
        jupiter: "L'endroit où le monde s'ouvre avec le plus de générosité.",
        saturn: "Le travail qui vous appartient, à vous seul, d'accomplir.",
        uranus: "L'endroit où vous refusez d'être interchangeable.",
        neptune: "Ce que vous cherchez au-delà de ce qui est visible.",
        pluto: "Ce qui doit finir en vous pour qu'une forme plus juste commence.",
      },
    },
    star: {
      in: "dans",
      moonWillReach: "la Lune rejoindra",
      advance: "Avancer le ciel",
      today: "aujourd'hui",
      toGo: "restants",
      darkCap: "Votre ciel est encore sombre",
      darkBody: "Une étoile peut être nommée lorsqu'une chose devient nécessaire.",
      keep: "Garder cette étoile",
      keptOn: "Gardée le",
    },
    genius: {
      heldBy: "tenu par le",
      today: "aujourd'hui",
      record: "Le registre du jour",
      keep: "garder cette ligne",
      emptyRecord: "Rien de gardé aujourd'hui. Laissez la première ligne.",
      awaiting: "En attente de votre étoile",
      closed: "Genius est fermé jusqu'à demain.",
      wake: "Scellez une étoile, et je m'éveillerai.",
      placeholder: "ce qui bouge en vous ce soir…",
      closedPlaceholder: "fermé jusqu'à demain",
      reflect: "Réfléchir",
      listening: "écoute…",
      closedButton: "Fermé",
      fallback: "Je garde votre étoile en vue. Restez avec la question ; le ciel est lent, et ce qui compte l'est aussi.",
    },
    loading: "Préparation de votre ciel.",
  },
} satisfies Record<Lang, {
  titles: Record<Screen, string>;
  tabs: Record<Screen, string>;
  mode: { night: string; day: string; toggle: string };
  onboarding: Record<string, string>;
  ritual: Record<string, string>;
  cabinet: {
    todaySky: string; moonFrom: (gap: string, name: string) => string; moonSun: string; journal: string; saved: (n: number) => string;
    emptyJournal: string; ledger: string; ledgerScale: string; sealStar: string; close: string; closeConfirm: string; checkoutTitle: string; checkoutBody: string; checkoutLink: string;
  };
  status: {
    kept: string; keptDetail: string; reached: string; reachedDetail: string; approaching: string; toGo: (gap: string) => string; sealed: string; sealedAt: (time: string) => string; undated: string;
  };
  completeRead: { cta: string };
  intake: Record<string, string>;
  read: Record<string, string>;
  theme: { bigThree: (sun: string, moon: string, rising?: string) => string; signNames: string[]; touchSign: string; bornUnder: string; read: Record<string, string> };
  star: Record<string, string>;
  genius: Record<string, string>;
  loading: string;
}>;

type DisplayPlanetKey = keyof typeof COPY.en.theme.read;

const TAB_ICON: Record<Screen, string> = { cabinet: "⌂", theme: "◉", star: "★", genius: "◎", calendar: "☾" };
const DAY_MS = 24 * 60 * 60 * 1000;

function recordDate(iso: string | undefined, lang: Lang, fallback: string): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "2-digit", month: "short" });
}

function recordTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function ledgerStatus(star: SealedStar, date: Date, lang: Lang): { label: string; stamp: string; detail: string } {
  const c = COPY[lang].status;
  if (star.fulfilledAt) {
    return { label: c.kept, stamp: recordDate(star.fulfilledAt, lang, c.undated), detail: c.keptDetail };
  }
  const reach = reachOf(star, date);
  if (reach.gap <= 3 || reach.gap >= 357) {
    return { label: c.reached, stamp: recordDate(date.toISOString(), lang, c.undated), detail: c.reachedDetail };
  }
  if (reach.gap <= 30) {
    const arrival = new Date(date.getTime() + reach.days * DAY_MS).toISOString();
    return { label: c.approaching, stamp: recordDate(arrival, lang, c.undated), detail: c.toGo(reach.gap.toFixed(1)) };
  }
  return { label: c.sealed, stamp: recordDate(star.sealedAt, lang, c.undated), detail: c.sealedAt(recordTime(star.sealedAt)) };
}

function localGeniusLine(lang: Lang, star: SealedStar, reach: ReturnType<typeof reachOf>, fulfilled: boolean): string {
  if (lang === "en") return geniusLine(star, reach, fulfilled);
  const phase = geniusPhase(reach, fulfilled);
  if (phase === "kept") return `${star.name} est gardée dans votre ciel.`;
  if (phase === "arrived") return `La Lune rejoint ${star.name}. Le moment est ouvert.`;
  if (phase === "near") return `La Lune approche ${star.name}. Restez avec ce qui doit arriver.`;
  return `Genius observe ${star.name}. La distance se referme lentement.`;
}

function SkyBg({ pal, night, par }: { pal: Palette; night: boolean; par: { x: number; y: number } }) {
  if (!night) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <StarField pal={pal} layer={1} par={par} />
      <StarField pal={pal} layer={2} par={par} />
    </div>
  );
}

function LangSwitch({ pal, lang, onLang }: { pal: Palette; lang: Lang; onLang: (lang: Lang) => void }) {
  return (
    <div style={{ display: "flex", border: `1px solid ${pal.panelLine}`, borderRadius: 16, overflow: "hidden", flexShrink: 0 }}>
      {(["en", "fr"] as Lang[]).map((l) => {
        const on = l === lang;
        return (
          <button key={l} onClick={() => onLang(l)} style={{
            appearance: "none", border: "none", cursor: "pointer", padding: "5px 8px",
            background: on ? pal.accent : "transparent", color: on ? pal.btnInk : pal.inkSoft,
            fontFamily: FN, fontSize: 10.5,
          }}>
            {LANG_LABEL[l]}
          </button>
        );
      })}
    </div>
  );
}

function LegalFooter({ pal, lang, compact = false }: { pal: Palette; lang: Lang; compact?: boolean }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: compact ? "5px 10px" : "7px 14px", color: pal.inkSoft }}>
      {LEGAL_LINKS.map((link) => (
        <Link key={link.slug} href={`/legal/${link.slug}?lang=${lang}`} style={{
          color: pal.inkSoft, fontFamily: FN, fontSize: compact ? 9.5 : 11, textDecoration: "none",
        }}>
          {link.label[lang]}
        </Link>
      ))}
    </div>
  );
}

// Phone frame (mobile). Hoisted so it never remounts.
function Frame({
  pal, night, par, date, frameRef, withTabs = true, withToggle = true, screen, onTab, onToggleNight, lang, onLang, children,
}: {
  pal: Palette; night: boolean; par: { x: number; y: number }; date: Date;
  frameRef: RefObject<HTMLDivElement | null>; withTabs?: boolean; withToggle?: boolean;
  screen?: Screen; onTab?: (t: Screen) => void; onToggleNight?: () => void; lang: Lang; onLang: (lang: Lang) => void; children: ReactNode;
}) {
  const t = COPY[lang];
  return (
    <div style={{ minHeight: "100svh", display: "flex", justifyContent: "center", background: "#05080f" }}>
      <div ref={frameRef} style={{
        position: "relative", width: "100%", maxWidth: 430, minHeight: "100svh", overflow: "hidden",
        background: pal.bg, color: pal.ink, fontFamily: FT, display: "flex", flexDirection: "column",
        transition: "background .5s ease",
      }}>
        <SkyBg pal={pal} night={night} par={par} />
        <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column",
          padding: withTabs ? "0 20px 104px" : "0 20px 64px" }}>
          <StatusBar pal={pal} date={date} brand={PRODUCT_NAME} />
          {withToggle && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
              <LangSwitch pal={pal} lang={lang} onLang={onLang} />
            </div>
          )}
          {children}
        </div>
        <div style={{ position: "absolute", left: 14, right: 14, bottom: withTabs ? 63 : 16, zIndex: 3 }}>
          <LegalFooter pal={pal} lang={lang} compact />
        </div>
        {withTabs && screen && onTab && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 3 }}>
            <TabBar pal={pal} active={screen as TabId} labels={t.tabs} onTab={(tab) => onTab(tab as Screen)} />
          </div>
        )}
      </div>
    </div>
  );
}

// Observatory (desktop). Two-pane: left instrument, right panel.
function DesktopShell({
  pal, night, par, date, frameRef, screen, onTab, onToggleNight, lang, onLang, title, visual, detail,
}: {
  pal: Palette; night: boolean; par: { x: number; y: number }; date: Date;
  frameRef: RefObject<HTMLDivElement | null>; screen: Screen; onTab: (t: Screen) => void;
  onToggleNight: () => void; lang: Lang; onLang: (lang: Lang) => void; title: string; visual: ReactNode; detail: ReactNode;
}) {
  const t = COPY[lang];
  return (
    <div ref={frameRef} style={{ position: "relative", minHeight: "100svh", overflow: "hidden",
      background: pal.bg, color: pal.ink, fontFamily: FT, transition: "background .5s ease" }}>
      <SkyBg pal={pal} night={night} par={par} />
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto", padding: "0 44px",
        minHeight: "100svh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 28 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FD, fontSize: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: 4, background: pal.brass }} />{PRODUCT_NAME}
          </span>
          <nav style={{ display: "flex", gap: 4 }}>
            {SCREENS.map((s) => {
              const on = s === screen;
              return (
                <button key={s} onClick={() => onTab(s)} style={{ appearance: "none", border: "none", background: "transparent",
                  cursor: "pointer", padding: "8px 16px", borderRadius: 20, color: on ? pal.accent : pal.inkSoft,
                  display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: FG, fontSize: 14 }}>{TAB_ICON[s]}</span>
                  <span style={{ fontFamily: FD, fontStyle: "italic", fontSize: 16 }}>{t.tabs[s]}</span>
                </button>
              );
            })}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: FN, fontSize: 13, color: pal.ink }}>{date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
            <ModeToggle night={night} onToggle={onToggleNight} pal={pal} title={t.mode.toggle} />
            <LangSwitch pal={pal} lang={lang} onLang={onLang} />
          </div>
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56,
          alignItems: "center", padding: "24px 0 48px" }}>
          <div style={{ display: "flex", justifyContent: "center", transform: `translate(${par.x * 5}px, ${par.y * 5}px)`, transition: "transform .4s ease-out" }}>{visual}</div>
          <div style={{ maxWidth: 460, display: "flex", flexDirection: "column" }}>
            <Cap pal={pal} style={{ marginBottom: 16 }}>{title}</Cap>
            {detail}
          </div>
        </div>
        <footer style={{ paddingBottom: 22 }}>
          <LegalFooter pal={pal} lang={lang} />
        </footer>
      </div>
    </div>
  );
}

function CabinetPage() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [star, setStar] = useState<SealedStar | null>(null);
  const [read, setRead] = useState<CompleteRead | null>(null);
  const night = true; // single-register (gold); the day/night toggle is retired
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  // surface is URL-driven: the header's ?screen= links and in-flow setScreen calls
  // both move through the URL, so they never fall out of sync (in-flow nav model).
  const sp = useSearchParams();
  const router = useRouter();
  const rawScreen = sp.get("screen");
  const screen: Screen = rawScreen === "theme" || rawScreen === "star" || rawScreen === "genius" || rawScreen === "calendar" ? rawScreen : "cabinet";
  const setScreen = useCallback((s: Screen) => { router.replace(s === "cabinet" ? "/cabinet" : `/cabinet?screen=${s}`, { scroll: false }); }, [router]);
  const [hoverSign, setHoverSign] = useState<number | null>(null);
  const [sel, setSel] = useState<DisplayPlanetKey>("moon");

  const wide = useMediaQuery("(min-width: 980px)");
  const { date, offsetDays, setOffsetDays } = useSkyClock();
  const frameRef = useRef<HTMLDivElement | null>(null);
  const par = useParallax(frameRef, night);
  const rotation = useSlowRotation(night);
  const pal = night ? NIGHT : DAY;
  const t = COPY[lang];

  const [rstep, setRstep] = useState(0);
  const [rmust, setRmust] = useState("");
  const [rname, setRname] = useState("");
  const [bday, setBday] = useState("");
  const [btime, setBtime] = useState("");
  const [bplace, setBplace] = useState("");
  const [casting, setCasting] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [generatingRead, setGeneratingRead] = useState(false);
  const [genError, setGenError] = useState<string | null>(null); // inline failure note — never an alert()
  const [ceremony, setCeremony] = useState(false);
  const [reviewing, setReviewing] = useState(false); // re-open a kept reading from the Cabinet
  const [held, setHeld] = useState(false); // judge-fail → ceremonial held state, never an error
  const [gInput, setGInput] = useState("");
  const [gReply, setGReply] = useState<string | null>(null);
  const [gSending, setGSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ledger, setLedger] = useState<SealedStar[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await Promise.resolve();
      if (!alive) return;
      const savedLang = window.localStorage.getItem("the-astrolab.lang");
      if (savedLang === "fr" || savedLang === "en") setLang(savedLang);
      setProfile(getProfile());
      setStar(getStar());
      setLedger(getStarLedger());
      const localRead = getRead();
      if (localRead) setRead(localRead);
      setReady(true);

      const m = await loadMessages();
      if (alive) setMessages(m);

      const remoteRead = await cloudPullRead();
      if (alive && remoteRead) {
        saveRead(remoteRead);
        setRead(remoteRead);
      }

      // Cross-device: if this browser holds the paid-access cookie but the read isn't here
      // (new device / cleared storage), pull it by the paid email it was stamped with.
      if (alive && !localRead && !remoteRead) {
        try {
          const mineRes = await fetch("/api/read/mine");
          if (alive && mineRes.ok) {
            const { read: mineRead } = await mineRes.json();
            if (mineRead && typeof mineRead.signature === "string") { saveRead(mineRead); setRead(mineRead); }
          }
        } catch { /* stay local */ }
      }

      const remote = await cloudPull();
      if (!alive || !remote) return;
      if (remote.profile) {
        saveProfile(remote.profile);
        setProfile(remote.profile);
      }
      if (remote.star) {
        saveStar(remote.star);
        setStar(remote.star);
      }
      const cloudLedger = [...remote.ledger];
      if (remote.star && !cloudLedger.some((s) => s.sealedAt === remote.star?.sealedAt)) cloudLedger.push(remote.star);
      if (cloudLedger.length) {
        cloudLedger.sort((a, b) => a.sealedAt.localeCompare(b.sealedAt));
        saveStarLedger(cloudLedger);
        setLedger(cloudLedger);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("read") !== "intake") return;
    // Post-pay signal: open the intake even if a prior read exists (a new purchase is a
    // new reading — it overwrites). Ensure an active star (the most recent sealed) so the
    // reading has a question to be drawn for.
    const active = star ?? (ledger.length ? ledger[ledger.length - 1] : null);
    if (!active) return; // no sealed question yet — nothing to draw for
    if (!star) { saveStar(active); setStar(active); }
    setIntakeOpen(true);
    setScreen("cabinet");
  }, [ready, star, ledger]);

  function changeLang(next: Lang) {
    setLang(next);
    try { window.localStorage.setItem("the-astrolab.lang", next); } catch {}
  }

  const natalLon = useMemo<LonMap | null>(() => (profile ? displaySky(new Date(profile.birthISO)) : null), [profile]);
  const ascVal = useMemo<number | null>(() => {
    if (!profile || profile.lat == null || profile.lon == null) return null;
    return ascendant(new Date(profile.birthISO), profile.lat, profile.lon);
  }, [profile]);
  const liveLon = useMemo<LonMap>(() => displaySky(date), [date]);
  const reach = useMemo(() => (star ? reachOf(star, date) : null), [star, date]);
  const fulfilled = !!star?.fulfilledAt;
  const remaining = remainingExchanges(messages);
  const journal = useMemo(() => journalEntries(messages).slice(0, 4), [messages]);
  const recordedStars = useMemo(() => {
    const all = ledger.map((s) => (star && s.sealedAt === star.sealedAt ? star : s));
    if (star && !all.some((s) => s.sealedAt === star.sealedAt)) all.push(star);
    return all.sort((a, b) => b.sealedAt.localeCompare(a.sealedAt)).slice(0, 6);
  }, [ledger, star]);
  const toggleNight = () => {}; // retired — kept as a no-op for chrome call-sites
  const onTab = (t: Screen) => { setScreen(t); setGReply(null); };
  const startSeal = () => { setRmust(""); setRname(""); setRstep(1); };

  // the export's "emerge from depth" — .em children reveal once the stage gains .enter
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    setEntered(false);
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setEntered(true)); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [screen]);

  async function castSky() {
    if (!bday || casting) return;
    setCasting(true);
    const birthISO = `${bday}T${btime || "12:00"}`;
    const natal = natalChart(new Date(birthISO), birthISO);
    let lat: number | undefined;
    let lon: number | undefined;
    const place = bplace.trim();
    if (place) {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(place)}`);
        if (res.ok) {
          const geo = await res.json();
          if (geo.lat != null && geo.lon != null) {
            lat = geo.lat;
            lon = geo.lon;
          }
        }
      } catch { /* graceful — profile saves without coords */ }
    }
    const p: Profile = {
      birthISO, place, natal, createdAt: new Date().toISOString(),
      ...(lat != null && lon != null ? { lat, lon } : {}),
      // an empty time means the noon in birthISO is a placeholder — the horizon is
      // unknowable, and nothing downstream may draw an Ascendant or houses from it
      ...(btime ? {} : { timeUnknown: true }),
    };
    saveProfile(p); setProfile(p); void cloudPush(p, null); setScreen("theme");
    setCasting(false);
  }

  async function generateRead(intake: { season: string; repeating: string; afraid: string }) {
    if (!profile || !star || generatingRead) return;
    setGenError(null);
    setGeneratingRead(true);
    try {
      // Held-path test trigger: ?forcefail=1 asks the server to force a judge-fail so the
      // operator can walk held → /admin/held → deliver. The server only honors it under
      // READ_OPEN=true, so it is inert in production (READ_OPEN=false).
      const forceFail = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("forcefail") === "1";
      // uid lets the server persist the read + fire the "ready" email even if this tab closes.
      const uid = await cloudUserId();
      const res = await fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, intake, star, language: lang, ...(uid ? { uid } : {}), ...(forceFail ? { forceJudgeFail: true } : {}) }),
      });
      const data = await res.json();
      // Write the lifecycle trail under the user's own session — on success AND on a
      // judge failure (so read_judged_failed is logged and visible), never user-facing.
      if (Array.isArray(data._lifecycle)) {
        for (const e of data._lifecycle) logEvent(e.subject_type, e.subject_id, e.event_type, e.payload, e.idempotency_key);
      }
      if (!res.ok || data.error) {
        // A judge-fail must NEVER dead-end a paying customer: hold gracefully (the read
        // is being hand-fulfilled from the admin held-reads page → lands in the Cabinet).
        if (data.error === "judge_failed") { setIntakeOpen(false); setHeld(true); return; }
        setGenError(t.intake.error); // inline, in-register — never an alert on the €60 surface
        return;
      }
      const artifact: CompleteRead = {
        signature: data.signature,
        chart: data.chart,
        pattern: data.pattern,
        star: data.star,
        yearAhead: data.yearAhead,
        counsel: data.counsel,
        generatedAt: data.generatedAt ?? new Date().toISOString(),
        question: data.question ?? star?.must ?? "",
      };
      saveRead(artifact);
      setRead(artifact);
      void cloudPushRead(artifact);
      setIntakeOpen(false);
      setCeremony(true); // first viewing = the arrival ceremony, then it settles into the Cabinet
    } catch {
      setGenError(t.intake.error);
    } finally {
      setGeneratingRead(false);
    }
  }
  function sealNow() {
    const s = makeStar(rmust, rname);
    saveStar(s);
    setStar(s);
    setLedger(recordStar(s));
    cloudPush(profile, s);
    setRstep(4);
  }
  function keepStar() {
    if (!star) return;
    const kept = { ...star, fulfilledAt: star.fulfilledAt ?? new Date().toISOString() };
    saveStar(kept);
    setStar(kept);
    setLedger(recordStar(kept));
    cloudPush(profile, kept);
  }
  async function askDaily() {
    const text = gInput.trim();
    if (!text || gSending || !star || !reach) return;
    if (remainingExchanges(messages) <= 0) {
      setGReply(t.genius.closed);
      return;
    }
    setGSending(true); setGReply(null);
    const a = archetypeForStar(star);
    const userMessage = appendMessage({ role: "user", content: text });
    const history = [...messages, userMessage].slice(-40);
    setMessages((prev) => [...prev, userMessage].slice(-100));
    const reply = await askGenius(history, {
      star: { name: star.name, must: star.must, ruler: star.ruler },
      archetype: { name: a.name, essence: a.essence },
      reach: { gap: reach.gap, days: reach.days, phase: geniusPhase(reach, fulfilled) },
      language: lang === "fr" ? "French" : "English",
    });
    const line = reply ?? t.genius.fallback;
    const assistantMessage = appendMessage({ role: "assistant", content: line });
    setMessages((prev) => [...prev, assistantMessage].slice(-100));
    setGReply(line);
    setGInput(""); setGSending(false);
  }

  if (!ready) return (
    <div style={{ minHeight: "100svh", background: "#05080f", color: NIGHT.inkSoft, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FT }}>
      {t.loading}
    </div>
  );

  // ── onboarding: Fixed Sky ──
  if (!profile) {
    const fields = (
      <div style={{ width: "100%" }}>
        <Cap pal={pal}>{t.onboarding.cap}</Cap>
        <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 34, lineHeight: 1.1, marginTop: 12, color: pal.ink }}>{t.onboarding.title}</div>
        <div style={{ fontFamily: FT, fontSize: 14.5, color: pal.inkSoft, marginTop: 12, lineHeight: 1.5 }}>
          {t.onboarding.intro}
        </div>
        {([[t.onboarding.birthDate, bday, setBday, "date"], [t.onboarding.birthTime, btime, setBtime, "time"], [t.onboarding.birthPlace, bplace, setBplace, "text"]] as [string, string, (s: string) => void, string][]).map(([label, val, set, type]) => (
          <label key={label} style={{ display: "block", marginTop: 22 }}>
            <span style={{ fontFamily: FT, fontSize: 9.5, letterSpacing: 2, textTransform: "uppercase", color: pal.inkSoft }}>{label}</span>
            <input type={type} value={val} placeholder={type === "text" ? t.onboarding.birthPlacePlaceholder : undefined} onChange={(e) => set(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 7, background: "transparent", border: "none",
                borderBottom: `1px solid ${pal.panelLine}`, color: pal.ink, fontFamily: FD, fontStyle: "italic", fontSize: 22, padding: "8px 2px", outline: "none" }} />
          </label>
        ))}
        <div style={{ marginTop: 34 }}><Btn pal={pal} solid onClick={() => void castSky()} disabled={!bday || casting}>{casting ? "…" : t.onboarding.cast}</Btn></div>
      </div>
    );
    if (wide) {
      return (
        <div ref={frameRef} style={{ position: "relative", minHeight: "100svh", overflow: "hidden", background: pal.bg, color: pal.ink, fontFamily: FT }}>
          <SkyBg pal={pal} night={night} par={par} />
          <div style={{ position: "absolute", top: 30, left: 44, zIndex: 4, display: "flex", alignItems: "center", gap: 8, fontFamily: FD, fontSize: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: 4, background: pal.brass }} />{PRODUCT_NAME}
          </div>
          <div style={{ position: "absolute", top: 28, right: 44, zIndex: 4, display: "flex", gap: 10 }}>
            <ModeToggle night={night} onToggle={toggleNight} pal={pal} title={t.mode.toggle} />
            <LangSwitch pal={pal} lang={lang} onLang={changeLang} />
          </div>
          <div style={{ position: "relative", zIndex: 2, maxWidth: 1080, margin: "0 auto", padding: "0 44px", minHeight: "100svh",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", transform: `translate(${par.x * 6}px, ${par.y * 6}px)`, transition: "transform .4s ease-out" }}>
              <PlanetMedallion pal={pal} glyph="✦" size={300} />
            </div>
            <div style={{ maxWidth: 440 }}>{fields}</div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 24, zIndex: 3 }}><LegalFooter pal={pal} lang={lang} /></div>
        </div>
      );
    }
    return (
      <Frame pal={pal} night={night} par={par} date={date} frameRef={frameRef} withTabs={false} withToggle onToggleNight={toggleNight} lang={lang} onLang={changeLang}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 30 }}>{fields}</div>
      </Frame>
    );
  }

  // ── intake overlay (Complete Read) — intakeOpen is the gate; a prior read no longer blocks it ──
  if (intakeOpen && profile && star) {
    return (
      <div ref={frameRef} style={{ position: "relative", minHeight: "100svh", overflow: "hidden", background: pal.bg, color: pal.ink, fontFamily: FT, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <SkyBg pal={pal} night={night} par={par} />
        <div style={{ position: "absolute", top: 24, right: 24, zIndex: 4, display: "flex", gap: 10 }}>
          <ModeToggle night={night} onToggle={toggleNight} pal={pal} title={t.mode.toggle} />
          <LangSwitch pal={pal} lang={lang} onLang={changeLang} />
        </div>
        <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
          {generatingRead ? (
            <CastingScreen pal={pal} par={par}
              cap={lang === "fr" ? "On trace ton ciel" : "Casting your sky"}
              lines={lang === "fr"
                ? ["Le ciel est lu face à ta question.", "La lecture prend une nuit. C'est cette nuit.", "Ta question est scellée. La réponse se trace.", "Le ciel de ta naissance se pose sur le ciel de ce soir.", "Rien de vrai ne se presse. Ceci se fait lentement.", "L'instrument tourne. Laisse-le tourner.", "Les étoiles gardent leur propre temps, et ce qu'elles disent de toi aussi.", "Ce qui s'écrit cette nuit durera plus que l'attente."]
                : ["The sky is being read against your question.", "The reading takes a night. This is the night.", "Your question is sealed. The answer is being drawn.", "The sky you were born under is being laid over the sky tonight.", "Nothing true is hurried. This is being made slowly.", "The instrument is turning. Let it turn.", "The stars keep their own time, and so does what they say of you.", "What is written tonight will outlast the waiting for it."]}
              footer={(() => {
                const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
                const when = d.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true });
                const em = typeof window !== "undefined" ? window.localStorage.getItem("the-astrolab.email") : null;
                return (
                  <div style={{ maxWidth: 400, margin: "42px auto 0", paddingTop: 22, borderTop: `1px solid ${pal.panelLine}` }}>
                    <div style={{ fontFamily: FN, fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: pal.silver, lineHeight: 1.9 }}>
                      {lang === "fr" ? <>Elle te parvient d&apos;ici <span style={{ color: pal.brassHi }}>{when}</span>.</> : <>It reaches you by <span style={{ color: pal.brassHi }}>{when}</span>.</>}
                      {em && <><br />{lang === "fr" ? "Nous l'envoyons à " : "We'll send it to "}<span style={{ color: pal.brass }}>{em}</span>.</>}
                    </div>
                    <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 15.5, color: pal.inkSoft, marginTop: 13 }}>
                      {lang === "fr" ? "Tu peux fermer cette page. Le ciel continue de lire." : "You can close this page. The sky keeps reading."}
                    </div>
                  </div>
                );
              })()} />
          ) : (
            <>
              <IntakeForm
                pal={pal}
                copy={{
                  cap: t.intake.cap,
                  title: t.intake.title,
                  season: t.intake.season,
                  repeating: t.intake.repeating,
                  afraid: t.intake.afraid,
                  submit: t.intake.submit,
                  generating: t.intake.generating,
                }}
                generating={generatingRead}
                onSubmit={(answers) => void generateRead(answers)}
              />
              {genError && (
                <p style={{ maxWidth: 420, margin: "24px auto 0", textAlign: "center", fontFamily: FD, fontStyle: "italic", fontSize: 15, color: pal.inkSoft, lineHeight: 1.55 }}>{genError}</p>
              )}
            </>
          )}
        </div>
        <div style={{ position: "absolute", left: 14, right: 14, bottom: 20, zIndex: 3 }}>
          <LegalFooter pal={pal} lang={lang} compact />
        </div>
      </div>
    );
  }

  // ── held state (judge-fail) — ceremony, never an error; hand-fulfilled into the Cabinet ──
  if (held) {
    const h = lang === "fr"
      ? { cap: "Votre lecture se dessine", title: "Le ciel prend une nuit.", body: "Certains ciels demandent plus de temps à lire. Le vôtre est tracé à la main, avec soin — il vous attendra dans votre Cabinet à votre retour.", btn: "Retour au Cabinet" }
      : { cap: "Your reading is being drawn", title: "The sky takes a night.", body: "Some skies take longer to read. Yours is being drawn by hand, with care — and will be waiting in your Cabinet when you return.", btn: "Return to the Cabinet" };
    return (
      <div ref={frameRef} style={{ position: "relative", minHeight: "100svh", overflow: "hidden", background: pal.bg, color: pal.ink, fontFamily: FT, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <SkyBg pal={pal} night={night} par={par} />
        <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 460, textAlign: "center" }}>
          <PlanetMedallion pal={pal} glyph="✦" size={150} />
          <Cap pal={pal} style={{ marginTop: 26 }}>{h.cap}</Cap>
          <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 36, lineHeight: 1.1, color: pal.ink, marginTop: 10 }}>{h.title}</div>
          <div style={{ fontFamily: FT, fontSize: 15, color: pal.inkSoft, marginTop: 16, lineHeight: 1.6 }}>{h.body}</div>
          <div style={{ marginTop: 32 }}><Btn pal={pal} onClick={() => { setHeld(false); setScreen("cabinet"); }}>{h.btn}</Btn></div>
        </div>
      </div>
    );
  }

  // ── the reveal — sealed letter → break the seal → descent → the reading surfaces ──
  if ((ceremony || reviewing) && read && profile) {
    return (
      <ReadReveal
        read={read}
        question={read.question ?? star?.must ?? ""}
        lang={lang}
        plate={buildPlate(profile, star?.name)}
        onClose={() => { setCeremony(false); setReviewing(false); setScreen("cabinet"); }}
      />
    );
  }

  // ── ritual (seal flow) — centered both layouts ──
  if (rstep > 0) {
    const inner = (
      <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
        {rstep === 1 && (
          <div style={{ textAlign: "left" }} className="astro-fade">
            <Cap pal={pal}>{t.ritual.questionCap}</Cap>
            <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 34, marginTop: 14, color: pal.ink }}>{t.ritual.question}</div>
            <input value={rmust} placeholder={t.ritual.questionPlaceholder} onChange={(e) => setRmust(e.target.value)}
              style={{ width: "100%", marginTop: 28, background: "transparent", border: "none", borderBottom: `1px solid ${pal.panelLine}`, color: pal.ink, fontFamily: FD, fontStyle: "italic", fontSize: 24, padding: "8px 2px", outline: "none" }} />
            <div style={{ marginTop: 36 }}><Btn pal={pal} disabled={!rmust.trim()} onClick={() => setRstep(2)}>{t.ritual.continue}</Btn></div>
          </div>
        )}
        {rstep === 2 && (
          <div style={{ textAlign: "left" }} className="astro-fade">
            <Cap pal={pal}>{t.ritual.nameCap}</Cap>
            <input value={rname} placeholder={t.ritual.namePlaceholder} onChange={(e) => setRname(e.target.value)}
              style={{ width: "100%", marginTop: 28, background: "transparent", border: "none", borderBottom: `1px solid ${pal.panelLine}`, color: pal.ink, fontFamily: FD, fontSize: 30, letterSpacing: 1, textTransform: "uppercase", padding: "8px 2px", outline: "none" }} />
            <div style={{ marginTop: 36 }}><Btn pal={pal} disabled={!rname.trim()} onClick={() => setRstep(3)}>{t.ritual.continue}</Btn></div>
          </div>
        )}
        {rstep === 3 && (
          <div className="astro-fade">
            <PlanetMedallion pal={pal} glyph="✦" size={172} />
            <Cap pal={pal} style={{ marginTop: 22 }}>{t.ritual.irreversible}</Cap>
            <div style={{ fontFamily: FD, fontStyle: "italic", fontWeight: 500, fontSize: 44, color: pal.ink, marginTop: 8, lineHeight: 1 }}>“{rname.trim().toUpperCase()}”</div>
            <div style={{ marginTop: 34 }}><Btn pal={pal} solid onClick={sealNow}>{t.ritual.seal}</Btn></div>
          </div>
        )}
        {rstep === 4 && star && (
          <div className="astro-fade">
            <Cap pal={pal} style={{ marginBottom: 16 }}>{t.ritual.starStands}</Cap>
            <PlanetMedallion pal={pal} glyph={star.glyph} size={158} />
            <div style={{ fontFamily: FD, fontStyle: "italic", fontWeight: 500, fontSize: 44, color: pal.ink, marginTop: 14, lineHeight: 1 }}>{star.name}</div>
            <div style={{ marginTop: 16, width: 240, marginLeft: "auto", marginRight: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {([[t.ritual.sign, SIGN_NAME[signOf(star.lon)]], [t.ritual.degree, degStr(star.lon)], [t.ritual.house, star.house], [t.ritual.ruler, `${star.rulerGlyph} ${star.ruler}`]] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${pal.panelLine}`, fontSize: 12 }}>
                  <span style={{ color: pal.inkSoft, textTransform: "uppercase", letterSpacing: 0.8, fontSize: 9, fontFamily: FT }}>{k}</span>
                  <span style={{ fontFamily: FN, color: pal.ink }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 30 }}><Btn pal={pal} solid onClick={() => { setRstep(0); setRmust(""); setRname(""); setScreen("star"); }}>{t.ritual.enter}</Btn></div>
            <div style={{ marginTop: 18 }}>
              <Link href={`/checkout?lang=${lang}`} style={{ color: pal.brass, fontFamily: FT, fontSize: 13, textDecoration: "none", letterSpacing: 1 }}>{t.completeRead.cta}</Link>
            </div>
          </div>
        )}
      </div>
    );
    return (
      <div ref={frameRef} style={{ position: "relative", minHeight: "100svh", overflow: "hidden", background: pal.bg, color: pal.ink, fontFamily: FT, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <SkyBg pal={pal} night={night} par={par} />
        <div style={{ position: "absolute", top: 24, right: 24, zIndex: 4, display: "flex", gap: 10 }}>
          <ModeToggle night={night} onToggle={toggleNight} pal={pal} title={t.mode.toggle} />
          <LangSwitch pal={pal} lang={lang} onLang={changeLang} />
        </div>
        <div style={{ position: "relative", zIndex: 2, width: "100%" }}>{inner}</div>
        <div style={{ position: "absolute", left: 14, right: 14, bottom: 20, zIndex: 3 }}>
          <LegalFooter pal={pal} lang={lang} compact />
        </div>
      </div>
    );
  }

  // ── Cabinet — the gallery wall of kept readings, ported verbatim (.cab-*/.gal-*) ──
  if (screen === "cabinet") {
    const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI"];
    // the export's four engraved seal-emblems — gold line-work, no fill, no glow
    const EMBLEMS = [
      <svg key="0" viewBox="0 0 60 60"><circle cx="30" cy="30" r="21" /><circle cx="30" cy="25" r="10" /><circle cx="30" cy="30" r="2" /><ellipse cx="30" cy="30" rx="26" ry="10" transform="rotate(-20 30 30)" /></svg>,
      <svg key="1" viewBox="0 0 60 60"><circle cx="30" cy="30" r="21" /><path d="M30 9v42" /><path d="M16 17c10 8 18 8 28 0" /><path d="M16 43c10-8 18-8 28 0" /></svg>,
      <svg key="2" viewBox="0 0 60 60"><circle cx="30" cy="30" r="21" /><circle cx="30" cy="30" r="12" /><circle cx="30" cy="30" r="2" /><path d="M30 9v5M30 46v5M9 30h5M46 30h5" /></svg>,
      <svg key="3" viewBox="0 0 60 60"><circle cx="30" cy="30" r="21" /><path d="M30 18l3.2 8.8L42 30l-8.8 3.2L30 42l-3.2-8.8L18 30l8.8-3.2z" /></svg>,
    ];
    const ADD = <svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="19" strokeDasharray="3 5" /><path d="M25 17v16M17 25h16" /></svg>;
    return (
      <>
        <AtlasChrome />
        <Header />
        <section className={`stage active${entered ? " enter" : ""}`} id="cabinet">
          <div className="surface cab-gallery">
            <div className="cab-head em">
              <div>
                <p className="cab-kicker">{lang === "fr" ? "Gardé contre la nuit" : "Kept against the dark"}</p>
                <h1 className="cab-title">{lang === "fr" ? "Le Cabinet" : "The Cabinet"}</h1>
                {natalLon && <button type="button" onClick={() => setScreen("theme")} style={{ marginTop: 16, background: "none", border: 0, padding: 0, cursor: "pointer", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--gold-deep)" }}>{lang === "fr" ? "Voir votre thème" : "See your chart"} →</button>}
              </div>
              <div className="cab-tally">
                <span className="cab-tally-n">{recordedStars.length}</span>
                <span className="cab-tally-l">{lang === "fr" ? <>lectures que le ciel<br />a gardées</> : <>readings the sky<br />has kept for you</>}</span>
              </div>
            </div>
            {read && (
              <div className="em" style={{ marginBottom: 34 }}>
                <button type="button" className="gal-card read cab-reading" onClick={() => setReviewing(true)}
                  style={{ width: "100%", flexDirection: "row", alignItems: "center", gap: 26, minHeight: 0, cursor: "pointer" }}>
                  <span className="gal-emblem" style={{ margin: 0, flex: "none" }}>
                    <svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="21" /><circle cx="30" cy="30" r="12" /><circle cx="30" cy="30" r="2" /><path d="M30 9v5M30 46v5M9 30h5M46 30h5" /></svg>
                  </span>
                  <span style={{ flex: 1, textAlign: "left", display: "block" }}>
                    <span className="gal-no" style={{ display: "block", marginBottom: 10 }}>{lang === "fr" ? "Votre Lecture" : "Your Reading"}</span>
                    <span className="gal-q" style={{ display: "block" }}>{read.question || (lang === "fr" ? "La lecture que vous avez scellée" : "The reading you sealed")}</span>
                    <span className="gal-status" style={{ marginTop: 16 }}><span className="gal-dot" />{lang === "fr" ? "Scellée — touchez pour l'ouvrir" : "Sealed — open to read"}</span>
                  </span>
                </button>
              </div>
            )}
            {star && !read && (
              <div className="em" style={{ marginBottom: 34 }}>
                <Link href="/checkout" className="plaque">{lang === "fr" ? "Faire tirer votre Lecture" : "Have your Reading drawn"} <span className="ar">→</span></Link>
              </div>
            )}
            <div className="cab-grid em">
              {recordedStars.map((s, i) => {
                const opened = !!s.fulfilledAt;
                const st = ledgerStatus(s, date, lang);
                return (
                  <button key={s.sealedAt} className={`gal-card ${opened ? "read" : "sealed"}`} onClick={() => { saveStar(s); setStar(s); setScreen("star"); }}>
                    <span className="gal-no">No. {ROMAN[i] ?? i + 1}</span>
                    <span className="gal-emblem">{EMBLEMS[i % EMBLEMS.length]}</span>
                    <span className="gal-q">{s.must}</span>
                    <span className="gal-foot">
                      <span className="gal-date">{st.stamp}</span>
                      <span className="gal-status"><span className="gal-dot" />{st.label}</span>
                    </span>
                  </button>
                );
              })}
              <button className="gal-card add" onClick={startSeal}>
                <span className="gal-emblem">{ADD}</span>
                <span className="gal-add-l">{lang === "fr" ? "Poser une nouvelle question" : "Ask a new question"}</span>
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  // ── Genius — the day's record, ported verbatim (.genius-ed / .record / .rec-*) ──
  if (screen === "genius") {
    const garch = star ? archetypeForStar(star) : null;
    const gClosed = remaining <= 0;
    const now = new Date().toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-GB", { hour: "2-digit", minute: "2-digit" });
    const oracle = gReply ?? (star && gClosed ? t.genius.closed : star && reach ? localGeniusLine(lang, star, reach, fulfilled) : t.genius.wake);
    return (
      <>
        <AtlasChrome />
        <Header />
        <section className={`stage active${entered ? " enter" : ""}`} id="genius">
          <div className="surface">
            <div className="duo">
              <div className="instr-cell"><div className="instr-slot em"><PlanetMedallion pal={pal} glyph={star ? star.glyph : "◎"} size={232} /></div></div>
              <div className="genius-ed">
                <p className="eyebrow em">{lang === "fr" ? <>Votre <b>Genius</b></> : <>Your <b>Genius</b></>}</p>
                <div className="state-line em">
                  <span>{star && garch ? `${t.genius.heldBy} ${garch.name}` : t.genius.awaiting}</span>
                  <span className="rule" />
                  <span className="tally">{remaining} / {DAILY_EXCHANGE_LIMIT} {t.genius.today}</span>
                </div>
                <p className="oracle em">{oracle}</p>
                <div className="record em">
                  <p className="record-head">{t.genius.record}</p>
                  <form className="rec-write" autoComplete="off" onSubmit={(e) => { e.preventDefault(); if (star && !gClosed && gInput.trim()) askDaily(); }}>
                    <span className="rec-time rec-now">{now}</span>
                    <input className="rec-input" maxLength={180} value={gInput} disabled={!star || gSending || gClosed}
                      placeholder={gClosed ? t.genius.closedPlaceholder : t.genius.placeholder}
                      onChange={(e) => setGInput(e.target.value)} />
                    <button type="submit" className="rec-commit" aria-label={t.genius.keep} disabled={!star || gSending || gClosed}>↵</button>
                  </form>
                  <div className="rec-list">
                    {journal.length ? journal.map((m) => (
                      <div className="rec-entry" key={`${m.createdAt ?? ""}${m.content}`}>
                        <span className="rec-time">{recordTime(m.createdAt)}</span>
                        <p className="rec-text">{m.content}</p>
                      </div>
                    )) : (
                      <div className="rec-entry"><span className="rec-time">—</span><p className="rec-text"><em>{t.genius.emptyRecord}</em></p></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  // ── Calendar — the almanac, ported verbatim (.cal-*), grounded in our ephemeris ──
  if (screen === "calendar") {
    return (
      <>
        <AtlasChrome />
        <Header />
        <section className={`stage active${entered ? " enter" : ""}`} id="calendar">
          <AtlasCalendar lang={lang} birthISO={profile?.birthISO ?? null} />
        </section>
      </>
    );
  }

  // ── Theme — the natal chart, ported verbatim (.duo / .theme-ed / .reading-card) ──
  if (screen === "theme" && natalLon) {
    const signs = t.theme.signNames;
    const sunSign = signs[signOf(natalLon.sun)];
    const moonSign = signs[signOf(natalLon.moon)];
    const risingSign = ascVal != null ? signs[signOf(ascVal)] : undefined;
    const L = lang === "fr" ? { sunIn: "Soleil en", moonIn: "Lune en", rising: "Ascendant" } : { sunIn: "Sun in", moonIn: "Moon in", rising: "Rising" };
    return (
      <>
        <AtlasChrome />
        <Header />
        <section className={`stage active${entered ? " enter" : ""}`} id="theme">
          <div className="surface">
            <div className="duo">
              <div className="instr-cell">
                <SkyWheel pal={pal} size={wide ? 420 : 300} bodies={natalLon} asc={ascVal} houses={ascVal != null} highlight={sel} rotation={rotation} hoverSign={hoverSign} onSign={setHoverSign} />
              </div>
              <div className="theme-ed">
                <p className="eyebrow em">{lang === "fr" ? <>Votre <b>Thème</b></> : <>Your <b>Theme</b></>}</p>
                <p className="triad em">{L.sunIn} <b>{sunSign}</b> · {L.moonIn} <b>{moonSign}</b>{risingSign ? <> · {L.rising} <b>{risingSign}</b></> : null}</p>
                <div className="planet-rail em">
                  {PLANETS.map((p) => (
                    <button key={p.key} className={sel === p.key ? "on" : ""} onClick={() => setSel(p.key as DisplayPlanetKey)} aria-label={PLANET_NAME[p.key as DisplayPlanetKey]}>{p.glyph}</button>
                  ))}
                </div>
                <div className="reading-card em">
                  <div className="rc-head">
                    <span className="rc-glyph">{PLANET_GLYPH[sel]}</span>
                    <span className="rc-name">{PLANET_NAME[sel]}</span>
                    <span className="rc-pos">{shortPos(natalLon[sel])}</span>
                  </div>
                  <p className="rc-body">{t.theme.read[sel]}</p>
                  <span className="rc-deg">{degStr(natalLon[sel])}</span>
                </div>
                <p className="theme-cap em">{hoverSign != null ? SIGN_NAME[hoverSign] : t.theme.touchSign}<em>{t.theme.bornUnder}</em></p>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  // ── Star — the sealed star, ported verbatim (.duo / .star-ed / .artifact grammar) ──
  if (screen === "star") {
    const sub: LonMap = { moon: liveLon.moon, sun: liveLon.sun, venus: liveLon.venus, mars: liveLon.mars, jupiter: liveLon.jupiter, saturn: liveLon.saturn };
    const size = wide ? 420 : 300;
    const metaRow = { display: "flex", gap: 10, alignItems: "baseline", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".1em", color: "var(--slate)", margin: "2px 0 18px" } as const;
    return (
      <>
        <AtlasChrome />
        <Header />
        <section className={`stage active${entered ? " enter" : ""}`} id="star">
          <div className="surface">
            {star && reach ? (
              <div className="duo">
                <div className="instr-cell">
                  <SkyWheel pal={pal} size={size} bodies={sub} highlight="moon" sealedLon={star.lon} showArc rotation={rotation} hoverSign={hoverSign} onSign={setHoverSign} />
                </div>
                <div className="star-ed">
                  <p className="eyebrow em">{lang === "fr" ? <>Votre <b>Étoile</b></> : <>Your <b>Star</b></>}</p>
                  <p className="art-eyebrow em">{fulfilled ? (lang === "fr" ? "Une étoile, gardée" : "A star, kept") : (lang === "fr" ? "Une étoile est scellée" : "A star is sealed")}</p>
                  <p className="art-word em">{star.name}</p>
                  <div className="state-line em">
                    <span>{t.star.in} {reach.headline}</span>
                    <span className="rule" />
                    <span className="tally">{reach.gap.toFixed(1)}° {t.star.toGo}</span>
                  </div>
                  <p className="star-quote em">{t.star.moonWillReach} <span style={{ color: "var(--gold-bright)" }}>{star.name}</span>.</p>
                  <div className="em" style={metaRow}>
                    <span>☽ {shortPos(liveLon.moon)}</span><span style={{ color: "var(--gold-deep)" }}>·</span>
                    <span>{star.glyph} {shortPos(star.lon)}</span><span style={{ color: "var(--gold-deep)" }}>·</span>
                    <span>{offsetDays === 0 ? t.star.today : `+${offsetDays}d`} · {date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short" })}</span>
                  </div>
                  <input type="range" min={0} max={40} value={offsetDays} onChange={(e) => setOffsetDays(+e.target.value)} aria-label={t.star.advance}
                    className="em" style={{ width: "min(42ch,100%)", accentColor: "var(--gold)", marginBottom: 26 }} />
                  <div className="art-actions em" style={{ justifyContent: "flex-start" }}>
                    {!fulfilled
                      ? <button className="plaque" onClick={keepStar}>{t.star.keep} <span className="ar">→</span></button>
                      : <span style={{ fontFamily: "var(--body)", fontSize: 15, color: "var(--slate)" }}>{t.star.keptOn} {recordDate(star.fulfilledAt, lang, t.status.undated)}.</span>}
                    <Link className="plaque quiet" href="/checkout">{lang === "fr" ? "Faire tirer la Lecture" : "Have the Reading drawn"} <span className="ar">→</span></Link>
                  </div>
                  {natalLon && <button type="button" onClick={() => setScreen("theme")} style={{ marginTop: 22, background: "none", border: 0, padding: 0, cursor: "pointer", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold-deep)" }}>{lang === "fr" ? "Voir votre thème" : "See your chart"} →</button>}
                </div>
              </div>
            ) : (
              <div className="duo">
                <div className="instr-cell"><div className="instr-slot em"><PlanetMedallion pal={pal} glyph="✦" size={Math.round(size * 0.6)} /></div></div>
                <div className="star-ed">
                  <p className="eyebrow em">{lang === "fr" ? <>Votre <b>Étoile</b></> : <>Your <b>Star</b></>}</p>
                  <div className="state-line em"><span>{t.star.darkCap}</span><span className="rule" /></div>
                  <p className="star-quote em">{t.star.darkBody}</p>
                  <button className="plaque em" onClick={startSeal}>{t.cabinet.sealStar} <span className="ar">→</span></button>
                </div>
              </div>
            )}
          </div>
        </section>
      </>
    );
  }

  // ── shell: compute {visual, detail} per screen ──
  const arch = star ? archetypeForStar(star) : null;
  const liveSubset: LonMap = { moon: liveLon.moon, sun: liveLon.sun, venus: liveLon.venus, mars: liveLon.mars, jupiter: liveLon.jupiter, saturn: liveLon.saturn };
  const wheelSize = wide ? 340 : 262; // shell is legacy/unreachable now (all surfaces early-return)

  let visual: ReactNode = null;
  let detail: ReactNode = null;

  // NOTE: the cabinet is rendered above as the full-width gallery; this legacy block
  // is unreachable (its journal/day-record move to Genius in the next pass).
  if ((screen as string) === "cabinet") {
    const transit = star && reach
      ? `Moon ${shortPos(liveLon.moon)}. ${t.cabinet.moonFrom(reach.headline, star.name)}`
      : `Moon ${shortPos(liveLon.moon)}. ${t.cabinet.moonSun} ${shortPos(liveLon.sun)}.`;
    const panel = { padding: "12px 14px", background: pal.panel, border: `1px solid ${pal.panelLine}`, borderRadius: 3 };
    visual = <SkyWheel pal={pal} size={wheelSize} bodies={liveSubset} highlight="moon" sealedLon={star?.lon} showArc={!!star} rotation={rotation} hoverSign={hoverSign} onSign={setHoverSign} />;
    const readSections = [
      { key: "signature" as const, title: t.read.signature },
      { key: "chart" as const, title: t.read.chart },
      { key: "pattern" as const, title: t.read.pattern },
      { key: "star" as const, title: t.read.star },
      { key: "yearAhead" as const, title: t.read.yearAhead },
      { key: "counsel" as const, title: t.read.counsel },
    ];
    detail = (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {read && (
          <ReadArtifact pal={pal} read={read} sections={readSections} savePdf={t.read.savePdf} />
        )}
        <div>
          <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 28, color: pal.ink }}>{t.cabinet.todaySky}</div>
          <div style={{ fontFamily: FT, fontSize: 14.5, color: pal.inkSoft, marginTop: 4, lineHeight: 1.45 }}>{transit}</div>
        </div>
        {!read && (
        <div style={panel}>
          <Cap pal={pal}>{t.cabinet.checkoutTitle}</Cap>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FD, fontWeight: 600, fontSize: 30, color: pal.accent, lineHeight: 1 }}>{PRICING.offer}{PRICING.currency}</span>
            <span style={{ fontFamily: FD, fontStyle: "italic", fontSize: 15, color: pal.ink }}>· {PRICING.name[lang]}</span>
          </div>
          <div style={{ fontFamily: FT, fontSize: 13.5, color: pal.inkSoft, lineHeight: 1.45, marginTop: 8 }}>{PRICING.note[lang]}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            <Link href={`/checkout?lang=${lang}`} style={{ display: "inline-flex", alignItems: "center", padding: "11px 24px", borderRadius: 26, background: pal.accent, color: pal.btnInk, textDecoration: "none", fontFamily: FT, fontWeight: 500, letterSpacing: 2.5, textTransform: "uppercase", fontSize: 11 }}>{PRICING.cta[lang]}</Link>
            {/* Entry to the read. Server gate (READ_OPEN / paid cookie) enforces access.
                Re-gate or route 402→/checkout before public launch. */}
            {star && (
              <Btn pal={pal} onClick={() => setIntakeOpen(true)}>{lang === "fr" ? "Commencer la lecture" : "Begin the Read"}</Btn>
            )}
          </div>
          <div style={{ fontFamily: FT, fontSize: 12, color: pal.accent, lineHeight: 1.45, marginTop: 10 }}>{DISCLAIMER[lang]}</div>
        </div>
        )}
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <Cap pal={pal}>{t.cabinet.journal}</Cap>
            <span style={{ fontFamily: FN, fontSize: 10.5, color: pal.inkSoft }}>{t.cabinet.saved(journal.length)}</span>
          </div>
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {journal.length ? journal.map((m) => (
              <div key={`${m.createdAt ?? ""}${m.content}`} style={{ borderTop: `1px solid ${pal.panelLine}`, paddingTop: 9 }}>
                <div style={{ fontFamily: FN, fontSize: 10.5, color: pal.inkSoft }}>{recordDate(m.createdAt, lang, t.status.undated)} {recordTime(m.createdAt)}</div>
                <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 16, color: pal.ink, lineHeight: 1.3, marginTop: 3 }}>{m.content}</div>
              </div>
            )) : (
              <div style={{ fontFamily: FT, fontSize: 13.5, color: pal.inkSoft, lineHeight: 1.45 }}>{t.cabinet.emptyJournal}</div>
            )}
          </div>
        </div>
        <div style={panel}><DayRecord /></div>
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <Cap pal={pal}>{t.cabinet.ledger}</Cap>
            <span style={{ fontFamily: FN, fontSize: 10.5, color: pal.inkSoft }}>{t.cabinet.ledgerScale}</span>
          </div>
          <div style={{ marginTop: 10, display: "grid", gap: 9 }}>
            {recordedStars.length ? recordedStars.map((s) => {
              const status = ledgerStatus(s, date, lang);
              return (
                <div key={s.sealedAt} style={{ borderTop: `1px solid ${pal.panelLine}`, paddingTop: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                    <span style={{ fontFamily: FD, fontStyle: "italic", fontSize: 17, color: pal.ink }}>{s.name}</span>
                    <span style={{ fontFamily: FN, fontSize: 10.5, color: pal.inkSoft, whiteSpace: "nowrap" }}>{status.stamp}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 3, fontFamily: FT, fontSize: 12.5, color: pal.inkSoft, lineHeight: 1.35 }}>
                    <span style={{ color: status.label === "kept" ? pal.accent : pal.brass }}>{status.label}</span>
                    <span>{status.detail}</span>
                  </div>
                </div>
              );
            }) : (
              <div style={{ display: "flex", justifyContent: wide ? "flex-start" : "center", marginTop: 2 }}>
                <Btn pal={pal} solid onClick={startSeal}>{t.cabinet.sealStar}</Btn>
              </div>
            )}
          </div>
        </div>
        <div style={{ marginTop: 2 }}>
          <button onClick={() => { if (confirm(t.cabinet.closeConfirm)) { resetAll(); void cloudWipe(); setMessages([]); setLedger([]); setProfile(null); setStar(null); setRead(null); setScreen("cabinet"); } }}
            style={{ background: "none", border: "none", color: pal.inkSoft, fontFamily: FN, fontSize: 11, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>{t.cabinet.close}</button>
        </div>
      </div>
    );
  } else if (screen === "theme" && natalLon) {
    const signs = t.theme.signNames;
    const sunSign = signs[signOf(natalLon.sun)];
    const moonSign = signs[signOf(natalLon.moon)];
    const risingSign = ascVal != null ? signs[signOf(ascVal)] : undefined;
    visual = <SkyWheel pal={pal} size={wheelSize} bodies={natalLon} asc={ascVal} houses={ascVal != null} highlight={sel} rotation={rotation} hoverSign={hoverSign} onSign={setHoverSign} />;
    detail = (
      <div>
        <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: wide ? 22 : 20, color: pal.ink, lineHeight: 1.35, marginBottom: 14, textAlign: wide ? "left" : "center" }}>
          {t.theme.bigThree(sunSign, moonSign, risingSign)}
        </div>
        <div style={{ display: "flex", justifyContent: wide ? "flex-start" : "center", gap: 2, flexWrap: "wrap", marginBottom: 10 }}>
          {PLANETS.map((p) => {
            const on = sel === p.key;
            return <button key={p.key} onClick={() => setSel(p.key as DisplayPlanetKey)} style={{ appearance: "none", border: "none",
              background: on ? (night ? "rgba(217,105,75,.16)" : "rgba(124,46,44,.10)") : "transparent", cursor: "pointer",
              width: 30, height: 30, borderRadius: 16, fontFamily: FG, fontSize: 15, color: on ? pal.accent : pal.inkSoft }}>{p.glyph}</button>;
          })}
        </div>
        <div style={{ padding: "14px 16px", background: pal.panel, border: `1px solid ${pal.panelLine}`, borderRadius: 3 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap" }}>
            <span style={{ fontFamily: FG, fontSize: 18, color: night ? pal.silver : pal.ink }}>{PLANET_GLYPH[sel]}</span>
            <span style={{ fontFamily: FD, fontStyle: "italic", fontSize: 22, color: pal.ink }}>{PLANET_NAME[sel]}</span>
            <span style={{ fontFamily: FD, fontStyle: "italic", fontSize: 17, color: pal.inkSoft }}>· {shortPos(natalLon[sel])}</span>
          </div>
          <div style={{ fontFamily: FT, fontSize: 14.5, lineHeight: 1.45, marginTop: 6, color: pal.ink }}>{t.theme.read[sel]}</div>
          <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
            <span style={{ fontFamily: FN, fontSize: 10.5, padding: "3px 8px", border: `1px solid ${pal.panelLine}`, borderRadius: 2, color: pal.inkSoft }}>{degStr(natalLon[sel])}</span>
          </div>
        </div>
        <div style={{ textAlign: wide ? "left" : "center", marginTop: 14 }}>
          <Cap pal={pal} style={{ color: pal.inkSoft, marginBottom: 5 }}>{hoverSign != null ? SIGN_NAME[hoverSign] : t.theme.touchSign}</Cap>
          <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 18, color: pal.accent, lineHeight: 1.2 }}>{t.theme.bornUnder}</div>
        </div>
      </div>
    );
  }

  if (wide) {
    return (
      <DesktopShell pal={pal} night={night} par={par} date={date} frameRef={frameRef} screen={screen}
        onTab={onTab} onToggleNight={toggleNight} lang={lang} onLang={changeLang} title={t.titles[screen]} visual={visual} detail={detail} />
    );
  }

  return (
    <Frame pal={pal} night={night} par={par} date={date} frameRef={frameRef} screen={screen} onTab={onTab} withToggle onToggleNight={toggleNight} lang={lang} onLang={changeLang}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 10, marginBottom: 6 }}>
        <Cap pal={pal}>{t.titles[screen]}</Cap>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "center", flexShrink: 0, transform: `translate(${par.x * 4}px, ${par.y * 4}px)`, transition: "transform .4s ease-out" }}>{visual}</div>
        <div style={{ marginTop: 10, flex: 1, display: "flex", flexDirection: "column" }}>{detail}</div>
      </div>
    </Frame>
  );
}

export default function Page() {
  // Suspense boundary for useSearchParams (URL-driven surface).
  return (
    <Suspense fallback={null}>
      <CabinetPage />
    </Suspense>
  );
}
