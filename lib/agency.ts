import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { db, ensureSchema } from "./db/client";
import { agencies } from "./db/schema";
import { PROFIL_COOKIE, correspond } from "./demo-profil";

const COOKIE = "agency_id";

export type Agency = typeof agencies.$inferSelect;

// Mémoïsé par requête : layout, page et actions appellent tous getAgencies()/
// getSelectedAgency() sur le même rendu — évite les allers-retours DB dupliqués.
export const getAgencies = cache(async (): Promise<Agency[]> => {
  await ensureSchema();
  return db.select().from(agencies).orderBy(agencies.name);
});

export async function getSelectedAgency(): Promise<Agency | null> {
  const all = await getAgencies();
  if (all.length === 0) return null;
  const store = await cookies();

  // Le profil porté par le lien (`?p=lyon`) prime : le commercial vient
  // d'ouvrir une URL qui désigne un jeu précis, et c'est celui-là qu'il doit
  // montrer. `setAgency` efface ce cookie, de sorte qu'un choix manuel dans le
  // sélecteur reprenne ensuite la main jusqu'au prochain lien.
  // Une étiquette qui ne désigne aucune agence est ignorée sans bruit : elle
  // reste une simple étiquette de traçage, ce qu'elle était avant.
  const profil = store.get(PROFIL_COOKIE)?.value;
  if (profil) {
    const parProfil = all.find((a) => correspond(profil, a));
    if (parProfil) return parProfil;
  }

  const id = store.get(COOKIE)?.value;
  // Par défaut : l'agence Horizon (scénario de démo complet), sinon la première.
  return all.find((a) => a.id === id) ?? all.find((a) => a.name.includes("Horizon")) ?? all[0];
}

export const AGENCY_COOKIE = COOKIE;
