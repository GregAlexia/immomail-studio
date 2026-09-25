/**
 * Le guide intégré, en données.
 *
 * Le guide était 269 lignes de JSX où la prose et le balisage s'entremêlaient :
 * impossible à traduire sans le réécrire deux fois, et deux copies auraient
 * divergé à la première correction. Il devient ici une structure typée, rendue
 * par `app/(app)/aide/page.tsx`.
 *
 * Les mises en valeur survivent par un **balisage léger** dans les chaînes :
 *
 *   `**gras**`   → <strong>
 *   `` `code` `` → puce monospace
 *
 * Tout aplatir aurait fait perdre au guide sa lisibilité ; garder du JSX aurait
 * fait perdre la traduisibilité. Le balisage réconcilie les deux.
 */

export type LigneTableau = { controle: string; effet: string };

export type Encadre = { ton: "info" | "note"; texte: string };

export type SectionAide = {
  id: string;
  /** Clé d'icône, résolue par la page — une icône ne se sérialise pas. */
  icone:
    | "rocket"
    | "inbox"
    | "agenda"
    | "quittance"
    | "mandat"
    | "conformite"
    | "marketing"
    | "journal"
    | "envoi";
  titre: string;
  /** Sur-titre en couleur, au-dessus du paragraphe d'introduction. */
  chapeau?: string;
  intro?: string;
  /** Deux cartes côte à côte — seulement sur la prise en main. */
  cartes?: { titre: string; texte: string }[];
  tableau?: { colonnes: [string, string]; lignes: LigneTableau[] };
  etapes?: string[];
  encadres?: Encadre[];
};

export type ContenuAide = {
  titre: string;
  description: string;
  sommaire: string;
  /** Avertissement violet, avant les espaces masqués par défaut. */
  espacesMasques: string;
  sections: SectionAide[];
};
