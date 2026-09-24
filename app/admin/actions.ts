"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerAdmin } from "@/lib/admin-session";
import { creerOffre, modifierOffre, supprimerOffre, type SaisieOffre } from "@/lib/db/offres";

/**
 * Écritures de la console.
 *
 * Chaque action commence par `exigerAdmin()`. Ce n'est pas une redite du layout :
 * une Server Action est un point d'entrée HTTP à part entière, appelable par POST
 * sans jamais passer par la page qui l'affiche. Protéger l'affichage ne protège
 * pas l'écriture.
 */

/** « 149 », « 149,50 », « 1 490.00 » → centimes entiers. */
function centimes(brut: string): number | null {
  const propre = brut.replace(/\s| |€/g, "").replace(",", ".");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(propre)) return null;
  return Math.round(Number(propre) * 100);
}

function texte(valeur: FormDataEntryValue | null, max: number): string {
  return typeof valeur === "string" ? valeur.trim().slice(0, max) : "";
}

function optionnel(valeur: FormDataEntryValue | null, max: number): string | null {
  const v = texte(valeur, max);
  return v.length > 0 ? v : null;
}

function entier(valeur: FormDataEntryValue | null, min: number, max: number): number {
  const n = Number(texte(valeur, 12));
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(Math.round(n), min), max);
}

const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

type Lecture = { saisie: SaisieOffre } | { erreur: string };

function lireOffre(donnees: FormData): Lecture {
  const nom = texte(donnees.get("nom"), 80);
  if (nom.length === 0) return { erreur: "nom" };

  const prix = centimes(texte(donnees.get("prix"), 20));
  if (prix === null) return { erreur: "prix" };

  const fin = optionnel(donnees.get("finOffre"), 10);
  if (fin && !DATE_ISO.test(fin)) return { erreur: "date" };

  // Une réduction de 100 % afficherait « 0 € » sur la page de vente ; au-delà de
  // 90 % c'est presque toujours une faute de frappe.
  const reduction = entier(donnees.get("reductionPct"), 0, 90);
  // Une date de fin sans réduction ne veut rien dire : on l'oublie plutôt que de
  // la garder et de laisser croire qu'une offre court.
  const finOffre = reduction > 0 ? fin : null;

  return {
    saisie: {
      nom,
      detail: optionnel(donnees.get("detail"), 160),
      // Traductions facultatives : vides, la page anglaise reprend le français.
      nomEn: optionnel(donnees.get("nomEn"), 80),
      detailEn: optionnel(donnees.get("detailEn"), 160),
      pointsEn: optionnel(donnees.get("pointsEn"), 1000),
      prixCentimes: prix,
      reductionPct: reduction,
      finOffre,
      points: optionnel(donnees.get("points"), 1000),
      rang: entier(donnees.get("rang"), 0, 99),
      miseEnAvant: donnees.get("miseEnAvant") === "on",
      publiee: donnees.get("publiee") === "on",
    },
  };
}

function retour(parametre: string): never {
  revalidatePath("/admin/tarifs");
  // La page de vente lit les offres à chaque rendu, mais le cache de route de
  // Next peut servir une version précédente après un changement de prix.
  revalidatePath("/presentation");
  redirect(`/admin/tarifs?${parametre}`);
}

export async function actionCreerOffre(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const lu = lireOffre(donnees);
  if ("erreur" in lu) retour(`erreur=${lu.erreur}`);
  await creerOffre(lu.saisie);
  retour("ok=creee");
}

export async function actionModifierOffre(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = texte(donnees.get("id"), 64);
  if (!id) retour("erreur=introuvable");
  const lu = lireOffre(donnees);
  if ("erreur" in lu) retour(`erreur=${lu.erreur}`);
  await modifierOffre(id, lu.saisie);
  retour("ok=modifiee");
}

export async function actionSupprimerOffre(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = texte(donnees.get("id"), 64);
  if (!id) retour("erreur=introuvable");
  await supprimerOffre(id);
  retour("ok=supprimee");
}
