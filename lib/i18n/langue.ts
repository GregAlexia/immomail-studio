/**
 * Langue de l'interface de démonstration.
 *
 * Module volontairement **pur** — ni base, ni `server-only` — parce que le
 * proxy le lit sur l'edge, comme `lib/demo-profil.ts`.
 *
 * **Un cookie, pas un préfixe d'URL.** La page de vente, elle, sert l'anglais
 * sous `/en` : elle est publique et indexée, il lui faut deux adresses
 * distinctes. La démonstration n'est indexée nulle part et se parcourt sur une
 * douzaine de pages : doubler chaque route pour un réglage d'affichage
 * n'apporterait rien et casserait les liens `/c/<nom>` déjà distribués.
 */

export type Langue = "fr" | "en";

export const LANGUE_COOKIE = "demo_langue";

export const LANGUE_PAR_DEFAUT: Langue = "fr";

export function langueValide(brut: string | null | undefined): Langue | null {
  return brut === "fr" || brut === "en" ? brut : null;
}

/** L'autre langue — ce que propose le bouton de bascule. */
export function autreLangue(langue: Langue): Langue {
  return langue === "fr" ? "en" : "fr";
}

/** Étiquette du bouton : on affiche la langue vers laquelle on bascule. */
export const LIBELLE_LANGUE: Record<Langue, string> = { fr: "FR", en: "EN" };

/** Locale `Intl` / `date-fns` correspondante. */
export const LOCALE: Record<Langue, string> = { fr: "fr-FR", en: "en-GB" };
