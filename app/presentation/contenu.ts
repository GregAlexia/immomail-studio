/**
 * Le contenu de la page de vente, en français et en anglais.
 *
 * Le texte est une **donnée typée**, et le rendu (`Vente.tsx`) est partagé :
 * c'est le compilateur qui garantit alors qu'aucune traduction ne manque. Deux
 * copies de la page auraient divergé dès la première retouche.
 *
 * La version anglaise est **adaptée, pas traduite mot pour mot** — c'est la
 * convention retenue pour les autres sites de la maison. Les réalités
 * françaises du métier (mandat, DPE, quittance) sont glosées la première fois
 * qu'elles apparaissent plutôt que remplacées par un équivalent approximatif :
 * le produit s'adresse à des agences françaises, même lu en anglais.
 */

export type Langue = "fr" | "en";

export type Lien = { texte: string; href: string };

export type Apercu = {
  tete: string;
  note: string;
  valeur: string;
  ton?: "vert" | "ambre";
  legende: string;
};

export type Stat = { valeur: string; libelle: string; detail: string };

export type Oubli = {
  num: string;
  titre: string;
  probleme: string;
  reponse: string;
  label: string;
  chiffre: string;
};

export type Etape = { num: string; titre: string; texte: string };

export type Carte = { titre: string; texte: string; label: string; valeur: string };

export type Jalon = {
  etat: string;
  ton: "vif" | "tiede" | "froid";
  intro: string;
  points: string[];
};

export type Engagement = { titre: string; texte: string; lien?: Lien };

export type Question = { q: string; r: string };

export type TeteSection = { surtitre: string; titre: string; sous: string };

export type ContenuVente = {
  langue: Langue;
  /** Pour `Intl` : formatage des prix et des dates. */
  locale: string;
  ogLocale: string;
  chemin: string;
  /** La bascule vers l'autre langue. Jamais de redirection automatique. */
  bascule: { libelle: string; href: string; titre: string };

  meta: { titre: string; description: string };
  edite: string;
  nav: {
    methode: string;
    plateforme: string;
    sansFiltre: string;
    tarifs: string;
    questions: string;
    demo: string;
  };

  hero: {
    pastille: string;
    titre: [string, string];
    lead: string;
    leadFin: [string, string, string];
    ctaDemo: string;
    ctaQuestion: string;
    note: string;
    apercus: [Apercu, Apercu, Apercu, Apercu];
  };

  bande: { label: string; items: string[] };
  stats: [Stat, Stat, Stat];

  methode: TeteSection & { oublis: Oubli[] };
  pratique: TeteSection & { etapes: Etape[] };
  plateforme: TeteSection & { cartes: Carte[] };
  sansFiltre: TeteSection & { jalons: Jalon[] };

  origine: {
    surtitre: string;
    citation: string;
    paragraphes: string[];
    signature: string;
  };

  verifier: TeteSection & { engagements: Engagement[] };

  tarifs: TeteSection & {
    mention: string;
    cta: string;
    /** « Offre en cours » du bandeau. */
    banniereEtiquette: string;
    banniere: (pct: number, nom: string, fin: string | null) => string;
    /** La ligne sous le prix d'une offre en promotion. */
    reduction: (pct: number, fin: string | null) => string;
  };

  questions: { surtitre: string; titre: string; items: Question[] };

  rappel: TeteSection & {
    champs: { nom: string; agence: string; email: string; telephone: string; piege: string };
    bouton: string;
    mention: [string, string];
    messages: { envoye: string; nom: string; email: string };
  };

  appel: {
    surtitre: string;
    titre: string;
    texte: string;
    points: string[];
    ctaDemo: string;
    ctaWhatsapp: string;
  };

  pied: {
    produit: string;
    maison: string;
    aPropos: string;
    liens: { methode: string; plateforme: string; sansFiltre: string; tarifs: string; questions: string; demo: string; rappel: string };
    mentions: [string, string];
  };

  whatsapp: string;
  mail: string;
};

/** Les deux chemins servis, et eux seuls. */
export const CHEMIN_FR = "/presentation";
export const CHEMIN_EN = "/en/presentation";

/**
 * Le chemin de retour d'un envoi de formulaire.
 *
 * La valeur vient d'un champ caché, donc du visiteur : on ne la réutilise
 * qu'après l'avoir reconnue dans cette liste fermée. Une redirection construite
 * à partir d'une entrée libre est une redirection ouverte.
 */
export function cheminDeRetour(brut: FormDataEntryValue | null): string {
  return brut === CHEMIN_EN ? CHEMIN_EN : CHEMIN_FR;
}
