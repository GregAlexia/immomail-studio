import type { Metadata } from "next";
import { CHEMIN_EN, CHEMIN_FR } from "./contenu";
import { CONTENU_FR } from "./contenu-fr";
import { Vente } from "./Vente";

// Les tarifs se règlent depuis la console : la page doit refléter le dernier
// enregistrement, pas l'état du jour où l'on a construit le site.
export const dynamic = "force-dynamic";

/**
 * Les deux langues se déclarent mutuellement, et `x-default` désigne le
 * français : c'est la langue du marché visé, et la version anglaise est un
 * complément. Aucune redirection automatique — le visiteur bascule s'il veut.
 *
 * Les chemins sont relatifs : Next les résout sur `metadataBase`, qui suit
 * `VERCEL_PROJECT_PRODUCTION_URL` et pointe donc sur le domaine public réel.
 */
const ALTERNATES = {
  canonical: CHEMIN_FR,
  languages: { fr: CHEMIN_FR, en: CHEMIN_EN, "x-default": CHEMIN_FR },
};

export const metadata: Metadata = {
  title: CONTENU_FR.meta.titre,
  description: CONTENU_FR.meta.description,
  alternates: ALTERNATES,
  openGraph: {
    title: CONTENU_FR.meta.titre,
    description: CONTENU_FR.meta.description,
    url: CHEMIN_FR,
    locale: CONTENU_FR.ogLocale,
    alternateLocale: ["en_GB"],
    type: "website",
  },
};

export default async function PageDeVente({
  searchParams,
}: {
  searchParams: Promise<{ envoye?: string; erreur?: string }>;
}) {
  const { envoye, erreur } = await searchParams;
  return <Vente contenu={CONTENU_FR} envoye={envoye} erreur={erreur} />;
}
