import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { brand, getSeoOrigin, siteUrl } from "@/lib/config";
import { Mona_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "lenis/dist/lenis.css";
const boldonse = localFont({
  src: "../fonts/Boldonse-latin.woff2",
  display: "swap",
  weight: "400",
  variable: "--font-boldonse",
  adjustFontFallback: false,
});

const monaSans = Mona_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mona-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  keywords: [
    "Kerala staycation",
    "resorts in Kerala",
    "homestays in Wayanad",
    "private pool villas in Kerala",
    "best staycation places in Kerala",
    "Munnar resorts",
    "Alleppey houseboats",
  ],
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    url: getSeoOrigin() ?? undefined,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#123D32",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${boldonse.variable} ${monaSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
