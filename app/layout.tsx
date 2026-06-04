import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Spectral } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const text = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Astrolabe",
  description:
    "A personal celestial instrument. Cast your sky, seal a star, and watch the moving heavens travel toward it.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0D1C",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Symbols+2&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${display.variable} ${text.variable}`}>{children}</body>
    </html>
  );
}
