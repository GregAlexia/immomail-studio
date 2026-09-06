/**
 * Test d'intégration des espaces isolés, sur un vrai Postgres.
 *
 * Le défaut que les espaces corrigent était silencieux et destructeur : un
 * commercial cliquant « Réinitialiser » ou important un classeur effaçait la
 * démonstration de ses collègues, en pleine présentation. Ce script vérifie
 * qu'aucun des trois chemins d'écriture ne déborde de son espace.
 *
 *   DATABASE_URL=postgres://... npx tsx scripts/verifier-espaces.ts
 */
import { eq } from "drizzle-orm";
import { runEngine } from "../lib/automation-engine";
import { db, client } from "../lib/db/client";
import { supprimerDonneesEspace } from "../lib/db/espaces";
import { agencies, activityLog, demoClock, messages, properties } from "../lib/db/schema";
import { INITIAL_DEMO_DATE, semerEspace } from "../lib/seed-data";

let echecs = 0;

function verifier(intitule: string, condition: boolean, detail = ""): void {
  if (condition) {
    console.log(`OK    ${intitule}`);
  } else {
    echecs += 1;
    console.log(`ECHEC ${intitule}${detail ? ` — ${detail}` : ""}`);
  }
}

async function compterAgences(espace: string): Promise<number> {
  return (await db.select({ id: agencies.id }).from(agencies).where(eq(agencies.workspaceId, espace))).length;
}

async function idsAgences(espace: string): Promise<string[]> {
  const lignes = await db.select({ id: agencies.id }).from(agencies).where(eq(agencies.workspaceId, espace));
  return lignes.map((l) => l.id).sort();
}

async function compterPour(espace: string, table: typeof messages | typeof activityLog | typeof properties): Promise<number> {
  const ids = new Set(await idsAgences(espace));
  const lignes = await db.select({ agencyId: table.agencyId }).from(table);
  return lignes.filter((l) => ids.has(l.agencyId)).length;
}

async function main() {
  console.log("--- Semis de deux espaces ---");
  await semerEspace("demo");
  await semerEspace("phil");

  verifier("l'espace demo a 4 agences", (await compterAgences("demo")) === 4);
  verifier("l'espace phil a 4 agences", (await compterAgences("phil")) === 4);

  const idsDemo = await idsAgences("demo");
  const idsPhil = await idsAgences("phil");
  const communs = idsDemo.filter((id) => idsPhil.includes(id));
  verifier("aucune agence partagée entre les deux espaces", communs.length === 0, communs.join(", "));

  const horloges = await db.select().from(demoClock);
  const idsHorloges = horloges.map((h) => h.id).sort();
  verifier(
    "une horloge par espace",
    idsHorloges.includes("demo") && idsHorloges.includes("phil"),
    idsHorloges.join(", ")
  );

  console.log("\n--- Le moteur ne déborde pas de son espace ---");
  const upto = new Date(INITIAL_DEMO_DATE.getTime() + 40 * 24 * 3600 * 1000);
  await runEngine(upto, { workspaceId: "phil" });

  const msgPhil = await compterPour("phil", messages);
  const msgDemo = await compterPour("demo", messages);
  verifier("le moteur a produit des messages dans phil", msgPhil > 0, `${msgPhil}`);
  verifier("l'espace demo est resté intact", msgDemo === 0, `${msgDemo} message(s) inattendu(s)`);

  console.log("\n--- Réinitialiser un espace n'efface pas l'autre ---");
  const biensDemoAvant = await compterPour("demo", properties);
  const journalPhilAvant = await compterPour("phil", activityLog);
  verifier("phil a bien un journal avant réinitialisation", journalPhilAvant > 0, `${journalPhilAvant}`);

  await semerEspace("phil");

  const biensDemoApres = await compterPour("demo", properties);
  const journalPhilApres = await compterPour("phil", activityLog);
  verifier(
    "les biens de demo sont intacts après réinitialisation de phil",
    biensDemoApres === biensDemoAvant && biensDemoAvant > 0,
    `${biensDemoAvant} avant, ${biensDemoApres} après`
  );
  verifier("le journal de phil a bien été vidé", journalPhilApres === 0, `${journalPhilApres}`);

  console.log("\n--- Suppression ciblée ---");
  await supprimerDonneesEspace("phil");
  verifier("phil est vide", (await compterAgences("phil")) === 0);
  verifier("demo a toujours ses 4 agences", (await compterAgences("demo")) === 4);

  console.log(echecs === 0 ? "\nTous les cas passent." : `\n${echecs} cas en echec.`);
  await client.end();
  process.exit(echecs === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error("Echec inattendu :", e);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
