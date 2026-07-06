// Pousse les workflows générés sur une instance n8n via l'API publique.
// Usage :  N8N_API_KEY=xxx N8N_BASE_URL=https://.../api/v1 node n8n-workflows/push.mjs
// Les workflows sont créés DÉSACTIVÉS, préfixés "ImmoMail Studio · " et tagués.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.N8N_BASE_URL || "https://n8n.srv843744.hstgr.cloud/api/v1";
const KEY = process.env.N8N_API_KEY;
const PREFIX = "ImmoMail Studio · ";
const TAG = "ImmoMail Studio";
if (!KEY) { console.error("N8N_API_KEY manquant"); process.exit(1); }

const H = { "X-N8N-API-KEY": KEY, "Content-Type": "application/json" };
const api = async (method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const txt = await r.text();
  let json; try { json = JSON.parse(txt); } catch { json = txt; }
  return { status: r.status, json };
};

// 1) Tag (créer ou retrouver)
let tagId = null;
{
  const c = await api("POST", "/tags", { name: TAG });
  if (c.status === 200 || c.status === 201) tagId = c.json.id;
  else {
    const list = await api("GET", "/tags?limit=200");
    const found = (list.json.data || []).find((t) => t.name === TAG);
    tagId = found?.id ?? null;
  }
  console.log("Tag:", TAG, "→", tagId || "(non créé)");
}

// 2) Workflows
const files = readdirSync(DIR).filter((f) => /^A\d.*\.json$/.test(f)).sort();
const results = [];
for (const f of files) {
  const wf = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  // Le POST public n'accepte que name, nodes, connections, settings.
  const payload = {
    name: PREFIX + wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings || { executionOrder: "v1" },
  };
  const res = await api("POST", "/workflows", payload);
  if (res.status === 200 || res.status === 201) {
    const id = res.json.id;
    if (tagId) await api("PUT", `/workflows/${id}/tags`, [{ id: tagId }]);
    results.push({ f, id, ok: true });
    console.log("✓", f, "→", id);
  } else {
    results.push({ f, ok: false, status: res.status, err: res.json });
    console.log("✗", f, "HTTP", res.status, JSON.stringify(res.json).slice(0, 300));
  }
}
const ok = results.filter((r) => r.ok).length;
console.log(`\n${ok}/${files.length} workflows créés (désactivés) sur ${BASE.replace('/api/v1','')}`);
