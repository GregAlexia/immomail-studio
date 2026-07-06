import { seedDatabase } from "../lib/seed-data";

seedDatabase()
  .then((c) => {
    console.log("✅ Seed terminé.");
    console.log(`   Agences : ${c.agencies}  |  Biens : ${c.properties}  |  Contacts : ${c.contacts}`);
    console.log(`   Mandats : ${c.mandates}  |  Baux : ${c.leases}  |  Transactions : ${c.transactions}`);
    console.log(`   RDV : ${c.appointments}  |  Emails entrants : ${c.inbox}  |  Conformité : ${c.compliance}`);
    console.log(`   Date de démo initiale : ${c.initialDate}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Seed échoué :", e);
    process.exit(1);
  });
