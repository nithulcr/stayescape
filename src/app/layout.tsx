import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { brand, siteUrl } from "@/lib/config";
import { Boldonse, Roboto } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
const boldonse = Boldonse({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-boldonse",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    url: siteUrl,
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
    <html lang="en" className={`${boldonse.variable} ${roboto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
