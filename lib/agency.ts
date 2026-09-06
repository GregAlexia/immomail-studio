import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, ensureSchema } from "./db/client";
import { agencies } from "./db/schema";
import { ETIQUETTE_VALIDE, NOM_COOKIE, PROFIL_COOKIE, correspond, nomAffichable } from "./demo-profil";
import { getEspaceCourantId } from "./espaces";
import { reserverEspace } from "./db/espaces";
import { semerEspace } from "./seed-data";

const COOKIE = "agency_id";

export type Agency = typeof agencies.$inferSelect;

/**
 * Les agences de l'espace courant — et d'aucun autre.
 *
 * **C'est ici que se joue l'isolation.** Toute donnée métier pend d'une agence,
 * et `lib/queries.ts` part toujours d'un `agencyId` issu de cette liste : la
 * restreindre à l'espace du commercial isole l'application entière, sans
 * toucher à une seule requête métier.
 *
 * Mémoïsé par requête : layout, pages et Server Actions l'appellent tous sur le
 * même rendu.
 */
export const getAgencies = cache(async (): Promise<Agency[]> => {
  await ensureSchema();
  const espace = await getEspaceCourantId();
  const lire = () =>
    db.select().from(agencies).where(eq(agencies.workspaceId, espace)).orderBy(agencies.name);

  const rows = await lire();
  if (rows.length > 0) return rows;

  // Premier passage d'un commercial : son espace n'existe pas encore, on le
  // sème à la volée. `reserverEspace` n'accorde la création qu'à un seul
  // appelant ; les autres relisent simplement, et retombent au pire sur l'écran
  // « espace vide » le temps que le gagnant termine.
  if (await reserverEspace(espace, nomAffichable(espace))) {
    await semerEspace(espace);
  }
  return lire();
});

/** Ce que les cookies posés par le lien (`?p=`, `?n=`) demandent d'afficher. */
async function contexteDuLien(): Promise<{ profil?: string; idChoisi?: string; nom: string | null }> {
  const store = await cookies();
  const brut = store.get(NOM_COOKIE)?.value;
  return {
    profil: store.get(PROFIL_COOKIE)?.value,
    idChoisi: store.get(COOKIE)?.value,
    nom: brut && ETIQUETTE_VALIDE.test(brut) ? nomAffichable(brut) : null,
  };
}

/**
 * L'agence à afficher, résolue sur les noms **réels**.
 *
 * L'ordre compte : le profil du lien prime, car le commercial vient d'ouvrir
 * une URL qui désigne un jeu précis. `setAgency` efface ce cookie, de sorte
 * qu'un choix manuel dans le sélecteur reprenne la main jusqu'au prochain lien.
 * Une étiquette qui ne désigne aucune agence est ignorée sans bruit : elle
 * reste une simple étiquette de traçage.
 */
function resoudre(all: Agency[], profil?: string, idChoisi?: string): Agency {
  if (profil) {
    const parProfil = all.find((a) => correspond(profil, a));
    if (parProfil) return parProfil;
  }
  // Par défaut : l'agence Horizon (scénario de démo complet), sinon la première.
  return all.find((a) => a.id === idChoisi) ?? all.find((a) => a.name.includes("Horizon")) ?? all[0];
}

export async function getSelectedAgency(): Promise<Agency | null> {
  const all = await getAgencies();
  if (all.length === 0) return null;
  const { profil, idChoisi, nom } = await contexteDuLien();
  const agence = resoudre(all, profil, idChoisi);
  return nom ? { ...agence, name: nom } : agence;
}

/**
 * La liste telle qu'elle doit apparaître dans le sélecteur : seule l'agence
 * affichée porte le nom du lien, les autres gardent le leur. Sans cette
 * fonction, le sélecteur afficherait « Agence Keo » pendant que le titre de la
 * page annonce « Cabinet Durand ».
 *
 * `getAgencies()` reste volontairement inchangée : c'est sur les noms réels que
 * `resoudre()` fait sa correspondance, et la renommer d'abord casserait
 * `?p=keo` dès qu'un `?n=` serait posé.
 */
export async function getAgenciesAffichees(): Promise<Agency[]> {
  const all = await getAgencies();
  if (all.length === 0) return all;
  const { profil, idChoisi, nom } = await contexteDuLien();
  if (!nom) return all;
  const cible = resoudre(all, profil, idChoisi);
  return all.map((a) => (a.id === cible.id ? { ...a, name: nom } : a));
}

export const AGENCY_COOKIE = COOKIE;
