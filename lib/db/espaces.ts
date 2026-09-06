import { eq } from "drizzle-orm";
import { client, db, ensureSchema } from "./client";
import { TABLES_PAR_AGENCE } from "./ddl";
import { workspaces } from "./schema";

/**
 * Espaces de démonstration — opérations sur la base.
 *
 * Module **sans** `server-only` ni `next/headers`, délibérément : `npm run seed`
 * et les scripts de vérification l'importent depuis un `tsx` autonome, où
 * `server-only` n'est pas résoluble (Next l'aliase en interne). La partie qui
 * lit le cookie du commercial vit dans `lib/espaces.ts`, elle réservée au
 * serveur.
 */

/** Espace des visiteurs sans lien nominatif — la démo publique d'origine. */
export const ESPACE_PARTAGE = "demo";

/**
 * Réserve l'espace si personne ne l'a encore créé.
 *
 * Renvoie `true` au seul appelant qui a effectivement inséré la ligne :
 * `onConflictDoNothing().returning()` rend un tableau vide aux perdants. Deux
 * onglets ouverts en même temps sur `/c/phil` ne peuvent donc pas semer
 * l'espace deux fois, sans verrou ni transaction explicite.
 */
export async function reserverEspace(id: string, nom: string): Promise<boolean> {
  await ensureSchema();
  const cree = await db
    .insert(workspaces)
    .values({ id, name: nom, createdAt: new Date().toISOString() })
    .onConflictDoNothing()
    .returning({ id: workspaces.id });
  return cree.length > 0;
}

/** L'espace a-t-il déjà été créé ? */
export async function espaceExiste(id: string): Promise<boolean> {
  await ensureSchema();
  const lignes = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.id, id));
  return lignes.length > 0;
}

/**
 * Vide un espace, et lui seul.
 *
 * Le prédécesseur de cette fonction supprimait le contenu de **toutes** les
 * tables : une réinitialisation ou un import lancé pendant la démonstration
 * d'un collègue effaçait la sienne, en direct. C'est précisément ce que les
 * espaces corrigent — ce bornage est donc le cœur du dispositif.
 *
 * `TABLES_PAR_AGENCE` va des tables dépendantes vers les autres ; les agences
 * partent en dernier, une fois plus rien ne les référençant.
 */
export async function supprimerDonneesEspace(workspaceId: string): Promise<void> {
  await ensureSchema();
  for (const table of TABLES_PAR_AGENCE) {
    await client.unsafe(
      `DELETE FROM ${table} WHERE agency_id IN (SELECT id FROM agencies WHERE workspace_id = $1)`,
      [workspaceId]
    );
  }
  await client.unsafe(`DELETE FROM agencies WHERE workspace_id = $1`, [workspaceId]);
  await client.unsafe(`DELETE FROM demo_clock WHERE id = $1`, [workspaceId]);
}
