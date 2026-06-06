import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Spectral } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PRODUCT_NAME } from "@/lib/brand";
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
  title: PRODUCT_NAME,
  description:
    "Personalized digital entertainment and self-reflection reports based on your sky, intentions, and daily record.",
  metadataBase: new URL("https://the-astrolab.app"),
  openGraph: {
    title: PRODUCT_NAME,
    description: "Personalized digital entertainment and self-reflection reports.",
    url: "https://the-astrolab.app",
    siteName: PRODUCT_NAME,
  },
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
      <body className={`${display.variable} ${text.variable}`}>{children}<Analytics /></body>
    </html>
  );
}
