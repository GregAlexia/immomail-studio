// Test d'intégration du moteur d'automatisations (exécuté en CI avec un
// Postgres de service, seedé au préalable par `npm run seed`).
//
// Vérifie :
//  1. qu'un passage complet déclenche bien toutes les familles d'automatisations ;
//  2. l'idempotence : au 3e passage à date constante, plus rien ne se déclenche
//     (le 2e passage peut légitimement émettre les relances A7, dont la
//     condition dépend d'un flag posé au 1er passage) ;
//  3. l'absence de doublons de numérotation de leads par agence.
//
// Usage : DATABASE_URL=postgres://... npx tsx scripts/ci-engine-test.ts
import { runEngine } from "../lib/automation-engine";
import { db } from "../lib/db/client";
import { leads } from "../lib/db/schema";

function fail(msg: string): never {
  console.error("✗ " + msg);
  process.exit(1);
}

async function main() {
  const upto = new Date("2026-08-25T12:00:00");

  const r1 = await runEngine(upto);
  const expected = ["A2", "A3", "A4", "A5", "A7", "A8", "A9", "A10", "A11"];
  for (const code of expected) {
    if (!r1.counts[code as keyof typeof r1.counts]) fail(`run1 : ${code} ne s'est pas déclenché — counts=${JSON.stringify(r1.counts)}`);
  }
  console.log("✓ run1 : toutes les familles déclenchées", JSON.stringify(r1.counts));

  const r2 = await runEngine(upto);
  const unexpected2 = Object.keys(r2.counts).filter((k) => k !== "A7");
  if (unexpected2.length > 0) fail(`run2 : déclenchements imprévus ${JSON.stringify(r2.counts)}`);
  console.log("✓ run2 : uniquement les relances A7 différées", JSON.stringify(r2.counts));

  const r3 = await runEngine(upto);
  if (Object.keys(r3.counts).length > 0) fail(`run3 : l'idempotence est cassée — ${JSON.stringify(r3.counts)}`);
  console.log("✓ run3 : idempotence totale (aucun doublon)");

  const all = await db.select({ agencyId: leads.agencyId, externalId: leads.externalId }).from(leads);
  const byAgency = new Map<string, string[]>();
  for (const l of all) {
    const list = byAgency.get(l.agencyId) ?? [];
    list.push(l.externalId ?? "");
    byAgency.set(l.agencyId, list);
  }
  for (const [agency, ids] of byAgency) {
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length > 0) fail(`doublons de numéros de lead pour l'agence ${agency} : ${dupes.join(", ")}`);
  }
  console.log("✓ numérotation des leads sans doublon par agence");

  console.log("\nTous les tests moteur passent.");
  process.exit(0);
}

main().catch((e) => {
  console.error("✗ échec inattendu :", e);
  process.exit(1);
});
