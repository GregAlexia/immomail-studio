import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { LANGUE_COOKIE, LANGUE_PAR_DEFAUT, langueValide, type Langue } from "./langue";
import { EN } from "./en";

/**
 * Traduction de l'interface de démonstration.
 *
 * **La chaîne française est la clé** — la convention de `gettext`. Sur treize
 * pages déjà écrites, substituer partout des identifiants abstraits
 * (`leads.titre`) aurait demandé de réécrire chaque page et d'en relire la mise
 * en page ; ici l'on enveloppe la chaîne existante, et un oubli laisse le
 * français à l'écran plutôt qu'une clé nue.
 *
 * Le filet manquant — le compilateur ne voit rien — est tendu par
 * `scripts/verifier-traductions.ts`, qui liste les `t("…")` sans traduction.
 *
 * Les composants clients ne traduisent pas eux-mêmes : leur parent serveur leur
 * passe des chaînes déjà traduites. Rien à charger côté navigateur.
 */

export const getLangue = cache(async (): Promise<Langue> => {
  const brut = (await cookies()).get(LANGUE_COOKIE)?.value;
  return langueValide(brut) ?? LANGUE_PAR_DEFAUT;
});

export type Traducteur = (fr: string) => string;

/** Traduit, ou rend le français inchangé. */
export function traduire(langue: Langue, fr: string): string {
  if (langue === "fr") return fr;
  return EN[fr] ?? fr;
}

export const traducteur = cache(async (): Promise<Traducteur> => {
  const langue = await getLangue();
  return (fr: string) => traduire(langue, fr);
});

export { LANGUE_COOKIE, LANGUE_PAR_DEFAUT, autreLangue, langueValide, LIBELLE_LANGUE, LOCALE } from "./langue";
export type { Langue } from "./langue";
