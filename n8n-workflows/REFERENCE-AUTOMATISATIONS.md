# Référence des automatisations n8n — ImmoMail Studio

Document de référence des **11 workflows n8n** couvrant les 11 automatisations
métier (A1–A11) : le rôle de chacun, **tout ce qui se paramètre** (où et avec
quelle valeur par défaut), et les **outils d'IA** utilisés.

Documents complémentaires :
- [README.md](README.md) — vue d'ensemble et principes de conception ;
- [DOCUMENTATION.md](DOCUMENTATION.md) — logique détaillée, nœud par nœud ;
- [GUIDE-ACTIVATION.md](GUIDE-ACTIVATION.md) — installation, tests, mise en service.

---

## 1. Synthèse

| Workflow | Automatisations | Rôle en une phrase | Déclencheur | IA |
|---|---|---|---|---|
| `A1-prise-rdv-webhook` | A1 | Créer un RDV depuis la réservation en ligne | Webhook HTTP | — |
| `A2-confirmation-rappels-visites` | A2 | Confirmer chaque RDV puis rappeler à J-1 et H-2 | Cron **15 min** | — |
| `A3-alerte-expiration-mandat` | A3 | Relancer le propriétaire 30 j avant l'échéance du mandat | Cron **8h/j** | — |
| `A4-quittances-loyer` | A4 | Générer et envoyer la quittance PDF au jour d'échéance | Cron **9h/j** | — |
| `A5-rappel-conformite` | A5 | Alerter l'agence avant chaque échéance réglementaire | Cron **8h/j** | — |
| `A6-newsletter-segmentee` | A6 | Envoyer aux acheteurs les nouveaux biens qui matchent leurs critères | Cron **lundi 9h** | — |
| `A7-avis-google` | A7 | Demander un avis Google à J+2, relancer à J+5 | Cron **10h/j** | — |
| `A8-parrainage` | A8 | Proposer le parrainage (bon 200 €) à J+30 de la signature | Cron **11h/j** | — |
| `A9-A10-A11-intake-leads` | A9 · A10 · A11 | Trier chaque email entrant, créer lead + fiche CRM, répondre 24/7 | **IMAP** (email reçu) | ✅ **Claude Haiku** |
| `A6b-newsletter-webhook` | A6 (à la demande) | Envoyer immédiatement la newsletter d'un segment (miroir du bouton de l'app) | Webhook HTTP | — |
| `A7b-avis-depose-webhook` | A7 (complément) | Marquer un avis Google déposé et stopper la relance J+5 | Webhook HTTP | — |

### Couverture fonctionnalités de l'application ↔ workflows n8n

| Fonctionnalité de l'app | Workflow n8n | Couverture |
|---|---|---|
| Réservation en ligne (`bookAppointment`, page `/book`) | `A1-prise-rdv-webhook` | ✅ |
| Confirmations & rappels de visite | `A2-confirmation-rappels-visites` | ✅ |
| Alerte mandats / relance propriétaire | `A3-alerte-expiration-mandat` | ✅ |
| Quittances PDF mensuelles | `A4-quittances-loyer` | ✅ |
| Rappels de conformité | `A5-rappel-conformite` | ✅ |
| Newsletter automatique (nouveaux biens) | `A6-newsletter-segmentee` (cron hebdo) | ✅ |
| Bouton « Envoyer la newsletter » d'un segment (`sendNewsletter`) | `A6b-newsletter-webhook` | ✅ |
| Demande d'avis J+2 + relance J+5 | `A7-avis-google` | ✅ |
| Bouton « Simuler : avis laissé » (`markReviewDone`) | `A7b-avis-depose-webhook` | ✅ |
| Parrainage J+30 | `A8-parrainage` | ✅ |
| Tri des emails, fiche CRM, réponse instantanée | `A9-A10-A11-intake-leads` | ✅ |
| Horloge de démo, « Évaluer », « Réinitialiser » | — | N/A : artifices de démo, remplacés en production par les crons réels |
| Sélecteur d'agence, menu Paramétrage | — | N/A : préférences d'interface (cookies), pas des automatisations |
| Import / Export Excel | — | N/A : gestion de données via l'UI de l'app |

Tous partagent : la **même base Supabase** que l'application, l'**idempotence**
par `automation_runs.run_key` (jamais de doublon d'envoi), et la
**journalisation** dans `messages` + `activity_log` (l'app affiche donc en
direct ce que fait n8n).

---

## 2. Socle commun à paramétrer (une seule fois)

### 2.1 Les 5 credentials n8n

| Credential | Type n8n | Utilisée par | Paramètres clés |
|---|---|---|---|
| `Supabase ImmoMail (pooler session 5432)` | Postgres | **tous** | host `aws-0-<région>.pooler.supabase.com`, user `postgres.<ref-projet>`, port **5432**, SSL Allow |
| `SMTP ImmoMail` | SMTP | tous sauf A1 | serveur d'envoi réel (Brevo, OVH…) |
| `Boite leads IMAP (portails)` | IMAP | A9-A10-A11 | la boîte qui reçoit les leads des portails |
| `Anthropic API (header x-api-key)` | Header Auth | A9 | Name = `x-api-key`, Value = `sk-ant-…` |
| `SMS Provider (Brevo / Twilio)` | Header Auth | A2, A7, A8 | clé API du provider SMS |

### 2.2 Les 6 variables d'environnement

Toutes ont un **fallback intégré** : sans configuration, les workflows tournent
avec des valeurs de démo.

| Variable | Défaut intégré | Consommée par |
|---|---|---|
| `IMMOMAIL_FROM_EMAIL` | `agence@immomail.demo` | A2–A8 (expéditeur email) |
| `IMMOMAIL_AGENCY_NAME` | `Notre agence` | A7, A8 (signatures) |
| `IMMOMAIL_AGENCY_INBOX` | = FROM_EMAIL | A5 (alerte interne) |
| `IMMOMAIL_BASE_URL` | `https://immomail-studio.vercel.app` | A4 (PDF quittance) |
| `GOOGLE_REVIEW_LINK` | lien d'exemple | A7 (lien d'avis) |
| `SMS_API_URL` | endpoint Brevo SMS | A2, A7, A8 |

> A9 n'utilise **pas** ces variables : ses valeurs sont centralisées dans son
> nœud **« ⚙️ Config agence »** (voir fiche A9).

---

## 3. Fiches de référence par workflow

### A1 — Prise de RDV automatique (webhook)

**Rôle** : point d'entrée de la réservation publique type Calendly. Reçoit le
créneau choisi, crée le rendez-vous (statut `requested`) et journalise. C'est
ensuite **A2** qui confirme et rappelle.

**À paramétrer** :

| Élément | Où | Défaut |
|---|---|---|
| URL appelée par le site public | côté émetteur (site/app) | `POST https://<n8n>/webhook/immomail/booking` |
| Chemin du webhook | nœud *Webhook réservation* → Path | `immomail/booking` |
| Corps attendu | contrat d'interface (non modifiable sans adapter le SQL) | `{ agencyId, propertyId?, contactId?, contactName, contactEmail?, contactPhone?, type?, scheduledAt }` |

**IA** : aucune.

---

### A2 — Confirmation + rappels de visite

**Rôle** : toutes les 15 minutes, envoie la **confirmation** des nouveaux RDV,
le **rappel J-1** (SMS, passe le statut à `reminded`) et le **rappel H-2**.

**À paramétrer** :

| Élément | Où | Défaut |
|---|---|---|
| Fréquence du cron | nœud *Toutes les 15 min* | 15 minutes |
| Fenêtre J-1 | nœud *RDV : actions dues* (SQL : `interval '1 day'`) | 24 h avant |
| Fenêtre H-2 | même SQL : `interval '2 hours'` | 2 h avant |
| Textes des messages | nœud *Construire le message* (code JS) | FR, avec date/heure/lieu |
| Provider SMS | nœud *SMS* (URL + corps JSON) | format Brevo |

**IA** : aucune.

---

### A3 — Alerte expiration de mandat

**Rôle** : chaque matin, détecte les mandats actifs arrivant à échéance sous
30 jours et envoie la **relance de renouvellement** au propriétaire.

**À paramétrer** :

| Élément | Où | Défaut |
|---|---|---|
| Heure du cron | nœud *Chaque jour 8h* | 8h (heure de l'instance n8n) |
| Préavis | nœud *Mandats à J-30* (SQL : `interval '30 days'`) | 30 jours |
| Texte de la relance | nœud *Rédiger la relance* | proposition de renouvellement |

**IA** : aucune.

---

### A4 — Quittances de loyer

**Rôle** : chaque jour, pour les baux dont le **jour d'échéance** est atteint
ce mois-ci, récupère la **vraie quittance PDF** auprès de l'application
(`/api/receipt/<bail>?period=YYYY-MM`) et l'envoie au locataire en pièce
jointe. Une seule quittance par bail et par mois.

**À paramétrer** :

| Élément | Où | Défaut |
|---|---|---|
| Heure du cron | nœud *Chaque jour 9h* | 9h |
| Jour d'échéance par bail | donnée métier : colonne `leases.rent_due_day` | 5 |
| URL de l'app (PDF) | variable `IMMOMAIL_BASE_URL` | l'app Vercel de démo |
| Texte de l'email | nœud *Préparer la quittance* | montant loyer + charges détaillé |

**IA** : aucune.

---

### A5 — Rappel diagnostics & échéances (conformité)

**Rôle** : chaque matin, repère les échéances `pending` (DPE, assurance PNO,
renouvellement de bail…) entrées dans leur fenêtre de rappel, passe le statut
à `reminded` et prévient l'agence **en interne**.

**À paramétrer** :

| Élément | Où | Défaut |
|---|---|---|
| Heure du cron | nœud *Chaque jour 8h* | 8h |
| Fenêtre de rappel **par échéance** | donnée métier : colonne `compliance_items.reminder_days_before` | 30 jours |
| Destinataire interne | variable `IMMOMAIL_AGENCY_INBOX` | = FROM_EMAIL |

**IA** : aucune.

---

### A6 — Newsletter acheteurs segmentée

**Rôle** : chaque lundi, croise les **biens disponibles publiés depuis 7 jours**
avec les **critères** de chaque contact opt-in (budget, type, zones, pièces —
JSON `buyer_criteria`) et envoie à chacun sa sélection personnalisée. Un envoi
par contact et par semaine ISO.

**À paramétrer** :

| Élément | Où | Défaut |
|---|---|---|
| Jour/heure du cron | nœud *Chaque lundi 9h* | lundi 9h |
| Fraîcheur des biens | nœud *Matching biens ↔ acheteurs* (SQL : `interval '7 days'`) | 7 jours |
| Critères par contact | données métier : `contacts.buyer_criteria` + opt-in `consent_marketing` | issus de l'import Excel |
| Texte de la newsletter | nœud *Composer la newsletter* | liste « • Titre — prix (réf) » |

**IA** : aucune (matching 100 % SQL/JSONB).

---

### A7 — Collecte d'avis Google

**Rôle** : à **J+2** d'une signature, demande un avis Google par email **et**
SMS ; à **J+5**, si aucun avis n'est marqué déposé, envoie **une** relance.

**À paramétrer** :

| Élément | Où | Défaut |
|---|---|---|
| Heure du cron | nœud *Chaque jour 10h* | 10h |
| Délai 1ʳᵉ demande | SQL : `interval '2 days'` | J+2 |
| Délai relance | SQL : `interval '5 days'` | J+5 |
| **Lien d'avis Google** | variable `GOOGLE_REVIEW_LINK` | lien d'exemple — **à remplacer impérativement** par le vrai lien G Business de l'agence |
| Textes email/SMS | nœud *Rédiger la demande d'avis* | ton chaleureux + lien |

**IA** : aucune.

---

### A8 — Demande de parrainage

**Rôle** : **30 jours** après une signature, propose au client de parrainer un
proche, par email + SMS. Le message s'adapte (« emménagé » pour une location,
« signé » pour une vente).

**À paramétrer** :

| Élément | Où | Défaut |
|---|---|---|
| Heure du cron | nœud *Chaque jour 11h* | 11h |
| Délai | SQL : `interval '1 month'` | J+30 |
| **Montant de la récompense** | textes du nœud *Rédiger le parrainage* (email **et** SMS) | bon de **200 €** |

**IA** : aucune.

---

### A9 · A10 · A11 — Intake & qualification des leads (le « wow »)

**Rôle** : à chaque email reçu dans la boîte commune :
1. **A9** — classification par **Claude** en 4 catégories : `lead`, `spam`,
   `documents` (pièces d'un dossier), `visit_followup` (suivi post-visite) ;
   pour un lead, **extraction structurée** : nom, email, téléphone, type de
   demande (achat/location/estimation), référence du bien, priorité ;
2. **A11** — création/mise à jour de la **fiche CRM** sans ressaisie (dédup
   par email), critères acheteur déduits du bien visé ;
3. **A9** — création du **lead numéroté** (`LD-501`, `LD-502`…), routé vers le
   négociateur du bien (ou l'accueil) ;
4. **A10** — **réponse instantanée 24/7** au prospect avec lien de réservation,
   horodatage de la première réponse.

**À paramétrer** :

| Élément | Où | Défaut |
|---|---|---|
| **`agency_id`** ⚠️ obligatoire | nœud **« ⚙️ Config agence »** | `REMPLACER-PAR-ID-AGENCE` (récupérer via `SELECT id, name FROM agencies;`) |
| `agency_name`, `from_email`, `base_url` | même nœud | valeurs de démo |
| Boîte surveillée | credential IMAP du nœud *Nouveaux emails (IMAP)* | — |
| **Modèle d'IA** | nœud *A9 · Préparer prompt Claude* (champ `model` du payload) | `claude-haiku-4-5-20251001` |
| Consigne de classification (prompt) | même nœud (constantes `system` + `user`) | 4 catégories + extraction JSON strict |
| Taille max de réponse | même nœud (`max_tokens`) | 400 |
| Numérotation des leads | SQL du nœud *Créer le lead + fiche CRM* | `LD-` + (501 + nombre de leads) |
| Multi-agences | dupliquer le workflow (1 boîte IMAP par agence) ou mapper adresse → `agency_id` | mono-agence |

---

### A6b — Newsletter à la demande (webhook)

**Rôle** : équivalent n8n du bouton « Envoyer la newsletter » de l'app — envoie
immédiatement à chaque contact éligible la sélection de biens d'un **segment**
donné, sans attendre le cron hebdomadaire d'A6. Chaque contact ne reçoit que les
biens compatibles avec **ses** critères personnels (budget max, type recherché).

**À paramétrer** :

| Élément | Où | Défaut |
|---|---|---|
| URL appelée | côté émetteur | `POST https://<n8n>/webhook/immomail/newsletter` |
| Corps attendu | contrat d'interface | `{ "segmentId": "…" }` (IDs : `SELECT id, name FROM newsletter_segments;`) |
| Signature des messages | variable `IMMOMAIL_AGENCY_NAME` | `Notre agence` |
| Critères du segment | donnée métier : `newsletter_segments.criteria` (JSON) | issus de l'import Excel |

> Pas d'idempotence volontairement (comme le bouton de l'app) : chaque appel envoie
> la sélection courante. Ne pas brancher ce webhook sur un déclencheur récurrent —
> c'est le rôle du cron A6.

**IA** : aucune.

---

### A7b — Avis déposé (webhook)

**Rôle** : équivalent n8n du bouton « Simuler : avis laissé » de l'app — marque
l'avis Google comme déposé pour une transaction, ce qui **stoppe la relance J+5**
du workflow A7. En production réelle, à appeler depuis l'outil qui détecte les
nouveaux avis (Google Business Profile API, Zapier, saisie manuelle…).

**À paramétrer** :

| Élément | Où | Défaut |
|---|---|---|
| URL appelée | côté émetteur | `POST https://<n8n>/webhook/immomail/review-done` |
| Corps attendu | contrat d'interface | `{ "transactionId": "…" }` |
| Réponse | — | `{ ok, transactionId, updated }` — `updated=false` si transaction inconnue ou déjà marquée |

**IA** : aucune.

---

## 4. Les outils d'IA utilisés

### Claude (Anthropic) — le seul composant IA des workflows

| Caractéristique | Détail |
|---|---|
| **Où** | Uniquement dans **A9** (workflow intake leads), nœud *A9 · Classifier (Claude)* |
| **Modèle** | `claude-haiku-4-5-20251001` (Claude Haiku 4.5) — choisi pour son rapport coût/latence : classification en < 2 s pour une fraction de centime par email |
| **API** | `POST https://api.anthropic.com/v1/messages`, authentification par header `x-api-key` (credential n8n *Header Auth*), header `anthropic-version` |
| **Tâche confiée** | Classification en 4 catégories + **extraction d'entités** (nom, email, téléphone, type de demande, référence de bien, priorité) en **JSON strict** |
| **Garde-fous** | Corps de l'email tronqué à 4 000 caractères ; `max_tokens: 400` ; parsing tolérant (extraction du bloc `{...}`) ; **fallback** : en cas de réponse illisible, l'email est classé `lead` par défaut (on préfère un faux lead à un vrai prospect perdu) |
| **Où modifier le modèle** | nœud *A9 · Préparer prompt Claude*, champ `model` — vérifier les modèles disponibles sur [docs.claude.com](https://docs.claude.com) |

**À savoir** :
- Dans l'**application de démo**, cette même classification est faite par un
  **classifieur heuristique** sans IA (`lib/services/inbox.service.ts`, règles
  par mots-clés). Le workflow n8n remplace ce mock par Claude pour la
  production réelle — c'est le seul endroit où la version n8n diffère
  fonctionnellement du moteur interne.
- Les 10 autres workflows n'utilisent **aucune IA** : leurs déclencheurs sont
  purement temporels (fenêtres SQL du type J-30, J+2, J+30) et leurs textes
  sont des gabarits fixes. C'est un choix délibéré : déterminisme, coût nul,
  auditabilité.

### Pistes d'extension IA (non implémentées)

Si vous souhaitez aller plus loin, les candidats naturels sont :
- **A10** — réponse instantanée *rédigée* par Claude (personnalisée selon
  l'email du prospect) au lieu du gabarit fixe ;
- **A6** — accroches de newsletter générées par bien/contact ;
- **A7** — détection automatique du dépôt d'avis (aujourd'hui marqué à la main
  via le bouton « Simuler : avis laissé » de l'app).

Chacune s'ajoute en insérant un nœud HTTP « Claude » sur le modèle de celui
d'A9 (même credential, même structure de payload).
