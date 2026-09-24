import type { Metadata } from "next";
import { CHEMIN_EN, CHEMIN_FR } from "@/app/presentation/contenu";
import { CONTENU_EN } from "@/app/presentation/contenu-en";
import { Vente } from "@/app/presentation/Vente";

export const dynamic = "force-dynamic";

/**
 * Version anglaise, sous le préfixe `/en` — la convention des autres sites de
 * la maison (`agenia.pro/en/…`, `margeo.agenia.pro/en`).
 *
 * `x-default` désigne le français, pas l'anglais : c'est la langue du marché
 * visé. Les deux pages déclarent exactement les mêmes alternatives, faute de
 * quoi les moteurs ignorent la paire.
 */
const ALTERNATES = {
  canonical: CHEMIN_EN,
  languages: { fr: CHEMIN_FR, en: CHEMIN_EN, "x-default": CHEMIN_FR },
};

export const metadata: Metadata = {
  title: CONTENU_EN.meta.titre,
  description: CONTENU_EN.meta.description,
  alternates: ALTERNATES,
  openGraph: {
    title: CONTENU_EN.meta.titre,
    description: CONTENU_EN.meta.description,
    url: CHEMIN_EN,
    locale: CONTENU_EN.ogLocale,
    alternateLocale: ["fr_FR"],
    type: "website",
  },
};

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ envoye?: string; erreur?: string }>;
}) {
  const { envoye, erreur } = await searchParams;
  return <Vente contenu={CONTENU_EN} envoye={envoye} erreur={erreur} />;
}
