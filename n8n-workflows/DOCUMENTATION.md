# Documentation des workflows n8n — ImmoMail Studio

Cette doc explique, pour chacun des 9 workflows, **la logique métier** puis **le rôle de
chaque nœud**. Elle complète le [README](README.md) (import, credentials, variables d'env).

---

## 1. Architecture générale

Chaque workflow suit le même patron en 4 temps :

```
┌────────────┐   ┌────────────────┐   ┌──────────────────┐   ┌──────────────────────┐
│ DÉCLENCHEUR │ → │ LIRE (Postgres) │ → │ PRÉPARER (Code) │ → │ AGIR (Email/SMS/HTTP) │
│ cron/webhook│   │  éléments dus   │   │ construire texte │   │  + JOURNALISER (SQL) │
│  /IMAP      │   │  (filtre idempo)│   │                  │   │                      │
└────────────┘   └────────────────┘   └──────────────────┘   └──────────────────────┘
```

- **Une même base Supabase** que l'app (tables décrites dans `lib/db/ddl.ts`).
- **Idempotence** : rien n'est envoyé deux fois, grâce à la table `automation_runs`
  et sa colonne unique `run_key` (voir §3).
- **Journalisation** : chaque action écrit dans `messages` (trace des envois) et
  `activity_log` (fil d'activité affiché dans l'app) → l'UI reflète ce que fait n8n.

### Vue d'ensemble

```
 DÉCLENCHEURS              n8n (9 workflows)            SERVICES & DONNÉES
┌───────────────┐       ┌──────────────────┐
│ Réservation   │──A1──▶│ Visites   A1·A2  │────────────────┐
│ (site public) │       ├──────────────────┤                │
├───────────────┤       │ Gestion A3·A4·A5 │──emails──▶ ┌──────────┐
│ Planificateur │─A2-A8▶│                  │──SMS─────▶ │ SMTP/SMS │
│ (cron)        │       ├──────────────────┤            └──────────┘
├───────────────┤       │ Marketing A6-A8  │──PDF A4──▶ ┌──────────┐
│ Boîte IMAP    │A9-A11▶├──────────────────┤            │ API app  │
│ (portails)    │       │ Leads A9·A10·A11 │──classe──▶ ┌──────────┐
└───────────────┘       └────────┬─────────┘   A9       │  Claude  │
                                 │                       └──────────┘
                          SQL lit/écrit ⇅  ┌───────────────────────┐
                                           │  Supabase PostgreSQL  │
                                           └───────────┬───────────┘
                                       l'UI lit messages│+ activity_log
                                           ┌────────────▼──────────┐
                                           │  App ImmoMail Studio  │
                                           └───────────────────────┘
```

Les 9 workflows partagent tous la même base Supabase (lecture des éléments dus + écriture
des logs) ; l'app relit `messages`/`activity_log` pour afficher l'activité en temps réel.

### Concept n8n clé : « 1 item = 1 exécution »

En n8n, les données circulent en **items** (lignes JSON). Quand un nœud Postgres renvoie
5 lignes, **chaque nœud suivant s'exécute 5 fois**, une fois par item, automatiquement.
👉 C'est pourquoi il n'y a pas de « boucle » explicite : le nœud `Email` après un `SELECT`
de 5 quittances enverra bien 5 emails.

---

## 2. Glossaire des types de nœuds utilisés

| Type n8n | Nom courant | Rôle dans ces workflows |
|----------|-------------|--------------------------|
| `scheduleTrigger` | **Schedule Trigger** | Déclenche le workflow sur un cron (toutes les 15 min, chaque jour à 8h…). |
| `webhook` | **Webhook** | Point d'entrée HTTP. Ici : réception d'une réservation (A1). |
| `respondToWebhook` | **Respond to Webhook** | Renvoie la réponse HTTP au client qui a appelé le webhook. |
| `emailReadImap` | **Email Trigger (IMAP)** | Déclenche à chaque nouvel email dans une boîte (A9). |
| `postgres` | **Postgres** | Exécute du SQL sur Supabase (lecture des éléments dus, écriture des logs/flags). |
| `code` | **Code (JavaScript)** | Construit les textes FR (sujets, corps de mail/SMS) et transforme les items. |
| `emailSend` | **Send Email (SMTP)** | Envoie un email via SMTP. |
| `httpRequest` | **HTTP Request** | Appels sortants : SMS (provider), API Claude (A9), PDF quittance (A4). |
| `switch` | **Switch** | Aiguille les items selon une valeur (catégorie de l'email en A9). |
| `stickyNote` | **Sticky Note** | Post-it de doc dans le canvas (n'exécute rien). |

### Comment lire les expressions n8n

- `{{ ... }}` = expression évaluée. `={{ ... }}` = le champ **entier** est une expression.
- `$json.champ` = valeur du champ de l'**item courant**.
- `$env.VARIABLE` = variable d'environnement n8n.
- `$('Nom du nœud').item.json.champ` = valeur venant d'**un autre nœud** (même item).
- `$input.all()` (dans Code) = tous les items reçus.
- `JSON.stringify(x)` dans le SQL sert à **échapper** proprement une valeur en littéral SQL
  (chaîne entre guillemets, ou `null`).

---

## 3. Conventions transversales

### Idempotence (`automation_runs.run_key`)

Avant/pendant un envoi, on réserve une clé unique :

```sql
INSERT INTO automation_runs (..., run_key, ...) VALUES (..., 'A4:receipt:<bail>:2026-07', ...)
ON CONFLICT (run_key) DO NOTHING;
```

Et on **exclut** de la sélection ce qui est déjà réservé :

```sql
WHERE NOT EXISTS (SELECT 1 FROM automation_runs ar WHERE ar.run_key = <la clé calculée>)
```

Conventions de clés (identiques au moteur in-app) :

| Auto | Clé | Granularité |
|------|-----|-------------|
| A2 | `A2:confirm:<apt>` / `A2:reminder_j1:<apt>` / `A2:reminder_h2:<apt>` | 1 par action & RDV |
| A3 | `A3:mandate_expiry:<mandat>` | 1 par mandat |
| A4 | `A4:receipt:<bail>:<YYYY-MM>` | 1 par bail & mois |
| A5 | `A5:compliance:<item>` | 1 par échéance |
| A6 | `A6:newsletter:<contact>:<IYYY-IW>` | 1 par contact & semaine ISO |
| A7 | `A7:review_req:<tx>` / `A7:review_followup:<tx>` | 1 par transaction |
| A8 | `A8:referral:<tx>` | 1 par transaction |
| A10 | `A10:instant_resp:<lead>` | 1 par lead |

### Horloge

L'app de démo utilise une **horloge simulée** (`demo_clock`). En production n8n, on utilise
le **`now()` réel de PostgreSQL**. Toutes les fenêtres temporelles (J-1, H-2, J+2, J+5,
J+30, J-30) sont calculées en SQL avec des `interval`.

### Dates stockées en TEXT

Les colonnes de dates sont en `TEXT` (ISO). D'où les casts `colonne::timestamptz` avant
toute comparaison de dates.

---

## 4. Workflows en détail

> Dans chaque tableau, la colonne **Type** renvoie au glossaire §2.

---

### A1 · Prise de RDV automatique

**Logique** : la page publique de réservation (`/book/:propertyId`, style Calendly) poste
les infos du créneau choisi. Le workflow crée le rendez-vous en base. C'est **A2** (planifié)
qui enverra ensuite la confirmation puis les rappels.

**Déclencheur** : Webhook `POST /webhook/immomail/booking`.

```
Webhook réservation → Créer le RDV (appointments) → Répondre 200
```

| Nœud | Type | Rôle |
|------|------|------|
| **Webhook réservation** | webhook | Reçoit le POST du formulaire. `responseMode: responseNode` → c'est un autre nœud qui répondra. Attend un body `{ agencyId, propertyId, contactName, contactEmail, contactPhone, type, scheduledAt }`. |
| **Créer le RDV (appointments)** | postgres | `INSERT` du rendez-vous (id via `gen_random_uuid()`), statut `requested`. Une CTE `log` écrit aussi la ligne `activity_log` (code A1). `RETURNING` l'id pour la réponse. |
| **Répondre 200** | respondToWebhook | Renvoie `{ ok: true, appointmentId }` au client. |

---

### A2 · Confirmation + rappels de visite

**Logique** : toutes les 15 min, on cherche les RDV qui ont besoin (1) d'une confirmation
immédiate, (2) d'un rappel J-1, (3) d'un rappel H-2. Chaque cas est envoyé une seule fois
(idempotence) et marque le flag correspondant (`confirmation_sent_at`, `reminder_j1_sent_at`,
`reminder_h2_sent_at`).

**Déclencheur** : Schedule, toutes les 15 minutes.

```
Toutes les 15 min → RDV : actions dues → Construire le message → Email → SMS → Marquer envoyé + journaliser
```

| Nœud | Type | Rôle |
|------|------|------|
| **Toutes les 15 min** | scheduleTrigger | Cron `minutesInterval: 15`. |
| **RDV : actions dues** | postgres | `UNION ALL` de 3 sous-requêtes (confirm / J-1 / H-2). Chaque ligne porte un `action` et une `run_key`. Le `WHERE NOT EXISTS` sur `automation_runs` évite les doublons. Joint `properties` pour le lieu. |
| **Construire le message** | code | Selon `action`, compose `subject`, `body` (FR, avec date/heure/lieu) et `update_col` (le flag à mettre à jour). |
| **Email de confirmation** | emailSend | Envoie l'email (`to_email`, `subject`, `body`). |
| **SMS** | httpRequest | POST vers le provider SMS (`to_phone`, `body`). À adapter au provider réel. |
| **Marquer envoyé + journaliser** | postgres | `UPDATE` du bon flag (via `CASE` sur `update_col`), passe le statut à `reminded` sur J-1, réserve la `run_key`, insère `messages` + `activity_log`. |

---

### A3 · Alerte expiration de mandat

**Logique** : chaque matin, on relance les propriétaires dont le mandat **actif** arrive à
échéance dans **30 jours ou moins** — pour proposer un renouvellement (récurrence de business).

**Déclencheur** : Schedule, chaque jour à 8h.

```
Chaque jour 8h → Mandats à J-30 → Rédiger la relance → Email au propriétaire → Journaliser A3
```

| Nœud | Type | Rôle |
|------|------|------|
| **Chaque jour 8h** | scheduleTrigger | Cron quotidien `triggerAtHour: 8`. |
| **Mandats à J-30** | postgres | Mandats `active` où `now() >= end_date - 30j`, non déjà traités. Joint `properties` (titre du bien) et `contacts` (propriétaire). |
| **Rédiger la relance** | code | Compose le mail de renouvellement (nom du propriétaire, type de mandat, date d'échéance). |
| **Email au propriétaire** | emailSend | Envoie la relance. |
| **Journaliser A3** | postgres | Réserve la `run_key`, insère `messages` + `activity_log` (« Mandat à relancer : … »). |

---

### A4 · Quittances de loyer automatiques

**Logique** : chaque jour, dès que le **jour d'échéance** (`rent_due_day`) du bail est atteint
ce mois-ci, on génère la quittance (vrai PDF via l'endpoint existant de l'app) et on l'envoie
au locataire. Une seule quittance par bail et par mois.

**Déclencheur** : Schedule, chaque jour à 9h.

```
Chaque jour 9h → Quittances dues ce mois → Préparer la quittance → Générer le PDF (app) → Email + PDF → Journaliser A4
```

| Nœud | Type | Rôle |
|------|------|------|
| **Chaque jour 9h** | scheduleTrigger | Cron quotidien. |
| **Quittances dues ce mois** | postgres | Baux en cours où `date_part('day', now()) >= rent_due_day`, non déjà émis pour `to_char(now(),'YYYY-MM')`. Joint `properties` + `contacts` (locataire). |
| **Préparer la quittance** | code | Calcule le total (loyer + charges), le libellé de période FR, le `subject`, l'`attachment_url` (`/api/receipt/<bail>?period=YYYY-MM`) et le corps du mail. |
| **Générer le PDF (app)** | httpRequest | `GET` sur `IMMOMAIL_BASE_URL + attachment_url`. `responseFormat: file` → récupère le **binaire PDF** dans la propriété `data`. |
| **Email quittance + PDF** | emailSend | Envoie l'email avec `options.attachments: data` (le PDF). Les champs texte viennent du nœud « Préparer la quittance » via `$('…').item.json`. |
| **Journaliser A4** | postgres | Réserve la `run_key` mensuelle, insère `messages` (avec `attachment_url`) + `activity_log`. |

---

### A5 · Rappel diagnostics & échéances (conformité)

**Logique** : chaque matin, on repère les échéances de conformité **en attente** (DPE, assurance
PNO, renouvellement de bail…) dont la date arrive dans `reminder_days_before` jours. On passe
le statut à `reminded` et on prévient le négociateur en interne.

**Déclencheur** : Schedule, chaque jour à 8h.

```
Chaque jour 8h → Conformité à échéance ─┬→ Marquer 'reminded' + journaliser
                                         └→ Email interne négociateur
```
*(la sélection alimente deux nœuds en parallèle)*

| Nœud | Type | Rôle |
|------|------|------|
| **Chaque jour 8h** | scheduleTrigger | Cron quotidien. |
| **Conformité à échéance** | postgres | `compliance_items` `pending` où `now() >= due_date - reminder_days_before jours`, non déjà rappelés. Joint `properties`. |
| **Marquer 'reminded' + journaliser** | postgres | `UPDATE status = 'reminded'`, réserve la `run_key`, insère `activity_log`. |
| **Email interne négociateur** | emailSend | Prévient l'agence (`IMMOMAIL_AGENCY_INBOX`) qu'un diagnostic est à renouveler. |

---

### A6 · Newsletter acheteurs segmentée

**Logique** : chaque lundi, on rapproche les **biens dispo récents** (créés dans les 7 jours)
des **critères** de chaque contact (budget, type, zones, nb de pièces) et on envoie à chacun
sa sélection personnalisée. Un envoi par contact et par semaine.

**Déclencheur** : Schedule, chaque lundi à 9h.

```
Chaque lundi 9h → Matching biens ↔ acheteurs → Composer la newsletter → Email newsletter → Journaliser A6
```

| Nœud | Type | Rôle |
|------|------|------|
| **Chaque lundi 9h** | scheduleTrigger | Cron hebdo (`weeks`, lundi, 9h). |
| **Matching biens ↔ acheteurs** | postgres | CTE `new_props` (biens `available` < 7j) jointe aux `contacts` opt-in. Le matching lit le JSON `buyer_criteria` (`::jsonb`) : budget, type, `minRooms`, et zones (`? np.zone`). `jsonb_agg` regroupe les biens par contact. `run_key` par semaine ISO (`IYYY-IW`). |
| **Composer la newsletter** | code | Parse la liste de biens, construit les lignes `• Titre (ville) — prix [réf]` et le corps du mail. |
| **Email newsletter** | emailSend | Envoie la sélection au contact. |
| **Journaliser A6** | postgres | Réserve la `run_key`, insère `messages` + `activity_log` (avec le nb de biens). |

---

### A7 · Collecte automatique d'avis Google

**Logique** : chaque jour, **J+2** après une signature on demande un avis Google (email + SMS) ;
**J+5**, s'il n'y a toujours pas d'avis déposé, on relance une fois. Idempotent par transaction.

**Déclencheur** : Schedule, chaque jour à 10h.

```
Chaque jour 10h → Avis : demandes & relances dues → Rédiger la demande → Email avis → SMS avis → Journaliser A7 + horodater
```

| Nœud | Type | Rôle |
|------|------|------|
| **Chaque jour 10h** | scheduleTrigger | Cron quotidien. |
| **Avis : demandes & relances dues** | postgres | `UNION ALL` : J+2 (`review_requested_at IS NULL`) et J+5 (`review_requested_at` posé, `review_completed_at`/`review_followup_at` nuls). Chaque ligne porte `action` + `run_key`. Joint `contacts`. |
| **Rédiger la demande d'avis** | code | Selon `action`, compose email + SMS avec le lien `GOOGLE_REVIEW_LINK`, et le flag `update_col` (`review_requested_at` ou `review_followup_at`). |
| **Email avis** | emailSend | Envoie la demande/relance par email. |
| **SMS avis** | httpRequest | Envoie la version SMS. |
| **Journaliser A7 + horodater** | postgres | `UPDATE` du bon flag (`CASE`), réserve la `run_key`, insère `messages` + `activity_log`. |

---

### A8 · Demande de parrainage post-transaction

**Logique** : chaque jour, **30 jours** après une signature, on propose au client de parrainer
un proche (bon de 200 € par mise en relation aboutie). Email + SMS, une fois par transaction.

**Déclencheur** : Schedule, chaque jour à 11h.

```
Chaque jour 11h → Parrainages dus (J+30) → Rédiger le parrainage → Email parrainage → SMS parrainage → Journaliser A8 + horodater
```

| Nœud | Type | Rôle |
|------|------|------|
| **Chaque jour 11h** | scheduleTrigger | Cron quotidien. |
| **Parrainages dus (J+30)** | postgres | Transactions où `referral_requested_at IS NULL` et `now() >= signed_date + 1 mois`, non déjà traitées. Joint `contacts` + `properties`. |
| **Rédiger le parrainage** | code | Compose email + SMS (verbe « emménagé » pour une location, « signé » sinon). |
| **Email parrainage** | emailSend | Envoie l'email. |
| **SMS parrainage** | httpRequest | Envoie le SMS. |
| **Journaliser A8 + horodater** | postgres | `UPDATE referral_requested_at`, réserve la `run_key`, insère `messages` + `activity_log`. |

---

### A9 · A10 · A11 · Intake & qualification des leads (le « wow »)

**Logique** : c'est le cœur de la démo. À **chaque email entrant** dans la boîte commune
(portails SeLoger / LeBonCoin / Bien'ici + site), on classe le message avec **Claude Haiku**
(A9). Selon la catégorie :

- **spam** → écarté, journalisé ;
- **documents** → classé « pièces de dossier » ;
- **visit_followup** → reconnu comme suivi post-visite ;
- **lead** → on **crée le lead** (A9), on **crée la fiche CRM sans ressaisie** (A11), puis on
  envoie une **réponse instantanée 24/7** au prospect (A10) et on horodate la 1re réponse.

**Déclencheur** : Email Trigger (IMAP).

```
Nouveaux emails (IMAP)
   → ⚙️ Config agence
   → A9 · Préparer prompt Claude
   → A9 · Classifier (Claude)
   → A9 · Lire la classification
   → A9 · Router la catégorie ─┬─(lead)──→ A9 · Créer le lead + fiche CRM (A11)
                               │            → A10 · Réponse instantanée
                               │            → A10 · Horodater 1re réponse
                               └─(spam/documents/suivi/autre)──→ A9 · Journaliser (non-lead)
```

| Nœud | Type | Rôle |
|------|------|------|
| **Nouveaux emails (IMAP)** | emailReadImap | Déclenche à chaque nouvel email de la boîte commune. `format: resolved` → fournit `from`, `subject`, `text`… |
| **⚙️ Config agence** | set | Centralise en un seul nœud éditable `agency_id`, `agency_name`, `from_email`, `base_url` (remplace les variables d'environnement). `includeOtherFields: true` laisse passer les champs de l'email. |
| **A9 · Préparer prompt Claude** | code | Nettoie l'email et construit le `payload` de l'API Anthropic (modèle `claude-haiku-4-5`, `system` + consigne de classification/extraction en **JSON strict**). |
| **A9 · Classifier (Claude)** | httpRequest | `POST https://api.anthropic.com/v1/messages`. Auth = **Header Auth** (`x-api-key`). Header `anthropic-version`. Corps = `payload`. |
| **A9 · Lire la classification** | code | Parse le JSON renvoyé par Claude, récupère l'item email d'origine via `$('A9 · Préparer prompt Claude').all()[i]`, et produit un item propre : `category`, `name`, `email`, `phone`, `request_type`, `property_ref`, `priority`, `agency_id`. |
| **A9 · Router la catégorie** | switch | 4 sorties nommées (`lead`, `spam`, `documents`, `suivi`) + fallback `autre`, selon `category`. |
| **A9 · Créer le lead + fiche CRM (A11)** | postgres | Sortie **lead**. Grosse requête à CTE : upsert du `contact` (A11, dédup par email), résolution du bien via `ref`, numéro de lead lisible `LD-xxx`, `INSERT` du `lead` routé vers le négociateur, et 2 lignes `activity_log` (A9 lead qualifié + A11 fiche CRM). `RETURNING lead_id, assigned_to`. |
| **A10 · Réponse instantanée** | emailSend | Accusé de réception 24/7 au prospect, avec le lien de réservation (`/book`) et le nom du conseiller assigné. |
| **A10 · Horodater 1re réponse** | postgres | `UPDATE leads SET first_response_at, status='contacted'`, réserve `A10:instant_resp:<lead>`, insère `messages` + `activity_log`. |
| **A9 · Journaliser (non-lead)** | postgres | Sorties spam/documents/suivi/autre. Écrit la bonne ligne `activity_log` selon la catégorie (spam écarté, pièces classées, suivi identifié). |

> ⚠️ **Multi-agences** : l'agence cible est fixée dans le nœud **⚙️ Config agence** (`agency_id`).
> En production réelle, mieux vaut dériver l'agence de l'adresse de réception (une boîte/alias par agence).

---

## 5. Rappels d'exploitation

- **Credentials** à rattacher après import : Postgres (Supabase), SMTP, IMAP, Header Auth
  Anthropic (`x-api-key`), Header Auth SMS. Détails dans le [README](README.md).
- **Sécurité SQL** : pour la prod, remplacer les expressions inline `{{ JSON.stringify(...) }}`
  dans les nœuds Postgres par des **Query Parameters** paramétrés (anti-injection).
- **Nœud SMS** générique : adapter l'URL et le corps au provider réel (Brevo, Twilio, OVH…).
- **Régénérer / re-pousser** : `node n8n-workflows/build.mjs` puis
  `N8N_API_KEY=… node n8n-workflows/push.mjs`.
