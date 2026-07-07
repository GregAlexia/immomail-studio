import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { db, ensureSchema } from "./db/client";
import { agencies } from "./db/schema";

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
  const id = store.get(COOKIE)?.value;
  // Par défaut : l'agence Horizon (scénario de démo complet), sinon la première.
  return all.find((a) => a.id === id) ?? all.find((a) => a.name.includes("Horizon")) ?? all[0];
}

export const AGENCY_COOKIE = COOKIE;
