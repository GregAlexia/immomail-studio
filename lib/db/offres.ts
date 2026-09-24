import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { db, ensureSchema } from "./client";
import { offres } from "./schema";

/**
 * Offres commerciales : lecture, écriture, et le calcul du prix affiché.
 *
 * Tout tient ici parce que tout est solidaire : une réduction n'a de sens qu'avec
 * sa date de fin, et un prix affiché n'a de sens qu'après application de l'une et
 * vérification de l'autre.
 */

export type Offre = typeof offres.$inferSelect;

/**
 * La date du jour à Paris, pas celle d'UTC.
 *
 * Entre minuit et deux heures du matin, l'UTC est encore la veille : une offre
 * expirée ce soir resterait affichée, ou l'inverse. `fr-CA` est le raccourci
 * habituel pour obtenir un AAAA-MM-JJ, format déjà utilisé en base.
 */
export function aujourdhui(): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

export type PrixAffiche = {
  /** Prix payé, réduction déduite, en centimes. */
  centimes: number;
  /** Prix barré, seulement si une réduction court. */
  barreCentimes: number | null;
  reductionPct: number;
  finOffre: string | null;
};

/**
 * Une réduction sans date de fin court indéfiniment ; avec une date, elle
 * s'arrête d'elle-même le lendemain. Personne n'a à repasser derrière.
 */
export function reductionActive(offre: Pick<Offre, "reductionPct" | "finOffre">): boolean {
  if (offre.reductionPct <= 0) return false;
  return !offre.finOffre || offre.finOffre >= aujourdhui();
}

export function prixAffiche(offre: Offre): PrixAffiche {
  if (!reductionActive(offre)) {
    return { centimes: offre.prixCentimes, barreCentimes: null, reductionPct: 0, finOffre: null };
  }
  // Arrondi au centime, vers le bas : afficher un prix réduit supérieur au
  // calcul serait une promesse non tenue.
  const centimes = Math.floor((offre.prixCentimes * (100 - offre.reductionPct)) / 100);
  return {
    centimes,
    barreCentimes: offre.prixCentimes,
    reductionPct: offre.reductionPct,
    finOffre: offre.finOffre,
  };
}

/**
 * Montant à l'affichage. Pas de mention « HT » : AgenIA relève de la franchise
 * en base de TVA (article 293 B), le prix affiché est celui qui est payé.
 */
export function formaterPrix(centimes: number): string {
  const euros = centimes / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: euros % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(euros);
}

export function formaterDate(iso: string): string {
  const [a, m, j] = iso.split("-");
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
    new Date(Number(a), Number(m) - 1, Number(j))
  );
}

/** Les arguments d'une offre : une ligne saisie = une puce affichée. */
export function pointsDeLOffre(offre: Offre): string[] {
  return (offre.points ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export async function listerOffres(): Promise<Offre[]> {
  await ensureSchema();
  return db.select().from(offres).orderBy(asc(offres.rang), asc(offres.nom));
}

/** Celles que le visiteur voit : publiées, dans l'ordre choisi. */
export async function offresPubliees(): Promise<Offre[]> {
  return (await listerOffres()).filter((o) => o.publiee);
}

export type SaisieOffre = {
  nom: string;
  detail: string | null;
  prixCentimes: number;
  reductionPct: number;
  finOffre: string | null;
  points: string | null;
  rang: number;
  miseEnAvant: boolean;
  publiee: boolean;
};

export async function creerOffre(saisie: SaisieOffre): Promise<void> {
  await ensureSchema();
  await db.insert(offres).values({ id: randomUUID(), ...saisie, majLe: new Date().toISOString() });
}

export async function modifierOffre(id: string, saisie: SaisieOffre): Promise<void> {
  await ensureSchema();
  await db
    .update(offres)
    .set({ ...saisie, majLe: new Date().toISOString() })
    .where(eq(offres.id, id));
}

export async function supprimerOffre(id: string): Promise<void> {
  await ensureSchema();
  await db.delete(offres).where(eq(offres.id, id));
}
