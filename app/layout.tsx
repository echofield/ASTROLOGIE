import type { Metadata, Viewport } from "next";
import { Fraunces, EB_Garamond, JetBrains_Mono, Caveat } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const serif = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
  display: "swap",
});
const hand = Caveat({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lodestar — the living sky",
  description:
    "A living instrument of the sky. Name a North Star, wait for the moment the heavens open, and seal what you set out to do.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10163a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${serif.variable} ${mono.variable} ${hand.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
