import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { DDL_STATEMENTS } from "./ddl";

// PostgreSQL (Supabase). En production sur Vercel : utiliser la connection string
// du POOLER Supabase (transaction mode, port 6543) → prepared statements désactivés.
//   DATABASE_URL=postgresql://postgres.<ref>:<pwd>@aws-...pooler.supabase.com:6543/postgres
// La connexion postgres-js est paresseuse (pas de connexion à la construction),
// donc l'import au build réussit même sans DATABASE_URL. Le contrôle a lieu au
// premier accès (ensureSchema), avec un message clair.
const url = process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@127.0.0.1:5432/postgres";

const globalForDb = globalThis as unknown as {
  __pg?: ReturnType<typeof postgres>;
};

// Réutilisation de la connexion entre invocations (y compris en serverless sur
// une instance « chaude ») : indispensable pour ne pas saturer le pooler Supabase.
export const client =
  globalForDb.__pg ??
  postgres(url, {
    prepare: false, // requis avec le pooler Supabase (pgbouncer transaction mode)
    fetch_types: false, // évite le blocage en mode pooler (pas de 2e requête de types)
    // IMPÉRATIVEMENT 1 : le pooler session Supabase (Free) limite à pool_size=15
    // clients, et chaque instance serverless gelée par Vercel GARDE ses
    // connexions ouvertes. max:4 a saturé le pooler en production
    // (EMAXCONNSESSION). Les requêtes concurrentes du moteur se sérialisent au
    // driver, ce qui est indolore depuis la région dub1 (~1-2 ms par requête).
    max: 1,
    idle_timeout: 10, // relâche vite la connexion entre deux invocations
    connect_timeout: 15, // échoue vite plutôt que de pendre
    ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
  });

globalForDb.__pg = client;

export const db = drizzle(client, { schema });

// Crée les tables si absentes. Idempotent.
let migrated = false;
export async function ensureSchema() {
  if (migrated) return;
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL manquant. Renseignez la connection string Postgres (Supabase) dans .env.local / Vercel."
    );
  }
  // En production on évite de rejouer le DDL à chaque démarrage à froid
  // (latence + bruit de logs). Mais le sauter aveuglément casse la mise à jour
  // d'un schéma : à l'arrivée des espaces, la première requête cherchait une
  // colonne `workspace_id` qui n'existait pas encore, et l'application tombait.
  //
  // Une sonde d'une ligne suffit à trancher : si la colonne est là, la base est
  // à jour et on sort ; sinon on applique le DDL, idempotent, une seule fois
  // par instance.
  if (process.env.NODE_ENV === "production") {
    const [{ a_jour }] = await client.unsafe<{ a_jour: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'agencies' AND column_name = 'workspace_id'
       ) AS a_jour`
    );
    if (a_jour) {
      migrated = true;
      return;
    }
  }
  for (const stmt of DDL_STATEMENTS) {
    await client.unsafe(stmt);
  }
  migrated = true;
}
