import { randomUUID } from "node:crypto";
import { client, db, ensureSchema } from "./client";
import { audienceVues } from "./schema";
import type { Lieu } from "../geo";

/**
 * Journal d'audience — écriture et agrégats.
 *
 * Module sans `server-only` : la console et la route d'enregistrement
 * l'importent tous deux, et il n'y a aucune raison de le rendre indisponible
 * à un script de maintenance.
 */

export type Vue = {
  chemin: string;
  commercial: string | null;
  profil: string | null;
  referent: string | null;
  lieu: Lieu;
};

export async function enregistrerVue(vue: Vue): Promise<void> {
  await ensureSchema();
  await db.insert(audienceVues).values({
    id: randomUUID(),
    chemin: vue.chemin,
    commercial: vue.commercial,
    profil: vue.profil,
    pays: vue.lieu.pays,
    region: vue.lieu.region,
    ville: vue.lieu.ville,
    referent: vue.referent,
    vuLe: new Date().toISOString(),
  });
}

/** Borne basse ISO d'une fenêtre glissante de `jours` jours. */
function depuis(jours: number): string {
  return new Date(Date.now() - jours * 24 * 60 * 60 * 1000).toISOString();
}

export type Total = { libelle: string; total: number };

async function comptePar(colonne: string, jours: number, limite = 12): Promise<Total[]> {
  await ensureSchema();
  // `colonne` ne vient jamais d'une entrée utilisateur : les quatre appels
  // ci-dessous passent un littéral. Aucune valeur de requête n'est interpolée,
  // la fenêtre part en paramètre.
  const lignes = await client.unsafe<{ libelle: string | null; total: string }[]>(
    `SELECT ${colonne} AS libelle, COUNT(*) AS total
       FROM audience_vues
      WHERE vu_le >= $1 AND ${colonne} IS NOT NULL
      GROUP BY ${colonne}
      ORDER BY total DESC
      LIMIT ${limite}`,
    [depuis(jours)]
  );
  return lignes.map((l) => ({ libelle: l.libelle ?? "—", total: Number(l.total) }));
}

export const vuesParChemin = (jours: number) => comptePar("chemin", jours);
export const vuesParCommercial = (jours: number) => comptePar("commercial", jours);
export const vuesParPays = (jours: number) => comptePar("pays", jours, 8);
export const vuesParVille = (jours: number) => comptePar("ville", jours, 10);

export async function nombreDeVues(jours: number): Promise<number> {
  await ensureSchema();
  const [ligne] = await client.unsafe<{ total: string }[]>(
    `SELECT COUNT(*) AS total FROM audience_vues WHERE vu_le >= $1`,
    [depuis(jours)]
  );
  return Number(ligne?.total ?? 0);
}

export type Jour = { jour: string; total: number };

/**
 * Fréquentation quotidienne, **trous compris**.
 *
 * `generate_series` produit la suite complète des jours : sans elle, un jour
 * sans visite disparaîtrait du graphique et deux semaines creuses
 * ressembleraient à deux jours calmes.
 */
export async function vuesParJour(jours: number): Promise<Jour[]> {
  await ensureSchema();
  const lignes = await client.unsafe<{ jour: string; total: string }[]>(
    `WITH serie AS (
       SELECT generate_series(
         (now() AT TIME ZONE 'UTC')::date - ($1::int - 1),
         (now() AT TIME ZONE 'UTC')::date,
         '1 day'
       )::date AS jour
     )
     SELECT to_char(s.jour, 'YYYY-MM-DD') AS jour,
            COUNT(v.id) AS total
       FROM serie s
       LEFT JOIN audience_vues v ON substring(v.vu_le from 1 for 10) = to_char(s.jour, 'YYYY-MM-DD')
      GROUP BY s.jour
      ORDER BY s.jour`,
    [jours]
  );
  return lignes.map((l) => ({ jour: l.jour, total: Number(l.total) }));
}

export type DerniereVue = {
  chemin: string;
  commercial: string | null;
  pays: string | null;
  region: string | null;
  ville: string | null;
  vuLe: string;
};

export async function dernieresVues(limite = 30): Promise<DerniereVue[]> {
  await ensureSchema();
  return client.unsafe<DerniereVue[]>(
    `SELECT chemin, commercial, pays, region, ville, vu_le AS "vuLe"
       FROM audience_vues
      ORDER BY vu_le DESC
      LIMIT ${Math.min(Math.max(limite, 1), 200)}`
  );
}
