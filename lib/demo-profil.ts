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
