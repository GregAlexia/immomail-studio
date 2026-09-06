import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { COMMERCIAL_COOKIE, ETIQUETTE_VALIDE } from "./demo-profil";
import { ESPACE_PARTAGE } from "./db/espaces";

/**
 * Quel espace de démonstration sert-on à cette requête ?
 *
 * Un espace = un jeu de données complet, isolé des autres. Toute donnée métier
 * pend d'une agence et toute agence d'un espace : filtrer les agences
 * (`lib/agency.ts`) isole donc l'application entière, sans toucher à une seule
 * requête métier.
 *
 * **L'identifiant de l'espace EST l'étiquette du commercial** — `phil`, `ced` —
 * celle que porte le lien `/c/phil` et que le proxy dépose en cookie. Pas de
 * table de correspondance : le cookie suffit.
 *
 * La démonstration n'ayant aucune authentification, c'est le lien qui tient
 * lieu d'identité. Un visiteur sans lien nominatif atterrit sur l'espace
 * partagé, qui reproduit le comportement d'avant les espaces.
 *
 * Les opérations sur la base vivent dans `lib/db/espaces.ts`, sans
 * `server-only`, pour rester utilisables depuis `npm run seed`.
 */
export const getEspaceCourantId = cache(async (): Promise<string> => {
  const brut = (await cookies()).get(COMMERCIAL_COOKIE)?.value;
  return brut && ETIQUETTE_VALIDE.test(brut) ? brut : ESPACE_PARTAGE;
});

export { ESPACE_PARTAGE, espaceExiste, reserverEspace, supprimerDonneesEspace } from "./db/espaces";
