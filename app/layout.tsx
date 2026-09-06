import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ProspectTracker } from "@/components/ProspectTracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// URL de production fournie par Vercel : suit automatiquement un renommage
// de projet (donc de domaine) sans retoucher le code.
const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";
const TITLE = "Keo — Démo automatisations agences immobilières";
const DESCRIPTION =
  "SaaS de démonstration : 11 automatisations métier pour agences immobilières, avec horloge simulée.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Keo",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full">
        {children}
        {/* Composants clients isolés : la frontière client reste confinée ici,
            le reste de l'arbre demeure rendu côté serveur.
            `<Analytics />` d'abord : son effet installe `window.va`, dont
            dépend l'événement émis par `<ProspectTracker />`. Ce dernier sait
            s'en passer (il crée la file au besoin), mais l'ordre naturel évite
            de faire reposer le suivi sur ce filet de sécurité. */}
        <Analytics />
        <ProspectTracker />
      </body>
    </html>
  );
}
