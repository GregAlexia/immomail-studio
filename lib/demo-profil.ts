/**
 * Profil de démonstration porté par l'URL (`?p=`).
 *
 * `?p=lyon` ouvre la démo sur l'agence de Lyon, `?p=keo` sur Keo : chaque
 * commercial reçoit un lien qui tombe d'emblée sur le bon jeu de données.
 *
 * Module volontairement **pur** — ni base, ni `server-only` — parce que ses
 * deux appelants ne tournent pas au même endroit : le middleware sur l'edge
 * (qui n'a aucun accès à Postgres) et `lib/agency.ts` côté Node. Le middleware
 * se contente donc de mémoriser l'étiquette, la résolution vers une agence se
 * faisant là où la liste est connue.
 */

export const PROFIL_COOKIE = "demo_profil";

// Nom d'affichage porté par `?n=` : purement cosmétique, jamais écrit en base.
export const NOM_COOKIE = "demo_nom";

// Commercial à l'origine de l'ouverture.
export const COMMERCIAL_COOKIE = "demo_commercial";

/**
 * Lien nominatif par chemin : `/c/phil`, `/c/ced`…
 *
 * Le plan Hobby ne donne accès qu'aux **pages vues**, pas aux propriétés des
 * événements personnalisés (`vercel.analytics_event.count` n'existe pas sur ce
 * compte). Un paramètre `?c=phil` est donc invisible dans les statistiques,
 * alors qu'un chemin distinct est compté séparément dans le panneau « Pages ».
 * D'où ce détour : le chemin porte l'information, le proxy réécrit vers
 * l'accueil sans changer l'URL affichée.
 */
export const CHEMIN_COMMERCIAL = /^\/c\/([a-z0-9-]{1,60})\/?$/;

/**
 * Profil servi par défaut aux liens `/c/…`. Les trois commerciaux démontrent
 * le même jeu ; `/c/phil?p=lyon` permet d'en changer ponctuellement.
 */
export const PROFIL_PAR_DEFAUT = "keo";

// Même expression que pour les étiquettes de traçage : la valeur vient de
// l'URL, donc du visiteur.
export const ETIQUETTE_VALIDE = /^[a-z0-9-]{1,60}$/;

// Plage des diacritiques combinants, en échappement explicite : écrite en
// caractères littéraux, elle serait à la merci d'un ré-encodage du fichier.
const DIACRITIQUES = /[\u0300-\u036f]/g;

/** « Charleville-Mézières » → « charleville-mezieres ». */
export function normaliser(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(DIACRITIQUES, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// « agence » figure dans les quatre noms, « immobilier » dans deux : les
// retenir ferait correspondre une étiquette générique à la première agence
// venue, au hasard de l'ordre alphabétique.
const SEGMENTS_IGNORES = new Set(["agence", "immobilier", "immobiliere"]);

function segments(valeur: string | null | undefined): string[] {
  if (!valeur) return [];
  return normaliser(valeur)
    .split("-")
    .filter((s) => s.length > 0 && !SEGMENTS_IGNORES.has(s));
}

/**
 * L'étiquette désigne-t-elle cette agence ? On accepte la ville entière
 * (`charleville-mezieres`) aussi bien qu'un seul de ses mots (`charleville`),
 * et de même pour le nom (`keo` pour « Agence Keo »).
 */
export function correspond(
  etiquette: string,
  agence: { name: string; city: string | null }
): boolean {
  if (agence.city && normaliser(agence.city) === etiquette) return true;
  return segments(agence.name).includes(etiquette) || segments(agence.city).includes(etiquette);
}

// Mots que le français laisse en minuscules à l'intérieur d'un nom propre.
const PARTICULES = new Set(["de", "du", "des", "la", "le", "les", "et", "en", "sur", "au", "aux"]);

/**
 * Étiquette d'URL → nom affichable : « cabinet-durand » donne « Cabinet Durand »,
 * « agence-du-centre » donne « Agence du Centre ».
 *
 * L'étiquette reste contrainte à `^[a-z0-9-]{1,60}$` : ni accent, ni apostrophe.
 * C'est délibéré — la valeur vient de l'URL et finit à l'écran, y compris dans
 * les emails générés par la démonstration. Un jeu de caractères restreint évite
 * qu'un lien forgé n'affiche n'importe quoi.
 */
export function nomAffichable(etiquette: string): string {
  return etiquette
    .split("-")
    .filter((mot) => mot.length > 0)
    .map((mot, i) =>
      i > 0 && PARTICULES.has(mot) ? mot : mot.charAt(0).toUpperCase() + mot.slice(1)
    )
    .join(" ");
}
