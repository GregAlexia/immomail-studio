// Générateur des workflows n8n d'ImmoMail Studio.
// Émet un fichier .json importable par automatisation (Import from File dans n8n).
// Exécuter :  node n8n-workflows/build.mjs
//
// Conventions partagées :
//  - Base de données : mêmes tables Supabase que l'app (voir lib/db/ddl.ts).
//  - Idempotence : chaque envoi réserve une clé dans automation_runs.run_key
//    (INSERT ... ON CONFLICT (run_key) DO NOTHING) — exactement comme le moteur in-app.
//  - Horloge : en prod on remplace l'horloge de démo par le vrai now() PostgreSQL.
//  - Credentials référencés par un id/nom placeholder — à rattacher après import.

import { randomUUID } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

// ---- Credentials placeholders (à rattacher dans n8n après import) ----
const CRED = {
  pg:   { postgres:       { id: "immomail-supabase", name: "Supabase ImmoMail (pooler session 5432)" } },
  smtp: { smtp:           { id: "immomail-smtp",      name: "SMTP ImmoMail" } },
  imap: { imap:           { id: "immomail-imap",      name: "Boite leads IMAP (portails)" } },
  ant:  { httpHeaderAuth: { id: "immomail-anthropic", name: "Anthropic API (header x-api-key)" } },
  sms:  { httpHeaderAuth: { id: "immomail-sms",       name: "SMS Provider (Brevo / Twilio)" } },
};

// ---- Helpers de construction ----
function node(name, type, typeVersion, position, parameters = {}, extra = {}) {
  return { parameters, id: randomUUID(), name, type, typeVersion, position, ...extra };
}
function pg(name, position, query, extra = {}) {
  return node(name, "n8n-nodes-base.postgres", 2.6, position,
    { operation: "executeQuery", query, options: {} },
    { credentials: CRED.pg, ...extra });
}
function email(name, position, { to, subject, text }) {
  return node(name, "n8n-nodes-base.emailSend", 2.1, position, {
    fromEmail: "={{ $env.IMMOMAIL_FROM_EMAIL || 'agence@immomail.demo' }}",
    toEmail: to, subject, emailFormat: "text", text, options: {},
  }, { credentials: CRED.smtp });
}
function sms(name, position, { to, body }) {
  // Générique : POST vers un provider SMS. Adapter l'URL + le mapping au provider réel.
  return node(name, "n8n-nodes-base.httpRequest", 4.2, position, {
    method: "POST",
    url: "={{ $env.SMS_API_URL || 'https://api.brevo.com/v3/transactionalSMS/sms' }}",
    authentication: "genericCredentialType",
    genericAuthType: "httpHeaderAuth",
    sendBody: true, specifyBody: "json",
    jsonBody: `={{ JSON.stringify({ sender: 'ImmoMail', recipient: ${to}, content: ${body} }) }}`,
    options: {},
  }, { credentials: CRED.sms });
}
function schedule(name, position, rule) {
  return node(name, "n8n-nodes-base.scheduleTrigger", 1.2, position, { rule });
}
function code(name, position, jsCode) {
  return node(name, "n8n-nodes-base.code", 2, position, { jsCode });
}
function sticky(text, position, w = 420, h = 240) {
  return node("Note", "n8n-nodes-base.stickyNote", 1, position, { content: text, height: h, width: w });
}
// Chaîne linéaire de connexions (main → main[0]).
function chain(...names) {
  const c = {};
  for (let i = 0; i < names.length - 1; i++) {
    c[names[i]] = { main: [[{ node: names[i + 1], type: "main", index: 0 }]] };
  }
  return c;
}
function wf(name, nodes, connections, note) {
  return {
    name, nodes, connections,
    active: false,
    settings: { executionOrder: "v1" },
    pinData: {},
    meta: { note },
  };
}
function save(filename, workflow) {
  const path = join(OUT, filename);
  writeFileSync(path, JSON.stringify(workflow, null, 2), "utf8");
  // vérifie que ça reparse
  JSON.parse(JSON.stringify(workflow));
  console.log("✓", filename, "—", workflow.nodes.length, "nodes");
}

/* =========================================================================
 *  A1 — Prise de RDV automatique (webhook réservation publique)
 * ========================================================================= */
{
  const trigger = node("Webhook réservation", "n8n-nodes-base.webhook", 2, [0, 300], {
    httpMethod: "POST", path: "immomail/booking", responseMode: "responseNode", options: {},
  }, { webhookId: randomUUID() });

  const insert = pg("Créer le RDV (appointments)", [260, 300], `WITH new_apt AS (
  INSERT INTO appointments
    (id, agency_id, property_id, contact_id, contact_name, contact_email, contact_phone, type, scheduled_at, status, created_at)
  VALUES (
    gen_random_uuid()::text,
    {{ JSON.stringify($json.body.agencyId) }},
    {{ $json.body.propertyId ? JSON.stringify($json.body.propertyId) : 'NULL' }},
    {{ $json.body.contactId ? JSON.stringify($json.body.contactId) : 'NULL' }},
    {{ JSON.stringify($json.body.contactName) }},
    {{ $json.body.contactEmail ? JSON.stringify($json.body.contactEmail) : 'NULL' }},
    {{ $json.body.contactPhone ? JSON.stringify($json.body.contactPhone) : 'NULL' }},
    {{ JSON.stringify($json.body.type || 'visite') }},
    {{ JSON.stringify($json.body.scheduledAt) }},
    'requested', now()::text
  )
  RETURNING id, agency_id, contact_name, scheduled_at
),
log AS (
  INSERT INTO activity_log (id, agency_id, automation_type, description, ref_id, occurred_at, created_at)
  SELECT gen_random_uuid()::text, agency_id, 'A1',
         'RDV réservé en ligne pour ' || contact_name || ' le ' || scheduled_at, id, now()::text, now()::text
  FROM new_apt
)
SELECT id, agency_id, contact_name, scheduled_at FROM new_apt;`);

  const respond = node("Répondre 200", "n8n-nodes-base.respondToWebhook", 1.1, [520, 300], {
    respondWith: "json",
    responseBody: '={{ JSON.stringify({ ok: true, appointmentId: $json.id }) }}',
    options: {},
  });

  const note = sticky(
    "A1 — Prise de RDV automatique\n\nLa page /book/:propertyId de l'app poste ici (Calendly-like).\nCrée le rendez-vous en base ; A2 (planifié) enverra confirmation + rappels.\n\nURL webhook : POST /webhook/immomail/booking\nBody attendu : { agencyId, propertyId, contactId?, contactName, contactEmail, contactPhone, type, scheduledAt }",
    [0, 0], 520, 240);

  save("A1-prise-rdv-webhook.json", wf("A1 · Prise de RDV automatique",
    [note, trigger, insert, respond],
    chain("Webhook réservation", "Créer le RDV (appointments)", "Répondre 200"),
    "Webhook de réservation publique → création du RDV. A2 prend le relais pour confirmation/rappels."));
}

/* =========================================================================
 *  A2 — Confirmation + rappels de visite (SMS/email) — planifié
 * ========================================================================= */
{
  const trig = schedule("Toutes les 15 min", [0, 300], { interval: [{ field: "minutes", minutesInterval: 15 }] });

  // Sélectionne les actions dues (confirmation, J-1, H-2) — une ligne par action.
  const select = pg("RDV : actions dues", [240, 300], `SELECT * FROM (
  -- Confirmation immédiate
  SELECT a.id, a.agency_id, a.contact_id, a.contact_name AS name, a.contact_email AS to_email,
         a.contact_phone AS to_phone, a.type, a.scheduled_at,
         'confirm' AS action,
         'A2:confirm:' || a.id AS run_key,
         p.title AS prop_title, p.city AS prop_city
  FROM appointments a LEFT JOIN properties p ON p.id = a.property_id
  WHERE a.status NOT IN ('cancelled','no_show','done')
    AND a.confirmation_sent_at IS NULL
  UNION ALL
  -- Rappel J-1
  SELECT a.id, a.agency_id, a.contact_id, a.contact_name, a.contact_email, a.contact_phone, a.type, a.scheduled_at,
         'j1', 'A2:reminder_j1:' || a.id, p.title, p.city
  FROM appointments a LEFT JOIN properties p ON p.id = a.property_id
  WHERE a.status NOT IN ('cancelled','no_show','done')
    AND a.reminder_j1_sent_at IS NULL
    AND now() >= (a.scheduled_at::timestamptz - interval '1 day')
  UNION ALL
  -- Rappel H-2
  SELECT a.id, a.agency_id, a.contact_id, a.contact_name, a.contact_email, a.contact_phone, a.type, a.scheduled_at,
         'h2', 'A2:reminder_h2:' || a.id, p.title, p.city
  FROM appointments a LEFT JOIN properties p ON p.id = a.property_id
  WHERE a.status NOT IN ('cancelled','no_show','done')
    AND a.reminder_h2_sent_at IS NULL
    AND now() >= (a.scheduled_at::timestamptz - interval '2 hours')
) due
-- filtre idempotence : n'envoie pas ce qui est déjà réservé
WHERE NOT EXISTS (SELECT 1 FROM automation_runs ar WHERE ar.run_key = due.run_key);`);

  const build = code("Construire le message", [480, 300], `for (const item of $input.all()) {
  const j = item.json;
  const when = new Date(j.scheduled_at);
  const time = when.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const date = when.toLocaleDateString('fr-FR');
  const lieu = j.prop_title ? j.prop_title + (j.prop_city ? ', ' + j.prop_city : '') : "l'agence";
  const kind = j.type === 'estimation' ? "rendez-vous d'estimation" : "visite";
  let body, subject;
  if (j.action === 'confirm') {
    subject = 'Confirmation de votre rendez-vous — ' + date;
    body = 'Bonjour ' + j.name + ', votre ' + kind + ' est confirmé(e) le ' + date + ' à ' + time + ' (' + lieu + '). Répondez STOP pour annuler.';
  } else if (j.action === 'j1') {
    subject = 'Rappel — votre visite est demain';
    body = 'Rappel : ' + j.name + ', votre ' + kind + ' a lieu demain à ' + time + ' (' + lieu + '). À demain !';
  } else {
    subject = 'Rappel — votre visite dans 2 h';
    body = j.name + ', votre visite est dans 2 h (' + time + ', ' + lieu + '). À tout à l'heure !';
  }
  item.json.subject = subject;
  item.json.body = body;
  item.json.update_col = j.action === 'confirm' ? 'confirmation_sent_at' : j.action === 'j1' ? 'reminder_j1_sent_at' : 'reminder_h2_sent_at';
}
return $input.all();`);

  const mailNode = email("Email de confirmation", [720, 220], {
    to: "={{ $json.to_email }}", subject: "={{ $json.subject }}", text: "={{ $json.body }}",
  });
  const smsNode = sms("SMS", [720, 400], { to: "={{ $json.to_phone }}", body: "={{ $json.body }}" });

  const record = pg("Marquer envoyé + journaliser", [980, 300], `WITH upd AS (
  UPDATE appointments SET
    confirmation_sent_at = CASE WHEN '{{ $json.update_col }}' = 'confirmation_sent_at' THEN now()::text ELSE confirmation_sent_at END,
    reminder_j1_sent_at  = CASE WHEN '{{ $json.update_col }}' = 'reminder_j1_sent_at'  THEN now()::text ELSE reminder_j1_sent_at END,
    reminder_h2_sent_at  = CASE WHEN '{{ $json.update_col }}' = 'reminder_h2_sent_at'  THEN now()::text ELSE reminder_h2_sent_at END,
    status = CASE WHEN '{{ $json.update_col }}' = 'reminder_j1_sent_at' AND status IN ('requested','confirmed') THEN 'reminded' ELSE status END
  WHERE id = {{ JSON.stringify($json.id) }}
),
run AS (
  INSERT INTO automation_runs (id, agency_id, automation_type, ref_id, run_key, executed_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A2', {{ JSON.stringify($json.id) }}, {{ JSON.stringify($json.run_key) }}, now()::text, now()::text)
  ON CONFLICT (run_key) DO NOTHING
),
msg AS (
  INSERT INTO messages (id, agency_id, channel, to_contact_id, to_name, to_address, subject, body, automation_type, sent_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'sms', {{ $json.contact_id ? JSON.stringify($json.contact_id) : 'NULL' }}, {{ JSON.stringify($json.name) }}, {{ $json.to_phone ? JSON.stringify($json.to_phone) : 'NULL' }}, {{ JSON.stringify($json.subject) }}, {{ JSON.stringify($json.body) }}, 'A2', now()::text, now()::text)
)
INSERT INTO activity_log (id, agency_id, automation_type, description, ref_id, occurred_at, created_at)
VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A2', {{ JSON.stringify('Message A2 (' + $json.action + ') envoyé à ') }} || {{ JSON.stringify($json.name) }}, {{ JSON.stringify($json.id) }}, now()::text, now()::text);`);

  const note = sticky(
    "A2 — Confirmation + rappels de visite\n\nPlanifié (toutes les 15 min). Sélectionne les RDV à confirmer,\nles rappels J-1 et H-2 non encore envoyés (filtrés par idempotence),\nenvoie SMS + email et marque le flag correspondant.",
    [240, 40], 500, 200);

  const conns = {
    ...chain("Toutes les 15 min", "RDV : actions dues", "Construire le message"),
    "Construire le message": { main: [[{ node: "Email de confirmation", type: "main", index: 0 }]] },
    "Email de confirmation": { main: [[{ node: "SMS", type: "main", index: 0 }]] },
    "SMS": { main: [[{ node: "Marquer envoyé + journaliser", type: "main", index: 0 }]] },
  };
  save("A2-confirmation-rappels-visites.json", wf("A2 · Confirmation + rappels de visite",
    [note, trig, select, build, mailNode, smsNode, record], conns,
    "RDV : confirmation immédiate + rappels J-1 / H-2 par SMS et email."));
}

/* =========================================================================
 *  A3 — Alerte expiration de mandat (J-30) — planifié quotidien
 * ========================================================================= */
{
  const trig = schedule("Chaque jour 8h", [0, 300], { interval: [{ field: "days", triggerAtHour: 8 }] });
  const select = pg("Mandats à J-30", [240, 300], `SELECT m.id, m.agency_id, m.type, m.end_date,
       p.title AS prop_title,
       c.id AS owner_id, c.first_name, c.last_name, c.email AS owner_email,
       'A3:mandate_expiry:' || m.id AS run_key
FROM mandates m
JOIN properties p ON p.id = m.property_id
LEFT JOIN contacts c ON c.id = m.owner_id
WHERE m.status = 'active'
  AND now() >= (m.end_date::timestamptz - interval '30 days')
  AND NOT EXISTS (SELECT 1 FROM automation_runs ar WHERE ar.run_key = 'A3:mandate_expiry:' || m.id);`);

  const build = code("Rédiger la relance", [480, 300], `for (const item of $input.all()) {
  const j = item.json;
  const owner = ((j.first_name || '') + ' ' + (j.last_name || '')).trim() || 'le propriétaire';
  const kind = j.type === 'exclusive' ? 'exclusif' : 'simple';
  const date = new Date(j.end_date).toLocaleDateString('fr-FR');
  item.json.owner_name = owner;
  item.json.subject = 'Renouvellement de votre mandat — échéance ' + date;
  item.json.body = 'Bonjour ' + owner + ',\\n\\nVotre mandat ' + kind + ' sur le bien ' + (j.prop_title || '') + ' arrive à échéance le ' + date + '.\\nNous obtenons d\\'excellents résultats sur ce secteur et serions ravis de le renouveler avec vous. Pouvons-nous convenir d\\'un point cette semaine ?\\n\\nBien à vous,';
}
return $input.all();`);

  const mailNode = email("Email au propriétaire", [720, 300], {
    to: "={{ $json.owner_email }}", subject: "={{ $json.subject }}", text: "={{ $json.body }}",
  });

  const record = pg("Journaliser A3", [960, 300], `WITH run AS (
  INSERT INTO automation_runs (id, agency_id, automation_type, ref_id, run_key, executed_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A3', {{ JSON.stringify($json.id) }}, {{ JSON.stringify($json.run_key) }}, now()::text, now()::text)
  ON CONFLICT (run_key) DO NOTHING
),
msg AS (
  INSERT INTO messages (id, agency_id, channel, to_contact_id, to_name, to_address, subject, body, automation_type, sent_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'email', {{ $json.owner_id ? JSON.stringify($json.owner_id) : 'NULL' }}, {{ JSON.stringify($json.owner_name) }}, {{ $json.owner_email ? JSON.stringify($json.owner_email) : 'NULL' }}, {{ JSON.stringify($json.subject) }}, {{ JSON.stringify($json.body) }}, 'A3', now()::text, now()::text)
)
INSERT INTO activity_log (id, agency_id, automation_type, description, ref_id, occurred_at, created_at)
VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A3', {{ JSON.stringify('Mandat à relancer : ') }} || {{ JSON.stringify($json.prop_title) }}, {{ JSON.stringify($json.id) }}, now()::text, now()::text);`);

  const note = sticky("A3 — Alerte expiration de mandat\n\nQuotidien 8h. Relance le propriétaire 30 j avant l'échéance du mandat actif.", [240, 60], 460, 160);
  save("A3-alerte-expiration-mandat.json", wf("A3 · Alerte expiration de mandat",
    [note, trig, select, build, mailNode, record],
    chain("Chaque jour 8h", "Mandats à J-30", "Rédiger la relance", "Email au propriétaire", "Journaliser A3"),
    "Relance de renouvellement 30 jours avant l'échéance d'un mandat."));
}

/* =========================================================================
 *  A4 — Quittances de loyer automatiques (mensuel) — planifié quotidien
 * ========================================================================= */
{
  const trig = schedule("Chaque jour 9h", [0, 300], { interval: [{ field: "days", triggerAtHour: 9 }] });
  const select = pg("Quittances dues ce mois", [240, 300], `SELECT l.id, l.agency_id, l.property_id, l.monthly_rent, l.charges, l.rent_due_day,
       p.title AS prop_title,
       t.id AS tenant_id, t.first_name, t.last_name, t.email AS tenant_email,
       to_char(now(), 'YYYY-MM') AS period_key,
       'A4:receipt:' || l.id || ':' || to_char(now(), 'YYYY-MM') AS run_key
FROM leases l
JOIN properties p ON p.id = l.property_id
LEFT JOIN contacts t ON t.id = l.tenant_id
WHERE date_part('day', now()) >= l.rent_due_day
  AND l.start_date::timestamptz <= now()
  AND (l.end_date IS NULL OR l.end_date::timestamptz >= now())
  AND NOT EXISTS (SELECT 1 FROM automation_runs ar WHERE ar.run_key = 'A4:receipt:' || l.id || ':' || to_char(now(), 'YYYY-MM'));`);

  const build = code("Préparer la quittance", [480, 300], `const eur = (n) => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n);
for (const item of $input.all()) {
  const j = item.json;
  const tenant = ((j.first_name||'')+' '+(j.last_name||'')).trim() || 'le locataire';
  const total = Number(j.monthly_rent) + Number(j.charges);
  const [y,m] = j.period_key.split('-');
  const period = new Date(Number(y), Number(m)-1, 1).toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
  item.json.tenant_name = tenant;
  item.json.total = total;
  item.json.subject = 'Quittance de loyer — ' + period;
  item.json.attachment_url = '/api/receipt/' + j.id + '?period=' + j.period_key;
  item.json.body = 'Bonjour ' + tenant + ',\\n\\nVeuillez trouver ci-joint votre quittance de loyer pour ' + period + ' (' + (j.prop_title||'') + ').\\nMontant réglé : ' + eur(total) + ' (loyer ' + eur(j.monthly_rent) + ' + charges ' + eur(j.charges) + ').\\n\\nCordialement,';
}
return $input.all();`);

  // Récupère le vrai PDF généré par l'app (endpoint existant /api/receipt).
  const pdf = node("Générer le PDF (app)", "n8n-nodes-base.httpRequest", 4.2, [720, 300], {
    method: "GET",
    url: "={{ ($env.IMMOMAIL_BASE_URL || 'https://immomail-studio.vercel.app') + $json.attachment_url }}",
    options: { response: { response: { responseFormat: "file", outputPropertyName: "data" } } },
  });

  const mailNode = node("Email quittance + PDF", "n8n-nodes-base.emailSend", 2.1, [960, 300], {
    fromEmail: "={{ $env.IMMOMAIL_FROM_EMAIL || 'agence@immomail.demo' }}",
    toEmail: "={{ $('Préparer la quittance').item.json.tenant_email }}",
    subject: "={{ $('Préparer la quittance').item.json.subject }}",
    emailFormat: "text",
    text: "={{ $('Préparer la quittance').item.json.body }}",
    options: { attachments: "data" },
  }, { credentials: CRED.smtp });

  const record = pg("Journaliser A4", [1200, 300], `WITH run AS (
  INSERT INTO automation_runs (id, agency_id, automation_type, ref_id, run_key, executed_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($('Préparer la quittance').item.json.agency_id) }}, 'A4', {{ JSON.stringify($('Préparer la quittance').item.json.id) }}, {{ JSON.stringify($('Préparer la quittance').item.json.run_key) }}, now()::text, now()::text)
  ON CONFLICT (run_key) DO NOTHING
),
msg AS (
  INSERT INTO messages (id, agency_id, channel, to_contact_id, to_name, to_address, subject, body, attachment_url, automation_type, sent_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($('Préparer la quittance').item.json.agency_id) }}, 'email', {{ $('Préparer la quittance').item.json.tenant_id ? JSON.stringify($('Préparer la quittance').item.json.tenant_id) : 'NULL' }}, {{ JSON.stringify($('Préparer la quittance').item.json.tenant_name) }}, {{ $('Préparer la quittance').item.json.tenant_email ? JSON.stringify($('Préparer la quittance').item.json.tenant_email) : 'NULL' }}, {{ JSON.stringify($('Préparer la quittance').item.json.subject) }}, {{ JSON.stringify($('Préparer la quittance').item.json.body) }}, {{ JSON.stringify($('Préparer la quittance').item.json.attachment_url) }}, 'A4', now()::text, now()::text)
)
INSERT INTO activity_log (id, agency_id, automation_type, description, ref_id, occurred_at, created_at)
VALUES (gen_random_uuid()::text, {{ JSON.stringify($('Préparer la quittance').item.json.agency_id) }}, 'A4', {{ JSON.stringify('Quittance envoyée à ') }} || {{ JSON.stringify($('Préparer la quittance').item.json.tenant_name) }}, {{ JSON.stringify($('Préparer la quittance').item.json.id) }}, now()::text, now()::text);`);

  const note = sticky("A4 — Quittances de loyer\n\nQuotidien 9h. Dès que le jour d'échéance du bail est atteint,\ngénère la quittance via l'endpoint /api/receipt de l'app (vrai PDF)\net l'envoie au locataire. 1 quittance/bail/mois (idempotence).", [240, 40], 500, 200);
  save("A4-quittances-loyer.json", wf("A4 · Quittances de loyer automatiques",
    [note, trig, select, build, pdf, mailNode, record],
    chain("Chaque jour 9h", "Quittances dues ce mois", "Préparer la quittance", "Générer le PDF (app)", "Email quittance + PDF", "Journaliser A4"),
    "Génère et envoie la quittance mensuelle (PDF réel via /api/receipt)."));
}

/* =========================================================================
 *  A5 — Rappel diagnostics & échéances (conformité) — planifié quotidien
 * ========================================================================= */
{
  const trig = schedule("Chaque jour 8h", [0, 300], { interval: [{ field: "days", triggerAtHour: 8 }] });
  const select = pg("Conformité à échéance", [240, 300], `SELECT ci.id, ci.agency_id, ci.label, ci.type, ci.due_date,
       p.title AS prop_title, p.negotiator,
       'A5:compliance:' || ci.id AS run_key
FROM compliance_items ci
JOIN properties p ON p.id = ci.property_id
WHERE ci.status = 'pending'
  AND now() >= (ci.due_date::timestamptz - make_interval(days => ci.reminder_days_before))
  AND NOT EXISTS (SELECT 1 FROM automation_runs ar WHERE ar.run_key = 'A5:compliance:' || ci.id);`);

  const record = pg("Marquer 'reminded' + journaliser", [480, 300], `WITH upd AS (
  UPDATE compliance_items SET status = 'reminded' WHERE id = {{ JSON.stringify($json.id) }}
),
run AS (
  INSERT INTO automation_runs (id, agency_id, automation_type, ref_id, run_key, executed_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A5', {{ JSON.stringify($json.id) }}, {{ JSON.stringify($json.run_key) }}, now()::text, now()::text)
  ON CONFLICT (run_key) DO NOTHING
)
INSERT INTO activity_log (id, agency_id, automation_type, description, ref_id, occurred_at, created_at)
VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A5',
  {{ JSON.stringify('Échéance conformité « ') }} || {{ JSON.stringify($json.label) }} || {{ JSON.stringify(' » (') }} || {{ JSON.stringify($json.prop_title) }} || {{ JSON.stringify(') à traiter avant le ') }} || to_char({{ JSON.stringify($json.due_date) }}::timestamptz, 'DD/MM/YYYY'),
  {{ JSON.stringify($json.id) }}, now()::text, now()::text);`);

  const alert = email("Email interne négociateur", [480, 480], {
    to: "={{ $env.IMMOMAIL_AGENCY_INBOX || 'agence@immomail.demo' }}",
    subject: "=Conformité à traiter : {{ $json.label }} — {{ $json.prop_title }}",
    text: "=Le diagnostic « {{ $json.label }} » du bien {{ $json.prop_title }} arrive à échéance ({{ $json.due_date }}). Négociateur : {{ $json.negotiator }}. Merci de planifier son renouvellement.",
  });

  const note = sticky("A5 — Rappel diagnostics & échéances\n\nQuotidien 8h. DPE, assurance PNO, renouvellement de bail…\nRappel déclenché reminder_days_before jours avant l'échéance,\nstatut passé à 'reminded' + email interne au négociateur.", [240, 40], 500, 200);
  const conns = {
    ...chain("Chaque jour 8h", "Conformité à échéance"),
    "Conformité à échéance": { main: [[
      { node: "Marquer 'reminded' + journaliser", type: "main", index: 0 },
      { node: "Email interne négociateur", type: "main", index: 0 },
    ]] },
  };
  save("A5-rappel-conformite.json", wf("A5 · Rappel diagnostics & échéances",
    [note, trig, select, record, alert], conns,
    "Rappel des échéances de conformité (DPE/PNO/bail) N jours avant."));
}

/* =========================================================================
 *  A6 — Newsletter acheteurs segmentée — planifié hebdo
 * ========================================================================= */
{
  const trig = schedule("Chaque lundi 9h", [0, 300], { interval: [{ field: "weeks", triggerAtDay: [1], triggerAtHour: 9 }] });

  // Rapproche les biens nouvellement disponibles (7 j) des critères acheteurs.
  const select = pg("Matching biens ↔ acheteurs", [240, 300], `WITH new_props AS (
  SELECT * FROM properties
  WHERE status = 'available'
    AND created_at::timestamptz >= now() - interval '7 days'
),
matches AS (
  SELECT c.id AS contact_id, c.agency_id, c.first_name, c.last_name, c.email,
         np.ref, np.title, np.price, np.city, np.zone, np.type, np.rooms
  FROM contacts c
  JOIN new_props np ON np.agency_id = c.agency_id
  WHERE c.consent_marketing = TRUE
    AND c.role IN ('buyer','tenant','prospect')
    AND c.email IS NOT NULL
    AND (c.buyer_criteria IS NULL OR c.buyer_criteria = '' OR (
      (NULLIF(c.buyer_criteria::jsonb->>'budgetMax','') IS NULL OR np.price <= (c.buyer_criteria::jsonb->>'budgetMax')::numeric)
      AND (NULLIF(c.buyer_criteria::jsonb->>'type','') IS NULL OR np.type = c.buyer_criteria::jsonb->>'type')
      AND (NULLIF(c.buyer_criteria::jsonb->>'minRooms','') IS NULL OR COALESCE(np.rooms,0) >= (c.buyer_criteria::jsonb->>'minRooms')::int)
      AND (
        c.buyer_criteria::jsonb->'zones' IS NULL
        OR jsonb_array_length(COALESCE(c.buyer_criteria::jsonb->'zones','[]'::jsonb)) = 0
        OR (c.buyer_criteria::jsonb->'zones') ? np.zone
        OR (c.buyer_criteria::jsonb->'zones') ? np.city
      )
    ))
)
SELECT contact_id, agency_id, first_name, last_name, email,
       count(*) AS nb_biens,
       jsonb_agg(jsonb_build_object('ref',ref,'title',title,'price',price,'city',city)) AS biens,
       'A6:newsletter:' || contact_id || ':' || to_char(now(),'IYYY-IW') AS run_key
FROM matches
GROUP BY contact_id, agency_id, first_name, last_name, email
HAVING NOT EXISTS (SELECT 1 FROM automation_runs ar WHERE ar.run_key = 'A6:newsletter:' || contact_id || ':' || to_char(now(),'IYYY-IW'));`);

  const build = code("Composer la newsletter", [480, 300], `const eur = (n) => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n);
for (const item of $input.all()) {
  const j = item.json;
  const biens = (typeof j.biens === 'string' ? JSON.parse(j.biens) : j.biens) || [];
  const lignes = biens.map(b => '• ' + b.title + ' (' + (b.city||'') + ') — ' + eur(b.price) + ' [réf ' + (b.ref||'') + ']').join('\\n');
  item.json.subject = j.nb_biens > 1 ? (j.nb_biens + ' nouveaux biens correspondent à votre recherche') : 'Un nouveau bien correspond à votre recherche';
  item.json.body = 'Bonjour ' + j.first_name + ',\\n\\nVoici les nouveautés qui correspondent à vos critères :\\n\\n' + lignes + '\\n\\nRépondez à cet email pour organiser une visite.\\n\\nÀ bientôt,';
}
return $input.all();`);

  const mailNode = email("Email newsletter", [720, 300], {
    to: "={{ $json.email }}", subject: "={{ $json.subject }}", text: "={{ $json.body }}",
  });

  const record = pg("Journaliser A6", [960, 300], `WITH run AS (
  INSERT INTO automation_runs (id, agency_id, automation_type, ref_id, run_key, executed_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A6', {{ JSON.stringify($json.contact_id) }}, {{ JSON.stringify($json.run_key) }}, now()::text, now()::text)
  ON CONFLICT (run_key) DO NOTHING
),
msg AS (
  INSERT INTO messages (id, agency_id, channel, to_contact_id, to_name, to_address, subject, body, automation_type, sent_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'email', {{ JSON.stringify($json.contact_id) }}, {{ JSON.stringify(($json.first_name||'')+' '+($json.last_name||'')) }}, {{ JSON.stringify($json.email) }}, {{ JSON.stringify($json.subject) }}, {{ JSON.stringify($json.body) }}, 'A6', now()::text, now()::text)
)
INSERT INTO activity_log (id, agency_id, automation_type, description, ref_id, occurred_at, created_at)
VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A6', {{ JSON.stringify('Newsletter segmentée envoyée à ') }} || {{ JSON.stringify(($json.first_name||'')+' '+($json.last_name||'')) }} || {{ JSON.stringify(' (' ) }} || {{ $json.nb_biens }} || {{ JSON.stringify(' bien(s))') }}, {{ JSON.stringify($json.contact_id) }}, now()::text, now()::text);`);

  const note = sticky("A6 — Newsletter acheteurs segmentée\n\nHebdo (lundi 9h). Rapproche les biens dispo créés dans les 7 j\ndes critères des contacts (budget, type, zones, pièces) et\nenvoie à chacun sa sélection personnalisée. 1 envoi/contact/semaine.", [240, 40], 520, 200);
  save("A6-newsletter-segmentee.json", wf("A6 · Newsletter acheteurs segmentée",
    [note, trig, select, build, mailNode, record],
    chain("Chaque lundi 9h", "Matching biens ↔ acheteurs", "Composer la newsletter", "Email newsletter", "Journaliser A6"),
    "Matching biens/critères acheteurs → email nouveautés personnalisé."));
}

/* =========================================================================
 *  A7 — Collecte d'avis Google (J+2 + relance J+5) — planifié quotidien
 * ========================================================================= */
{
  const trig = schedule("Chaque jour 10h", [0, 300], { interval: [{ field: "days", triggerAtHour: 10 }] });
  const select = pg("Avis : demandes & relances dues", [240, 300], `SELECT * FROM (
  -- J+2 : première demande
  SELECT t.id, t.agency_id, t.signed_date, 'request' AS action,
         c.id AS contact_id, c.first_name, c.last_name, c.email, c.phone,
         'A7:review_req:' || t.id AS run_key
  FROM transactions t JOIN contacts c ON c.id = t.contact_id
  WHERE t.review_requested_at IS NULL
    AND now() >= (t.signed_date::timestamptz + interval '2 days')
  UNION ALL
  -- J+5 : relance si pas d'avis
  SELECT t.id, t.agency_id, t.signed_date, 'followup',
         c.id, c.first_name, c.last_name, c.email, c.phone,
         'A7:review_followup:' || t.id
  FROM transactions t JOIN contacts c ON c.id = t.contact_id
  WHERE t.review_requested_at IS NOT NULL
    AND t.review_completed_at IS NULL
    AND t.review_followup_at IS NULL
    AND now() >= (t.signed_date::timestamptz + interval '5 days')
) due
WHERE NOT EXISTS (SELECT 1 FROM automation_runs ar WHERE ar.run_key = due.run_key);`);

  const build = code("Rédiger la demande d'avis", [480, 300], `const AGENCY = $env.IMMOMAIL_AGENCY_NAME || 'votre agence';
const LINK = $env.GOOGLE_REVIEW_LINK || 'https://g.page/r/immomail/review';
for (const item of $input.all()) {
  const j = item.json;
  const name = ((j.first_name||'')+' '+(j.last_name||'')).trim();
  if (j.action === 'request') {
    item.json.subject = 'Votre avis compte pour ' + AGENCY + ' 🙏';
    item.json.body = 'Bonjour ' + j.first_name + ',\\n\\nMerci de votre confiance ! Votre avis nous aiderait énormément. Cela prend 30 secondes :\\n👉 ' + LINK + '\\n\\nMerci beaucoup,\\n' + AGENCY;
    item.json.sms_body = name + ', merci pour votre confiance ! Un avis Google nous aiderait beaucoup : ' + LINK;
    item.json.update_col = 'review_requested_at';
  } else {
    item.json.subject = 'Petit rappel — votre avis pour ' + AGENCY;
    item.json.body = 'Bonjour ' + j.first_name + ',\\n\\nJuste un petit rappel : si vous avez un instant, votre avis compte beaucoup pour nous 🙏\\n👉 ' + LINK + '\\n\\nMerci,\\n' + AGENCY;
    item.json.sms_body = name + ', un petit rappel : votre avis Google nous aiderait beaucoup 🙏 ' + LINK;
    item.json.update_col = 'review_followup_at';
  }
}
return $input.all();`);

  const mailNode = email("Email avis", [720, 220], { to: "={{ $json.email }}", subject: "={{ $json.subject }}", text: "={{ $json.body }}" });
  const smsNode = sms("SMS avis", [720, 400], { to: "={{ $json.phone }}", body: "={{ $json.sms_body }}" });

  const record = pg("Journaliser A7 + horodater", [980, 300], `WITH upd AS (
  UPDATE transactions SET
    review_requested_at = CASE WHEN '{{ $json.update_col }}' = 'review_requested_at' THEN now()::text ELSE review_requested_at END,
    review_followup_at  = CASE WHEN '{{ $json.update_col }}' = 'review_followup_at'  THEN now()::text ELSE review_followup_at END
  WHERE id = {{ JSON.stringify($json.id) }}
),
run AS (
  INSERT INTO automation_runs (id, agency_id, automation_type, ref_id, run_key, executed_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A7', {{ JSON.stringify($json.id) }}, {{ JSON.stringify($json.run_key) }}, now()::text, now()::text)
  ON CONFLICT (run_key) DO NOTHING
),
msg AS (
  INSERT INTO messages (id, agency_id, channel, to_contact_id, to_name, to_address, subject, body, automation_type, sent_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'email', {{ JSON.stringify($json.contact_id) }}, {{ JSON.stringify(($json.first_name||'')+' '+($json.last_name||'')) }}, {{ JSON.stringify($json.email) }}, {{ JSON.stringify($json.subject) }}, {{ JSON.stringify($json.body) }}, 'A7', now()::text, now()::text)
)
INSERT INTO activity_log (id, agency_id, automation_type, description, ref_id, occurred_at, created_at)
VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A7', {{ JSON.stringify('Avis Google (' ) }} || {{ JSON.stringify($json.action) }} || {{ JSON.stringify(') → ') }} || {{ JSON.stringify(($json.first_name||'')+' '+($json.last_name||'')) }}, {{ JSON.stringify($json.id) }}, now()::text, now()::text);`);

  const note = sticky("A7 — Collecte d'avis Google\n\nQuotidien 10h. J+2 après signature : demande d'avis (email+SMS).\nJ+5 : relance si pas encore d'avis. Idempotent par transaction.", [240, 40], 480, 180);
  const conns = {
    ...chain("Chaque jour 10h", "Avis : demandes & relances dues", "Rédiger la demande d'avis"),
    "Rédiger la demande d'avis": { main: [[{ node: "Email avis", type: "main", index: 0 }]] },
    "Email avis": { main: [[{ node: "SMS avis", type: "main", index: 0 }]] },
    "SMS avis": { main: [[{ node: "Journaliser A7 + horodater", type: "main", index: 0 }]] },
  };
  save("A7-avis-google.json", wf("A7 · Collecte automatique d'avis Google",
    [note, trig, select, build, mailNode, smsNode, record], conns,
    "Demande d'avis Google J+2 + relance J+5 après signature."));
}

/* =========================================================================
 *  A8 — Demande de parrainage (J+30) — planifié quotidien
 * ========================================================================= */
{
  const trig = schedule("Chaque jour 11h", [0, 300], { interval: [{ field: "days", triggerAtHour: 11 }] });
  const select = pg("Parrainages dus (J+30)", [240, 300], `SELECT t.id, t.agency_id, t.type, t.signed_date,
       c.id AS contact_id, c.first_name, c.last_name, c.email, c.phone,
       p.title AS prop_title,
       'A8:referral:' || t.id AS run_key
FROM transactions t
JOIN contacts c ON c.id = t.contact_id
LEFT JOIN properties p ON p.id = t.property_id
WHERE t.referral_requested_at IS NULL
  AND now() >= (t.signed_date::timestamptz + interval '1 month')
  AND NOT EXISTS (SELECT 1 FROM automation_runs ar WHERE ar.run_key = 'A8:referral:' || t.id);`);

  const build = code("Rédiger le parrainage", [480, 300], `const AGENCY = $env.IMMOMAIL_AGENCY_NAME || 'votre agence';
for (const item of $input.all()) {
  const j = item.json;
  const name = ((j.first_name||'')+' '+(j.last_name||'')).trim();
  const verb = j.type === 'rental' ? 'emménagé' : 'signé';
  item.json.full_name = name;
  item.json.subject = 'Un mois déjà — parrainez vos proches 🎁';
  item.json.body = 'Bonjour ' + j.first_name + ',\\n\\nCela fait un mois que vous avez ' + verb + ' pour ' + (j.prop_title||'votre bien') + ' — nous espérons que tout se passe bien !\\n\\nSi vous connaissez un proche qui souhaite acheter, vendre ou louer, recommandez-nous : pour chaque mise en relation aboutie, nous offrons un bon de 200 €.\\n\\nMerci de votre confiance,\\n' + AGENCY;
  item.json.sms_body = j.first_name + ', parrainez un proche chez ' + AGENCY + ' et recevez 200 € par mise en relation aboutie ! Merci de votre confiance.';
}
return $input.all();`);

  const mailNode = email("Email parrainage", [720, 220], { to: "={{ $json.email }}", subject: "={{ $json.subject }}", text: "={{ $json.body }}" });
  const smsNode = sms("SMS parrainage", [720, 400], { to: "={{ $json.phone }}", body: "={{ $json.sms_body }}" });

  const record = pg("Journaliser A8 + horodater", [980, 300], `WITH upd AS (
  UPDATE transactions SET referral_requested_at = now()::text WHERE id = {{ JSON.stringify($json.id) }}
),
run AS (
  INSERT INTO automation_runs (id, agency_id, automation_type, ref_id, run_key, executed_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A8', {{ JSON.stringify($json.id) }}, {{ JSON.stringify($json.run_key) }}, now()::text, now()::text)
  ON CONFLICT (run_key) DO NOTHING
),
msg AS (
  INSERT INTO messages (id, agency_id, channel, to_contact_id, to_name, to_address, subject, body, automation_type, sent_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'email', {{ JSON.stringify($json.contact_id) }}, {{ JSON.stringify($json.full_name) }}, {{ JSON.stringify($json.email) }}, {{ JSON.stringify($json.subject) }}, {{ JSON.stringify($json.body) }}, 'A8', now()::text, now()::text)
)
INSERT INTO activity_log (id, agency_id, automation_type, description, ref_id, occurred_at, created_at)
VALUES (gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A8', {{ JSON.stringify('Demande de parrainage (J+30) → ') }} || {{ JSON.stringify($json.full_name) }}, {{ JSON.stringify($json.id) }}, now()::text, now()::text);`);

  const note = sticky("A8 — Demande de parrainage\n\nQuotidien 11h. 30 jours après la signature, propose au client\nde parrainer un proche (bon 200 €). Email + SMS, idempotent.", [240, 40], 480, 180);
  const conns = {
    ...chain("Chaque jour 11h", "Parrainages dus (J+30)", "Rédiger le parrainage"),
    "Rédiger le parrainage": { main: [[{ node: "Email parrainage", type: "main", index: 0 }]] },
    "Email parrainage": { main: [[{ node: "SMS parrainage", type: "main", index: 0 }]] },
    "SMS parrainage": { main: [[{ node: "Journaliser A8 + horodater", type: "main", index: 0 }]] },
  };
  save("A8-parrainage.json", wf("A8 · Demande de parrainage post-transaction",
    [note, trig, select, build, mailNode, smsNode, record], conns,
    "Demande de parrainage 30 jours après la transaction."));
}

/* =========================================================================
 *  A9 + A10 + A11 — Intake leads (IMAP → Claude → CRM + réponse instantanée)
 * ========================================================================= */
{
  const trig = node("Nouveaux emails (IMAP)", "n8n-nodes-base.emailReadImap", 2, [0, 400], {
    format: "resolved", options: {},
  }, { credentials: CRED.imap });

  // ⚙️ Config éditable en un seul endroit (pas de variables d'environnement à gérer).
  const config = node("⚙️ Config agence", "n8n-nodes-base.set", 3.4, [200, 400], {
    assignments: { assignments: [
      { id: randomUUID(), name: "agency_id", value: "REMPLACER-PAR-ID-AGENCE", type: "string" },
      { id: randomUUID(), name: "agency_name", value: "Agence Horizon Immobilier", type: "string" },
      { id: randomUUID(), name: "from_email", value: "contact@mon-agence.fr", type: "string" },
      { id: randomUUID(), name: "base_url", value: "https://immomail-studio.vercel.app", type: "string" },
    ] },
    includeOtherFields: true,
    options: {},
  });

  // Prépare la requête Claude (A9 : classification + extraction).
  const prompt = code("A9 · Préparer prompt Claude", [400, 400], `for (const item of $input.all()) {
  const j = item.json;
  const from = (typeof j.from === 'object' && j.from) ? (j.from.text || j.from.value?.[0]?.address || '') : (j.from || '');
  const subject = j.subject || '';
  const text = (j.text || j.textPlain || j.textAsHtml || '').toString().slice(0, 4000);
  const system = "Tu es l'assistant d'une agence immobilière. Tu tries les emails entrants de la boîte commune (portails SeLoger/LeBonCoin/Bien'ici + site). Réponds UNIQUEMENT en JSON strict.";
  const user = [
    'Classe cet email dans une catégorie : "spam" (démarchage/pub), "documents" (pièces d\\'un dossier existant), "visit_followup" (suivi après une visite), ou "lead" (nouvelle demande acheteur/locataire/estimation).',
    "Si c'est un lead, extrais : name, email, phone, requestType (purchase|rental|valuation), propertyRef (réf du bien type REF-001 si mentionnée, sinon null), priority (haute|moyenne|basse).",
    'Format de réponse : {"category":"...","name":"...","email":"...","phone":"...","requestType":"...","propertyRef":null,"priority":"moyenne"}',
    '',
    'DE: ' + from,
    'SUJET: ' + subject,
    'CORPS: ' + text,
  ].join('\\n');
  item.json.from_addr = from;
  item.json.subject_clean = subject;
  item.json.payload = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system,
    messages: [{ role: 'user', content: user }],
  };
}
return $input.all();`);

  const claude = node("A9 · Classifier (Claude)", "n8n-nodes-base.httpRequest", 4.2, [480, 400], {
    method: "POST",
    url: "https://api.anthropic.com/v1/messages",
    authentication: "genericCredentialType",
    genericAuthType: "httpHeaderAuth",
    sendHeaders: true,
    headerParameters: { parameters: [
      { name: "anthropic-version", value: "2023-06-01" },
      { name: "content-type", value: "application/json" },
    ] },
    sendBody: true, specifyBody: "json",
    jsonBody: "={{ JSON.stringify($json.payload) }}",
    options: {},
  }, { credentials: CRED.ant });

  const parse = code("A9 · Lire la classification", [720, 400], `const AGENCY = $('⚙️ Config agence').first().json.agency_id;
const out = [];
const items = $input.all();
for (let i = 0; i < items.length; i++) {
  const resp = items[i].json;
  const src = $('A9 · Préparer prompt Claude').all()[i].json;
  let verdict = { category: 'lead', name: '', email: null, phone: null, requestType: 'purchase', propertyRef: null, priority: 'moyenne' };
  try {
    const raw = resp.content?.[0]?.text || resp.text || '{}';
    verdict = { ...verdict, ...JSON.parse(raw.replace(/^[^{]*/, '').replace(/[^}]*$/, '')) };
  } catch (e) { verdict.category = 'lead'; }
  out.push({ json: {
    agency_id: AGENCY,
    from_addr: src.from_addr,
    subject: src.subject_clean,
    body_raw: (src.text || '').toString().slice(0, 4000),
    category: verdict.category,
    name: verdict.name || src.from_addr,
    email: verdict.email,
    phone: verdict.phone,
    request_type: verdict.requestType || 'purchase',
    property_ref: verdict.propertyRef,
    priority: verdict.priority || 'moyenne',
  }});
}
return out;`);

  const sw = node("A9 · Router la catégorie", "n8n-nodes-base.switch", 3.2, [960, 400], {
    mode: "rules",
    rules: { values: [
      { conditions: { options: { caseSensitive: true, typeValidation: "loose" }, combinator: "and",
        conditions: [{ leftValue: "={{ $json.category }}", rightValue: "lead", operator: { type: "string", operation: "equals" } }] },
        renameOutput: true, outputKey: "lead" },
      { conditions: { options: { caseSensitive: true, typeValidation: "loose" }, combinator: "and",
        conditions: [{ leftValue: "={{ $json.category }}", rightValue: "spam", operator: { type: "string", operation: "equals" } }] },
        renameOutput: true, outputKey: "spam" },
      { conditions: { options: { caseSensitive: true, typeValidation: "loose" }, combinator: "and",
        conditions: [{ leftValue: "={{ $json.category }}", rightValue: "documents", operator: { type: "string", operation: "equals" } }] },
        renameOutput: true, outputKey: "documents" },
      { conditions: { options: { caseSensitive: true, typeValidation: "loose" }, combinator: "and",
        conditions: [{ leftValue: "={{ $json.category }}", rightValue: "visit_followup", operator: { type: "string", operation: "equals" } }] },
        renameOutput: true, outputKey: "suivi" },
    ] },
    options: { fallbackOutput: "extra", renameFallbackOutput: "autre" },
  });

  // --- Sortie "lead" : A9 crée le lead, A11 la fiche CRM, A10 la réponse ---
  const createLead = pg("A9 · Créer le lead + fiche CRM (A11)", [1220, 240], `WITH ins_contact AS (
  INSERT INTO contacts (id, agency_id, first_name, last_name, email, phone, role, buyer_criteria, consent_marketing, created_at)
  SELECT gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }},
         split_part({{ JSON.stringify($json.name) }}, ' ', 1),
         NULLIF(regexp_replace({{ JSON.stringify($json.name) }}, '^\\\\S+\\\\s*', ''), ''),
         {{ $json.email ? JSON.stringify($json.email) : 'NULL' }},
         {{ $json.phone ? JSON.stringify($json.phone) : 'NULL' }},
         CASE {{ JSON.stringify($json.request_type) }} WHEN 'rental' THEN 'tenant' WHEN 'valuation' THEN 'owner' ELSE 'buyer' END,
         NULL, TRUE, now()::text
  WHERE NOT EXISTS (
    SELECT 1 FROM contacts c WHERE c.agency_id = {{ JSON.stringify($json.agency_id) }} AND c.email = {{ $json.email ? JSON.stringify($json.email) : 'NULL' }} AND {{ $json.email ? 'TRUE' : 'FALSE' }}
  )
  RETURNING id
),
contact_id AS (
  SELECT COALESCE(
    (SELECT id FROM ins_contact),
    (SELECT id FROM contacts WHERE agency_id = {{ JSON.stringify($json.agency_id) }} AND email = {{ $json.email ? JSON.stringify($json.email) : 'NULL' }} LIMIT 1)
  ) AS id
),
prop AS (
  SELECT id, negotiator FROM properties
  WHERE agency_id = {{ JSON.stringify($json.agency_id) }} AND ref = {{ $json.property_ref ? JSON.stringify($json.property_ref) : 'NULL' }}
  LIMIT 1
),
seq AS ( SELECT 'LD-' || (501 + count(*)) AS ext FROM leads WHERE agency_id = {{ JSON.stringify($json.agency_id) }} ),
ins_lead AS (
  INSERT INTO leads (id, agency_id, external_id, contact_id, property_id, name, email, phone, assigned_to, request_type, priority, status, created_at)
  SELECT gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, (SELECT ext FROM seq),
         (SELECT id FROM contact_id), (SELECT id FROM prop),
         {{ JSON.stringify($json.name) }}, {{ $json.email ? JSON.stringify($json.email) : 'NULL' }}, {{ $json.phone ? JSON.stringify($json.phone) : 'NULL' }},
         COALESCE((SELECT negotiator FROM prop), 'Accueil agence'),
         {{ JSON.stringify($json.request_type) }}, {{ JSON.stringify($json.priority) }}, 'new', now()::text
  RETURNING id, external_id, assigned_to, contact_id
),
log AS (
  INSERT INTO activity_log (id, agency_id, automation_type, description, ref_id, occurred_at, created_at)
  SELECT gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A9',
         'Lead qualifié ' || external_id || ' : ' || {{ JSON.stringify($json.name) }} || ' → ' || assigned_to, id, now()::text, now()::text
  FROM ins_lead
),
log_crm AS (
  INSERT INTO activity_log (id, agency_id, automation_type, description, ref_id, occurred_at, created_at)
  SELECT gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A11',
         'Fiche CRM créée sans ressaisie pour ' || {{ JSON.stringify($json.name) }}, contact_id, now()::text, now()::text
  FROM ins_lead
)
SELECT id AS lead_id, external_id, assigned_to FROM ins_lead;`);

  const replyMail = node("A10 · Réponse instantanée", "n8n-nodes-base.emailSend", 2.1, [1460, 240], {
    fromEmail: "={{ $('⚙️ Config agence').first().json.from_email }}",
    toEmail: "={{ $('A9 · Lire la classification').item.json.email }}",
    subject: "=Votre demande — {{ $('⚙️ Config agence').first().json.agency_name }}",
    emailFormat: "text",
    text: "=Bonjour {{ ($('A9 · Lire la classification').item.json.name || '').split(' ')[0] }},\n\nMerci pour votre demande, nous l'avons bien reçue. {{ $json.assigned_to }} vous recontacte très vite.\n\nPour réserver directement un créneau :\n👉 {{ $('⚙️ Config agence').first().json.base_url + '/book' }}\n\nÀ très vite,\n{{ $('⚙️ Config agence').first().json.agency_name }}",
    options: {},
  }, { credentials: CRED.smtp });

  const markResp = pg("A10 · Horodater 1re réponse", [1700, 240], `WITH upd AS (
  UPDATE leads SET first_response_at = now()::text, status = 'contacted' WHERE id = {{ JSON.stringify($json.lead_id) }}
),
run10 AS (
  INSERT INTO automation_runs (id, agency_id, automation_type, ref_id, run_key, executed_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($('A9 · Lire la classification').item.json.agency_id) }}, 'A10', {{ JSON.stringify($json.lead_id) }}, 'A10:instant_resp:' || {{ JSON.stringify($json.lead_id) }}, now()::text, now()::text)
  ON CONFLICT (run_key) DO NOTHING
),
msg AS (
  INSERT INTO messages (id, agency_id, channel, to_name, to_address, subject, body, automation_type, sent_at, created_at)
  VALUES (gen_random_uuid()::text, {{ JSON.stringify($('A9 · Lire la classification').item.json.agency_id) }}, 'email', {{ JSON.stringify($('A9 · Lire la classification').item.json.name) }}, {{ $('A9 · Lire la classification').item.json.email ? JSON.stringify($('A9 · Lire la classification').item.json.email) : 'NULL' }}, 'Votre demande', 'Accusé de réception 24/7', 'A10', now()::text, now()::text)
)
INSERT INTO activity_log (id, agency_id, automation_type, description, ref_id, occurred_at, created_at)
VALUES (gen_random_uuid()::text, {{ JSON.stringify($('A9 · Lire la classification').item.json.agency_id) }}, 'A10', 'Réponse instantanée envoyée (accusé 24/7)', {{ JSON.stringify($json.lead_id) }}, now()::text, now()::text);`);

  // --- Sorties non-lead : simple journal A9 ---
  const logOther = pg("A9 · Journaliser (non-lead)", [1220, 560], `INSERT INTO activity_log (id, agency_id, automation_type, description, ref_id, occurred_at, created_at)
VALUES (
  gen_random_uuid()::text, {{ JSON.stringify($json.agency_id) }}, 'A9',
  CASE {{ JSON.stringify($json.category) }}
    WHEN 'spam' THEN 'Spam / démarchage écarté automatiquement : ' || {{ JSON.stringify($json.subject) }}
    WHEN 'documents' THEN 'Email classé « pièces de dossier » : ' || {{ JSON.stringify($json.from_addr) }}
    WHEN 'visit_followup' THEN 'Email reconnu comme suivi post-visite : ' || {{ JSON.stringify($json.from_addr) }}
    ELSE 'Email non catégorisé, à revoir : ' || {{ JSON.stringify($json.subject) }}
  END,
  NULL, now()::text, now()::text
);`);

  const note = sticky(
    "A9 + A10 + A11 — Intake & qualification des leads (le « wow »)\n\n1. IMAP : lit la boîte commune (portails + site).\n2. A9 : Claude Haiku classe (spam / documents / suivi / lead) et extrait les infos.\n3. Switch : route selon la catégorie.\n4. Lead → A9 crée le lead + A11 la fiche CRM (sans ressaisie) → A10 réponse instantanée 24/7 + horodatage.\n5. Non-lead → journalisé (spam écarté, pièces classées, suivi identifié).\n\n⚠️ Renseigner IMMOMAIL_AGENCY_ID (résolution agence) — ou dériver l'agence de l'adresse de réception.",
    [240, 40], 620, 300);

  const conns = {
    "Nouveaux emails (IMAP)": { main: [[{ node: "⚙️ Config agence", type: "main", index: 0 }]] },
    "⚙️ Config agence": { main: [[{ node: "A9 · Préparer prompt Claude", type: "main", index: 0 }]] },
    "A9 · Préparer prompt Claude": { main: [[{ node: "A9 · Classifier (Claude)", type: "main", index: 0 }]] },
    "A9 · Classifier (Claude)": { main: [[{ node: "A9 · Lire la classification", type: "main", index: 0 }]] },
    "A9 · Lire la classification": { main: [[{ node: "A9 · Router la catégorie", type: "main", index: 0 }]] },
    "A9 · Router la catégorie": { main: [
      [{ node: "A9 · Créer le lead + fiche CRM (A11)", type: "main", index: 0 }], // lead
      [{ node: "A9 · Journaliser (non-lead)", type: "main", index: 0 }],          // spam
      [{ node: "A9 · Journaliser (non-lead)", type: "main", index: 0 }],          // documents
      [{ node: "A9 · Journaliser (non-lead)", type: "main", index: 0 }],          // suivi
      [{ node: "A9 · Journaliser (non-lead)", type: "main", index: 0 }],          // autre (fallback)
    ] },
    "A9 · Créer le lead + fiche CRM (A11)": { main: [[{ node: "A10 · Réponse instantanée", type: "main", index: 0 }]] },
    "A10 · Réponse instantanée": { main: [[{ node: "A10 · Horodater 1re réponse", type: "main", index: 0 }]] },
  };

  save("A9-A10-A11-intake-leads.json", wf("A9·A10·A11 · Intake & qualification des leads",
    [note, trig, config, prompt, claude, parse, sw, createLead, replyMail, markResp, logOther], conns,
    "Boîte commune → Claude classe/extrait (A9) → lead + CRM (A11) → réponse instantanée (A10)."));
}

console.log("\\nTerminé.");
