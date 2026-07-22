// Tests unitaires des workflows webhook A6b (newsletter à la demande) et
// A7b (avis déposé). Même méthode que test-a1.mjs : extraction du SQL templé
// depuis le JSON du workflow, rendu des expressions n8n sur des fixtures,
// exécution en transaction ROLLBACK (aucune trace en base).
//
// Prérequis : Postgres avec le schéma + données seed (npm run seed).
// Usage : PGPASSWORD=postgres node n8n-workflows/tests/test-webhooks.mjs
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const PSQL = ["-h", process.env.PGHOST ?? "127.0.0.1", "-p", process.env.PGPORT ?? "5432",
  "-U", process.env.PGUSER ?? "postgres", "-d", process.env.PGDATABASE ?? "immomail"];

const psql = (args) => spawnSync("psql", [...PSQL, ...args], { encoding: "utf8" });
const lookup = (sql) => psql(["-tAc", sql]).stdout.trim();
const render = (tpl, ctx) => tpl.replace(/\{\{([\s\S]*?)\}\}/g, (_, e) => {
  const $json = ctx.json, $env = ctx.env ?? {}; // eslint-disable-line no-unused-vars
  return String(eval(e));
});
const queryOf = (file, nodeName) => {
  const wf = JSON.parse(readFileSync(join(DIR, "..", file), "utf8"));
  return wf.nodes.find((n) => n.name === nodeName).parameters.query;
};

let fail = 0;
const run = (sql, label, expect) => {
  const r = psql(["-v", "ON_ERROR_STOP=1", "-c", `BEGIN;\n${sql}\nROLLBACK;`]);
  const ok = r.status === 0 && (!expect || r.stdout.includes(expect));
  console.log(ok ? `✓ ${label}` : `✗ ${label}\n  ${(r.stderr || r.stdout).trim().split("\n")[0]}`);
  if (!ok) fail++;
};

const SEG = lookup("SELECT id FROM newsletter_segments LIMIT 1;");
const TX = lookup("SELECT id FROM transactions WHERE review_completed_at IS NULL LIMIT 1;");
if (!SEG || !TX) { console.error("Base non seedée (segment/transaction introuvable) — lancer npm run seed"); process.exit(1); }

// --- A6b
const sel = queryOf("A6b-newsletter-webhook.json", "Destinataires + biens du segment");
run(render(sel, { json: { body: { segmentId: SEG } } }), "A6b select (segment réel)");
run(render(sel, { json: { body: { segmentId: "inexistant" } } }), "A6b select (segment inconnu → 0 ligne)");
const jr = queryOf("A6b-newsletter-webhook.json", "Journaliser A6");
run(render(jr, { json: { agency_id: "ag", contact_id: "c", first_name: "Éléa", last_name: "O'Neil", email: "e@x.fr", subject: "s", body: "b", seg_name: "Acheteurs « T3 »", segment_id: SEG, nb_biens: 2 } }), "A6b journal (apostrophes/guillemets)");

// --- A7b
const upd = queryOf("A7b-avis-depose-webhook.json", "Marquer l'avis déposé");
run(render(upd, { json: { body: { transactionId: TX } } }), "A7b update (transaction réelle → updated=t)", "t");
run(render(upd, { json: { body: { transactionId: "inconnue" } } }), "A7b update (tx inconnue → updated=f)", "f");
run(render(upd, { json: { body: { transactionId: "x'); DROP TABLE transactions; --" } } }), "A7b injection SQL neutralisée");
run("SELECT count(*) FROM transactions;", "garde-fou : table transactions intacte");

console.log(fail === 0 ? "\nTous les tests passent." : `\n${fail} échec(s).`);
process.exit(fail ? 1 : 0);
