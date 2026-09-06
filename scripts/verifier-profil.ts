/**
 * Vérification de la correspondance étiquette `?p=` → agence.
 *
 * Les cas négatifs comptent autant que les positifs : une étiquette générique
 * comme « agence » ne doit désigner personne, sinon le premier lien venu
 * ouvrirait la démonstration sur une agence choisie au hasard de l'ordre
 * alphabétique.
 *
 *   npx tsx scripts/verifier-profil.ts
 */
import { correspond } from "../lib/demo-profil";

const agences = [
  { name: "Agence Keo", city: "Charleville-Mézières" },
  { name: "Agence Azur Méditerranée", city: "Marseille" },
  { name: "Agence Capitale Paris", city: "Paris" },
  { name: "Agence Horizon Immobilier", city: "Lyon" },
];

const attendu: Record<string, string[]> = {
  lyon: ["Agence Horizon Immobilier"],
  horizon: ["Agence Horizon Immobilier"],
  keo: ["Agence Keo"],
  charleville: ["Agence Keo"],
  "charleville-mezieres": ["Agence Keo"],
  // L'ancien nom ne doit plus rien désigner : un lien `?p=artik` encore en
  // circulation retombe sur l'agence par défaut, sans erreur.
  artik: [],
  marseille: ["Agence Azur Méditerranée"],
  azur: ["Agence Azur Méditerranée"],
  paris: ["Agence Capitale Paris"],
  agence: [],
  immobilier: [],
  ales: [],
  inconnu: [],
};

let echecs = 0;
for (const [etiquette, noms] of Object.entries(attendu)) {
  const obtenu = agences.filter((a) => correspond(etiquette, a)).map((a) => a.name);
  const ok = JSON.stringify(obtenu) === JSON.stringify(noms);
  if (!ok) echecs += 1;
  const rendu = obtenu.length > 0 ? obtenu.join(" | ") : "(aucune)";
  console.log(`${ok ? "OK   " : "ECHEC"} ${etiquette.padEnd(22)} -> ${rendu}`);
}

console.log(echecs === 0 ? "\nTous les cas passent." : `\n${echecs} cas en echec.`);
process.exit(echecs === 0 ? 0 : 1);
