"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { COMMERCIAL_COOKIE, ETIQUETTE_VALIDE } from "@/lib/demo-profil";
import { emailPlausible, enregistrerInscription } from "@/lib/db/inscriptions";
import { lieuDeLaRequete } from "@/lib/geo";
import { cheminDeRetour } from "./contenu";

function texte(valeur: FormDataEntryValue | null, max: number): string {
  return typeof valeur === "string" ? valeur.trim().slice(0, max) : "";
}

/** Demande de rappel déposée depuis la page de vente, française ou anglaise. */
export async function actionDemanderRappel(donnees: FormData): Promise<void> {
  // La langue de retour vient d'un champ caché, donc du visiteur : elle n'est
  // réutilisée qu'après avoir été reconnue dans une liste fermée.
  const retour = cheminDeRetour(donnees.get("retour"));

  // Piège à robots : le champ est caché par la feuille de style, donc vide chez
  // un visiteur et rempli par un automate qui remplit tout ce qu'il trouve. On
  // fait alors semblant d'accepter, pour ne rien lui apprendre.
  if (texte(donnees.get("site"), 200).length > 0) redirect(`${retour}?envoye=1#rappel`);

  const nom = texte(donnees.get("nom"), 80);
  const email = texte(donnees.get("email"), 180).toLowerCase();
  if (nom.length === 0) redirect(`${retour}?erreur=nom#rappel`);
  if (!emailPlausible(email)) redirect(`${retour}?erreur=email#rappel`);

  const commercial = (await cookies()).get(COMMERCIAL_COOKIE)?.value;

  await enregistrerInscription({
    nom,
    agence: texte(donnees.get("agence"), 120) || null,
    email,
    telephone: texte(donnees.get("telephone"), 40) || null,
    // Savoir quel commercial a amené la demande est le seul intérêt du lien
    // nominatif au moment de rappeler.
    commercial: commercial && ETIQUETTE_VALIDE.test(commercial) ? commercial : null,
    lieu: lieuDeLaRequete(await headers()),
  });

  redirect(`${retour}?envoye=1#rappel`);
}
