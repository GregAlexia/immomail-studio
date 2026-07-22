# Workflows n8n — ImmoMail Studio

Ces 11 workflows externalisent dans **n8n** les 11 automatisations (A1–A11) que l'app
exécute aujourd'hui en interne (moteur `lib/automation-engine.ts` + horloge de démo).
Ils tapent sur la **même base Supabase** et respectent la même logique d'idempotence
(`automation_runs.run_key`).

> Objectif : passer de la démo (horloge simulée + services mockés) à un fonctionnement
> réel piloté par n8n (cron réel, vrais SMTP/SMS, classification par Claude).

📖 **Logique détaillée + rôle de chaque nœud** : voir [DOCUMENTATION.md](DOCUMENTATION.md).
🚀 **Configuration & activation pas-à-pas** (credentials, tests à blanc, ordre d'activation, dépannage) : voir [GUIDE-ACTIVATION.md](GUIDE-ACTIVATION.md).
📇 **Référence par automatisation** (rôle, tout ce qui se paramètre, outils IA) : voir [REFERENCE-AUTOMATISATIONS.md](REFERENCE-AUTOMATISATIONS.md).

## Correspondance automatisations → fichiers

| Code | Automatisation | Fichier | Déclencheur |
|------|----------------|---------|-------------|
| **A1** | Prise de RDV automatique | `A1-prise-rdv-webhook.json` | Webhook `POST /webhook/immomail/booking` |
| **A2** | Confirmation + rappels de visite | `A2-confirmation-rappels-visites.json` | Cron 15 min |
| **A3** | Alerte expiration de mandat | `A3-alerte-expiration-mandat.json` | Cron quotidien 8h |
| **A4** | Quittances de loyer | `A4-quittances-loyer.json` | Cron quotidien 9h |
| **A5** | Rappel diagnostics & échéances | `A5-rappel-conformite.json` | Cron quotidien 8h |
| **A6** | Newsletter acheteurs segmentée | `A6-newsletter-segmentee.json` | Cron lundi 9h |
| **A7** | Collecte d'avis Google (J+2 / J+5) | `A7-avis-google.json` | Cron quotidien 10h |
| **A8** | Demande de parrainage (J+30) | `A8-parrainage.json` | Cron quotidien 11h |
| **A9 · A10 · A11** | Tri des leads + réponse instantanée + fiche CRM | `A9-A10-A11-intake-leads.json` | IMAP (nouveaux emails) |
| **A6b** | Newsletter à la demande (un segment) | `A6b-newsletter-webhook.json` | Webhook `POST /webhook/immomail/newsletter` |
| **A7b** | Avis déposé → stop relance | `A7b-avis-depose-webhook.json` | Webhook `POST /webhook/immomail/review-done` |

> A9/A10/A11 forment **un seul** workflow : un email entrant déclenche la chaîne complète
> (classer → créer le lead → créer la fiche CRM → répondre). Les séparer casserait
> l'enchaînement temps réel. Les 3 codes apparaissent bien dans `activity_log`.

## Import dans n8n

1. n8n → **Workflows → Import from File**.
2. Importer les 11 `.json` (un par un).
3. Sur chaque nœud rouge (credential manquant), **sélectionner/créer** la credential (voir ci-dessous).
4. Vérifier, puis **activer** chaque workflow.

## Credentials à créer

| Credential (nom attendu) | Type n8n | Usage |
|--------------------------|----------|-------|
| `Supabase ImmoMail (pooler session 5432)` | **Postgres** | Lecture/écriture des tables. Host = pooler Supabase **port 5432 (session)**, SSL requis. |
| `SMTP ImmoMail` | **SMTP** | Envoi des emails (confirmations, quittances, avis, parrainage…). |
| `Boite leads IMAP (portails)` | **IMAP** | Boîte commune qui reçoit les leads des portails + site (A9). |
| `Anthropic API (header x-api-key)` | **Header Auth** | `Name = x-api-key`, `Value = sk-ant-…`. Classification A9 (Claude Haiku). |
| `SMS Provider (Brevo / Twilio)` | **Header Auth** | Clé API du provider SMS. Adapter l'URL/mapping dans les nœuds « SMS ». |

## Variables d'environnement n8n

À définir dans n8n (Settings → Variables, ou env de l'instance) :

| Variable | Exemple | Rôle |
|----------|---------|------|
| `IMMOMAIL_AGENCY_ID` | `id de l'agence` | Agence cible pour l'intake IMAP (A9). Sinon dériver de l'adresse de réception. |
| `IMMOMAIL_AGENCY_NAME` | `Agence Horizon Immobilier` | Signature des messages. |
| `IMMOMAIL_FROM_EMAIL` | `contact@horizon-immo.fr` | Expéditeur SMTP. |
| `IMMOMAIL_AGENCY_INBOX` | `gestion@horizon-immo.fr` | Destinataire des alertes internes A5. |
| `IMMOMAIL_BASE_URL` | `https://immomail-studio.vercel.app` | Base pour le PDF quittance (A4) et le lien de réservation (A10). |
| `GOOGLE_REVIEW_LINK` | `https://g.page/r/…/review` | Lien d'avis Google (A7). |
| `SMS_API_URL` | `https://api.brevo.com/v3/transactionalSMS/sms` | Endpoint SMS. |

## Principes de conception

- **Idempotence** — chaque envoi réserve une clé unique dans `automation_runs.run_key`
  (`INSERT … ON CONFLICT (run_key) DO NOTHING`), avec les mêmes conventions de clés que
  le moteur in-app (`A4:receipt:<lease>:<YYYY-MM>`, `A7:review_req:<tx>`, etc.).
  Un même message n'est donc jamais envoyé deux fois, même si le cron re-tourne.
- **Horloge** — en prod, l'horloge de démo (`demo_clock`) est remplacée par le `now()`
  PostgreSQL réel. Les fenêtres (J-1, H-2, J+2, J+5, J+30, J-30) sont calculées en SQL
  avec `interval`.
- **Journalisation** — chaque workflow écrit dans `messages` (trace des envois) et
  `activity_log` (fil d'activité affiché dans l'app), donc l'UI reflète ce que fait n8n.
- **PDF réel** — A4 récupère la vraie quittance via l'endpoint existant `/api/receipt/:leaseId?period=YYYY-MM`.
- **Classification** — A9 utilise **Claude Haiku** (au lieu du classifieur heuristique de la démo).

## Régénérer

Les `.json` sont générés par `build.mjs` (source de vérité, conventions partagées) :

```bash
node n8n-workflows/build.mjs
```

## ⚠️ À vérifier avant la prod

- **SQL en clair vs paramètres** — pour aller en prod, remplacer les expressions inline
  `{{ JSON.stringify(...) }}` par des **Query Parameters** paramétrés du nœud Postgres
  (protection anti-injection). Ici les valeurs viennent de Claude/formulaires, à sécuriser.
- **Résolution de l'agence** dans A9 (multi-agences) : mapper l'adresse IMAP de réception
  → `agency_id`, ou une boîte par agence.
- **Nœud SMS** générique : adapter URL + corps au provider réel (Brevo, Twilio, OVH…).
- **Anthropic** : le modèle est `claude-haiku-4-5-20251001` — ajuster si besoin.
