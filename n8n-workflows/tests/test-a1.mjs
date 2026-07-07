// Tests unitaires du workflow A1 (prise de RDV webhook).
//
// Unité testée : le SQL templé du nœud Postgres « Créer le RDV » — la seule
// vraie logique du workflow. On émule le rendu des expressions n8n
// ({{ … }} évaluées avec $json = l'item du webhook) sur des payloads
// fixtures, puis on exécute le SQL rendu dans une transaction ROLLBACK :
// le test ne laisse aucune trace en base.
//
// Prérequis : un Postgres avec le schéma de l'app (npm run seed).
// Usage :
//   PGPASSWORD=postgres node n8n-workflows/tests/test-a1.mjs
// Variables : PGHOST (127.0.0.1), PGPORT (5432), PGUSER (postgres),
//             PGDATABASE (immomail).
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const wf = JSON.parse(readFileSync(join(DIR, "..", "A1-prise-rdv-webhook.json"), "utf8"));
const queryTemplate = wf.nodes.find((n) => n.name === "Créer le RDV (appointments)").parameters.query;

// Émule l'évaluation d'expression n8n : chaque {{ expr }} est évalué en JS
// avec $json en portée (suffisant pour ces templates ; pas de $node/$env ici).
function renderQuery(template, item) {
  return template.replace(/\{\{([\s\S]*?)\}\}/g, (_, expr) => {
    const $json = item; // eslint-disable-line no-unused-vars
    return String(eval(expr));
  });
}

function runSql(sql) {
  const wrapped = `BEGIN;\n${sql}\nROLLBACK;`;
  const r = spawnSync(
    "psql",
    ["-h", process.env.PGHOST ?? "127.0.0.1", "-p", process.env.PGPORT ?? "5432",
     "-U", process.env.PGUSER ?? "postgres", "-d", process.env.PGDATABASE ?? "immomail",
     "-v", "ON_ERROR_STOP=1", "-c", wrapped],
    { encoding: "utf8" }
  );
  return { ok: r.status === 0, out: r.stdout, err: r.stderr };
}

const NOMINAL = {
  body: {
    agencyId: "agence-test", propertyId: "bien-test",
    contactName: "Jean Test", contactEmail: "jean@test.fr",
    contactPhone: "+33612345678", type: "visite",
    scheduledAt: "2026-07-15T10:00:00",
  },
};

// [libellé, payload, chaîne attendue dans la sortie du RETURNING (ou null)]
const CASES = [
  ["nominal (payload complet)", NOMINAL, "Jean Test"],
  ["champs optionnels absents → NULL", {
    body: { agencyId: "agence-test", contactName: "Sans Option", scheduledAt: "2026-07-16T11:00:00" },
  }, "Sans Option"],
  ["apostrophe dans le nom (échappement)", {
    body: { ...NOMINAL.body, contactName: "Éléonore O'Brien" },
  }, "O'Brien"],
  ["tentative d'injection SQL dans contactName", {
    body: { ...NOMINAL.body, contactName: "x'); DROP TABLE appointments; --" },
  }, "DROP TABLE"], // insérée comme simple texte, pas exécutée
];

let failures = 0;
for (const [label, payload, expect] of CASES) {
  const sql = renderQuery(queryTemplate, payload);
  const res = runSql(sql);
  const found = expect == null || res.out.includes(expect);
  if (res.ok && found) {
    console.log(`✓ ${label}`);
  } else {
    failures++;
    console.log(`✗ ${label}`);
    if (!res.ok) console.log(`  Erreur Postgres : ${res.err.trim().split("\n")[0]}`);
    else console.log(`  « ${expect} » absent du RETURNING`);
  }
}

// Garde-fou : la table doit avoir survécu au cas « injection ».
const guard = runSql("SELECT count(*) FROM appointments;");
console.log(guard.ok ? "✓ garde-fou : table appointments intacte" : "✗ TABLE APPOINTMENTS DISPARUE");
if (!guard.ok) failures++;

console.log(failures === 0 ? "\nTous les tests passent." : `\n${failures} test(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
