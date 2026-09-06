import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { db, ensureSchema } from "./db/client";
import { agencies } from "./db/schema";
import { ETIQUETTE_VALIDE, NOM_COOKIE, PROFIL_COOKIE, correspond, nomAffichable } from "./demo-profil";

const COOKIE = "agency_id";

export type Agency = typeof agencies.$inferSelect;

// Mémoïsé par requête : layout, page et actions appellent tous getAgencies()/
// getSelectedAgency() sur le même rendu — évite les allers-retours DB dupliqués.
export const getAgencies = cache(async (): Promise<Agency[]> => {
  await ensureSchema();
  return db.select().from(agencies).orderBy(agencies.name);
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
