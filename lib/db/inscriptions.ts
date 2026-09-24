import { randomUUID } from "node:crypto";
import { desc } from "drizzle-orm";
import { db, ensureSchema } from "./client";
import { inscriptions } from "./schema";
import type { Lieu } from "../geo";

/** Demandes de rappel déposées depuis la page de vente. */

export type Inscription = typeof inscriptions.$inferSelect;

// Volontairement permissive : elle écarte les saisies manifestement fautives
// (« jean.dupont », « @agence.fr ») sans prétendre décider qu'une adresse
// existe — seule la réponse à un envoi le dirait.
const EMAIL_PLAUSIBLE = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/;

export function emailPlausible(valeur: string): boolean {
  return valeur.length <= 180 && EMAIL_PLAUSIBLE.test(valeur);
}

export type SaisieInscription = {
  nom: string;
  agence: string | null;
  email: string;
  telephone: string | null;
  commercial: string | null;
  lieu: Lieu;
};

export async function enregistrerInscription(saisie: SaisieInscription): Promise<void> {
  await ensureSchema();
  await db.insert(inscriptions).values({
    id: randomUUID(),
    nom: saisie.nom,
    agence: saisie.agence,
    email: saisie.email.toLowerCase(),
    telephone: saisie.telephone,
    commercial: saisie.commercial,
    // Le lieu sert à savoir d'où vient la demande, comme pour le journal
    // d'audience — et pas davantage : l'adresse IP n'est pas conservée.
    pays: saisie.lieu.pays,
    ville: saisie.lieu.ville,
    creeLe: new Date().toISOString(),
  });
}

export async function listerInscriptions(limite = 200): Promise<Inscription[]> {
  await ensureSchema();
  return db
    .select()
    .from(inscriptions)
    .orderBy(desc(inscriptions.creeLe))
    .limit(Math.min(Math.max(limite, 1), 500));
}

export async function nombreInscriptions(): Promise<number> {
  return (await listerInscriptions(500)).length;
}
