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

export type EspaceResume = {
  id: string;
  nom: string;
  creeLe: string;
  agences: number;
  horloge: string | null;
  derniereVue: string | null;
  vues: number;
};

/**
 * Tous les espaces, pour la console d'administration.
 *
 * L'identifiant de l'espace **est** l'étiquette du commercial : c'est ce qui
 * permet de rapprocher un espace de son trafic sans table de correspondance —
 * `audience_vues.commercial` porte la même valeur que `workspaces.id`.
 */
export async function listerEspaces(): Promise<EspaceResume[]> {
  await ensureSchema();
  return client.unsafe<EspaceResume[]>(
    `SELECT w.id,
            w.name                                   AS nom,
            w.created_at                             AS "creeLe",
            (SELECT COUNT(*) FROM agencies a WHERE a.workspace_id = w.id)::int AS agences,
            (SELECT c.current_ts FROM demo_clock c WHERE c.id = w.id)          AS horloge,
            (SELECT MAX(v.vu_le) FROM audience_vues v WHERE v.commercial = w.id) AS "derniereVue",
            (SELECT COUNT(*) FROM audience_vues v WHERE v.commercial = w.id)::int AS vues
       FROM workspaces w
      ORDER BY w.created_at`
  );
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
