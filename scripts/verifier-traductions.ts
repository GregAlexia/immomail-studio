/**
 * Recense les chaînes traduisibles de l'interface et signale celles qui n'ont
 * pas d'équivalent anglais.
 *
 * C'est le filet de la traduction façon gettext : la chaîne française étant la
 * clé, le compilateur ne voit rien, et un oubli passerait inaperçu jusqu'à ce
 * qu'un prospect anglophone tombe sur un mot français.
 *
 *   npx tsx scripts/verifier-traductions.ts
 *
 * Sortie : la liste des clés manquantes, prête à coller dans `lib/i18n/en.ts`.
 * Code de sortie 1 s'il en reste — utilisable en CI.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { EN } from "../lib/i18n/en";
import { NAV } from "../components/app-shell/nav-items";
import { AUTOMATIONS } from "../lib/types";

const RACINE = join(import.meta.dirname, "..");
const DOSSIERS = ["app", "components", "lib"];

/**
 * `t("…")` et `tr("…")` — la seconde forme existe parce que `marketing/page.tsx`
 * emploie déjà `t` pour ses transactions.
 *
 * Les guillemets échappés sont acceptés ; les gabarits (`t(\`…\`)`) ne le sont
 * pas, et c'est voulu : une chaîne interpolée ne peut pas servir de clé.
 */
const APPEL = /\b(?:t|tr)\(\s*"((?:[^"\\]|\\.)*)"/g;

function fichiers(dossier: string): string[] {
  const out: string[] = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) {
      if (nom === "node_modules" || nom === ".next") continue;
      out.push(...fichiers(chemin));
    } else if (/\.(ts|tsx)$/.test(nom) && !nom.endsWith(".d.ts")) {
      out.push(chemin);
    }
  }
  return out;
}

const cles = new Map<string, string>(); // clé → premier fichier où elle apparaît

for (const dossier of DOSSIERS) {
  for (const fichier of fichiers(join(RACINE, dossier))) {
    // La machinerie de traduction n'est pas de l'interface : `en.ts` porte les
    // traductions, `index.ts` montre `t("…")` dans un commentaire.
    if (fichier.includes(join("lib", "i18n"))) continue;
    const source = readFileSync(fichier, "utf8");
    for (const m of source.matchAll(APPEL)) {
      const cle = m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      if (!cles.has(cle)) cles.set(cle, relative(RACINE, fichier));
    }
  }
}

// Les catalogues traversent `t()` par variable : la lecture du source ne peut
// pas les voir, on les ajoute explicitement.
for (const item of NAV) {
  cles.set(item.label, "components/app-shell/nav-items.ts");
  if (item.description) cles.set(item.description, "components/app-shell/nav-items.ts");
}
for (const a of Object.values(AUTOMATIONS)) {
  for (const champ of [a.title, a.value, a.output]) cles.set(champ, "lib/types.ts");
}

const manquantes = [...cles].filter(([cle]) => !(cle in EN));

console.log(`${cles.size} chaînes traduisibles, ${cles.size - manquantes.length} traduites.`);

if (manquantes.length === 0) {
  console.log("Aucune traduction manquante.");
  process.exit(0);
}

console.log(`\n${manquantes.length} sans traduction anglaise :\n`);
for (const [cle, fichier] of manquantes) {
  console.log(`  ${JSON.stringify(cle)}: "",  // ${fichier}`);
}
process.exit(1);
