# Guide de configuration & d'activation — workflows n8n ImmoMail Studio

Ce guide est le **mode d'emploi opérationnel** : il part d'une instance n8n vierge et
aboutit aux 9 workflows actifs en production. Il complète :

- [README.md](README.md) — vue d'ensemble, tableau de correspondance, principes ;
- [DOCUMENTATION.md](DOCUMENTATION.md) — logique métier et rôle de chaque nœud.

**Parcours** : Prérequis → Credentials → Variables → Import → Réglages par workflow →
Tests à blanc → Activation → Vérification → Dépannage.

---

## 1. Prérequis

| Élément | Détail | Où l'obtenir |
|---|---|---|
| **Instance n8n** | v1.x, self-host (Docker/Hostinger/VPS) ou n8n Cloud | [n8n.io](https://n8n.io) — l'instance par défaut du projet est `https://n8n.srv843744.hstgr.cloud` |
| **Base Supabase seedée** | Le projet Postgres de l'app, tables créées (`npm run seed`) | Dashboard Supabase → Settings → Database |
| **Connection string pooler SESSION** | Port **5432** (pas 6543 — voir §9) | Supabase → Connect → Session pooler |
| **Compte SMTP** | Un vrai serveur d'envoi (Brevo, OVH, Gmail app-password…) | Chez votre fournisseur email |
| **Boîte IMAP dédiée aux leads** | La boîte qui reçoit les emails SeLoger/Leboncoin/Bien'ici/site | Créer un alias dédié, ex. `leads@mon-agence.fr` |
| **Clé API Anthropic** | Pour la classification des emails (A9) par Claude | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| **Compte SMS** (optionnel au départ) | Brevo, Twilio, OVH… | Chez le provider — les workflows tournent sans (le nœud SMS échouera, voir §5) |

> 💡 **Ordre conseillé** : vous pouvez démarrer avec seulement **Postgres + SMTP**
> (A2–A8 fonctionnent), puis ajouter IMAP + Anthropic (A9-A11) et le SMS en dernier.

---

## 2. Créer les 5 credentials

Dans n8n : **Credentials → Add credential**. Les noms doivent idéalement reprendre ceux
ci-dessous (les workflows importés y font référence ; sinon vous re-sélectionnerez à la
main sur chaque nœud rouge après import — voir §4).

### 2.1 `Supabase ImmoMail (pooler session 5432)` — type **Postgres**

| Champ n8n | Valeur |
|---|---|
| Host | `aws-0-eu-west-1.pooler.supabase.com` (adapter à votre région) |
| Database | `postgres` |
| User | `postgres.<ref-projet>` (le user du pooler, avec le point) |
| Password | mot de passe DB Supabase |
| Port | **5432** (session) — surtout pas 6543 |
| SSL | **Allow** (ou Require) |

Test : le bouton *Test connection* de n8n doit passer. Sinon voir §9.

### 2.2 `SMTP ImmoMail` — type **SMTP**

| Champ n8n | Valeur (exemple Brevo) |
|---|---|
| User | votre login SMTP |
| Password | clé SMTP |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| SSL/TLS | STARTTLS (587) ou SSL (465) |

### 2.3 `Boite leads IMAP (portails)` — type **IMAP**

| Champ n8n | Valeur (exemple) |
|---|---|
| User | `leads@mon-agence.fr` |
| Password | mot de passe (ou app-password si Gmail/Outlook) |
| Host | `imap.votre-fournisseur.fr` |
| Port | `993` |
| SSL/TLS | activé |

> Cette boîte doit être **celle où arrivent les leads des portails**. Utilisez une boîte
> dédiée : le workflow A9 traite **chaque** email entrant.

### 2.4 `Anthropic API (header x-api-key)` — type **Header Auth**

| Champ n8n | Valeur |
|---|---|
| Name | `x-api-key` |
| Value | `sk-ant-…` (votre clé) |

### 2.5 `SMS Provider (Brevo / Twilio)` — type **Header Auth**

| Champ n8n | Valeur (exemple Brevo) |
|---|---|
| Name | `api-key` |
| Value | clé API Brevo |

> Le nœud SMS est **générique** (POST JSON `{ sender, recipient, content }` vers
> `SMS_API_URL`). Le format par défaut correspond à l'API Brevo transactional SMS.
> Pour Twilio/OVH, adaptez l'URL **et** le corps JSON dans chaque nœud « SMS ».

---

## 3. Variables d'environnement

Les workflows lisent 6 variables via `$env.…`, **toutes avec un fallback intégré** :
sans configuration, ils tournent avec les valeurs de démo. À personnaliser pour la prod :

| Variable | Fallback intégré | Rôle |
|---|---|---|
| `IMMOMAIL_FROM_EMAIL` | `agence@immomail.demo` | Adresse expéditrice de tous les emails |
| `IMMOMAIL_AGENCY_NAME` | `Notre agence` | Signature des messages |
| `IMMOMAIL_AGENCY_INBOX` | valeur de `IMMOMAIL_FROM_EMAIL` | Destinataire des alertes internes (A5) |
| `IMMOMAIL_BASE_URL` | `https://immomail-studio.vercel.app` | Base des URLs : PDF quittance (A4), lien de réservation (A10) |
| `GOOGLE_REVIEW_LINK` | lien G exemple | Lien « laisser un avis » (A7) |
| `SMS_API_URL` | endpoint Brevo SMS | Endpoint du provider SMS (A2, A7, A8) |

**Comment les définir :**

- **Self-host Docker** : dans le `docker-compose.yml` / `docker run`, section `environment:` —
  puis redémarrer le conteneur. Ex. :
  ```yaml
  environment:
    - IMMOMAIL_FROM_EMAIL=contact@mon-agence.fr
    - IMMOMAIL_BASE_URL=https://immomail-studio.vercel.app
  ```
- **VPS / systemd** : dans le fichier d'environnement du service n8n.
- **n8n Cloud** : `$env` n'est **pas accessible** ; deux options :
  1. compter sur les fallbacks et éditer en dur les quelques nœuds concernés, ou
  2. ajouter un nœud **Set** en tête de workflow (comme le nœud « ⚙️ Config agence »
     déjà présent dans A9) et y centraliser vos valeurs.

---

## 4. Importer les 9 workflows

### Option A — import manuel (recommandé la première fois)

1. n8n → **Workflows → ⋯ → Import from File**.
2. Importer les 9 fichiers `A*.json`, un par un.
3. Ouvrir chaque workflow : les nœuds à credential apparaissent avec un **triangle rouge**
   si la credential n'a pas été retrouvée par nom → cliquer le nœud, sélectionner la bonne
   credential dans la liste déroulante. Nœuds concernés : Postgres (tous), Send Email
   (tous sauf A1), Email Trigger IMAP (A9), HTTP Request Claude (A9), HTTP Request SMS
   (A2, A7, A8).
4. **Save** chaque workflow (ne pas activer encore — voir §6).

### Option B — push par l'API

```bash
N8N_API_KEY=<clé API n8n>  N8N_BASE_URL=https://votre-n8n/api/v1  node n8n-workflows/push.mjs
```

(Clé API : n8n → Settings → n8n API → Create API key.)
Les workflows sont créés **désactivés**, préfixés `ImmoMail Studio · `, tagués. Il reste à
rattacher les credentials à la main (l'API publique ne le permet pas) : ouvrir chaque
workflow et corriger les nœuds rouges comme en option A, étape 3.

---

## 5. Réglages spécifiques par workflow

### A9-A10-A11 (intake leads) — obligatoire

1. Ouvrir le nœud **« ⚙️ Config agence »** (nœud *Set* en 2e position) et remplir :
   - `agency_id` : l'UUID de votre agence. Pour l'obtenir, dans Supabase → SQL Editor :
     ```sql
     SELECT id, name FROM agencies;
     ```
   - `agency_name`, `from_email`, `base_url` : vos valeurs.
2. Multi-agences : dupliquer le workflow par agence (une boîte IMAP par agence), ou
   remplacer le nœud Set par une table de correspondance « adresse de réception → agency_id ».

### A1 (webhook réservation) — brancher l'émetteur

- URL de production : `https://<votre-n8n>/webhook/immomail/booking`
- URL de test (bouton *Listen for test event*) : `https://<votre-n8n>/webhook-test/immomail/booking`
- Corps attendu (JSON) :
  ```json
  {
    "agencyId": "…", "propertyId": "…",
    "contactName": "Jean Test", "contactEmail": "jean@test.fr",
    "contactPhone": "+33612345678",
    "type": "visite", "scheduledAt": "2026-07-15T10:00:00"
  }
  ```
- ⚠️ L'app de démo ne poste **pas** vers ce webhook : sa page `/book/[id]` passe par une
  Server Action interne (`bookAppointment`). Pour basculer la prise de RDV sur n8n,
  faire pointer votre site public (ou modifier `app/actions.ts`) vers cette URL.

### A2, A7, A8 (nœuds SMS) — si vous n'avez pas encore de provider SMS

Deux choix en attendant :
- **Désactiver le nœud SMS** (clic droit → *Deactivate*) : le flux email continue de passer
  (les nœuds sont chaînés, un nœud désactivé laisse passer les items) ;
- ou le laisser : l'exécution partira en erreur sur ce nœud et **le marquage/journalisation
  en aval ne s'exécutera pas** → l'envoi email sera retenté au cron suivant. À éviter.

### A4 (quittances) — vérifier l'accès au PDF

Le nœud « Générer le PDF (app) » appelle `IMMOMAIL_BASE_URL + /api/receipt/<bail>?period=YYYY-MM`.
L'app déployée (Vercel) doit être accessible depuis l'instance n8n. Test rapide depuis
le serveur n8n :

```bash
curl -sI "https://immomail-studio.vercel.app/api/receipt/<un-id-de-bail>?period=2026-07" | head -1
```

---

## 6. Tests à blanc (avant activation)

**Ne rien activer encore.** Tester chaque workflow en exécution manuelle :

### 6.1 Workflows cron (A2 → A8)

1. Ouvrir le workflow → bouton **Execute workflow** (exécution manuelle : le Schedule
   Trigger est court-circuité, la suite s'exécute normalement).
2. Lire le panneau d'exécution : chaque nœud affiche ses items entrée/sortie.
   - 0 item après le nœud Postgres = rien de dû aujourd'hui → **normal**, pas un bug.
   - Pour forcer un cas de test : insérer une donnée qui « tombe » dans la fenêtre, ex.
     pour A3 un mandat expirant dans 10 jours :
     ```sql
     UPDATE mandates SET end_date = to_char(now() + interval '10 days', 'YYYY-MM-DD')
     WHERE id = '<un-mandat-actif>';
     ```
3. Vérifier le résultat en base :
   ```sql
   SELECT run_key, executed_at FROM automation_runs ORDER BY created_at DESC LIMIT 10;
   SELECT channel, to_address, subject, sent_at FROM messages ORDER BY created_at DESC LIMIT 10;
   SELECT automation_type, description FROM activity_log ORDER BY created_at DESC LIMIT 10;
   ```
4. **Re-exécuter le même workflow** : aucun nouvel envoi ne doit partir (idempotence —
   le `run_key` est déjà réservé). C'est le test le plus important.

### 6.2 A1 (webhook)

1. Ouvrir A1 → **Listen for test event** → envoyer le POST d'exemple (§5) avec `curl`
   sur l'URL **webhook-test**.
2. Vérifier la réponse `{ ok: true, appointmentId }` et la ligne créée dans `appointments`.
3. Enchaîner : exécuter A2 manuellement → la confirmation du RDV doit partir.

### 6.3 A9-A10-A11 (IMAP)

1. Ouvrir le workflow → **Execute workflow** (n8n attend un email) → envoyer un email de
   test à la boîte leads, par ex. un faux lead SeLoger :
   > Objet : `Contact au sujet de votre annonce REF-001`
   > Corps : `Bonjour, je suis intéressé par le T3 réf REF-001. Jean Test, 06 12 34 56 78, jean@test.fr`
2. Suivre l'exécution : classification Claude → switch `lead` → création lead + fiche CRM
   → réponse instantanée.
3. Vérifier dans l'app (page **Boîte de réception** / **Leads**) et en base (`leads`,
   `contacts`, `messages`).
4. Tester aussi un spam (« Gagnez un iPhone !! ») → sortie `spam`, simple journalisation.

---

## 6 bis. Tests unitaires (hors n8n)

n8n n'a pas de framework de tests unitaires : la bonne approche est d'**extraire la
logique testable** de chaque workflow et de la tester hors n8n. Pour ces workflows,
la logique est concentrée dans les **requêtes SQL templées** des nœuds Postgres.

Le harnais `tests/test-a1.mjs` illustre la méthode sur A1 :

1. il lit le JSON du workflow et en extrait le template SQL du nœud Postgres ;
2. il **émule le rendu des expressions n8n** (`{{ … }}` évaluées avec `$json` =
   le payload du webhook) sur des payloads fixtures ;
3. il exécute le SQL rendu dans une **transaction `ROLLBACK`** (aucune trace en base) ;
4. il vérifie le `RETURNING` et des cas limites : champs optionnels absents,
   apostrophe dans un nom, tentative d'injection SQL.

```bash
PGPASSWORD=postgres node n8n-workflows/tests/test-a1.mjs
```

> 🐛 Ce harnais a détecté (et permis de corriger) un bug réel du générateur : les
> valeurs étaient interpolées via `JSON.stringify`, qui produit des guillemets
> **doubles** — des identifiants pour PostgreSQL, pas des littéraux. Toutes les
> requêtes échouaient avec `column "…" does not exist`. `build.mjs` échappe
> désormais en apostrophes simples doublées (fonction `sqlSafe`).

Pour tester **la chaîne complète** (webhook → SQL → réponse), utilisez le test
d'intégration du §6.2 (URL `webhook-test` + `curl`) : les deux niveaux sont
complémentaires — le test unitaire couvre les cas limites du SQL rapidement,
le test d'intégration valide le câblage réel dans n8n.

---

## 7. Activation

Une fois les tests à blanc passés, activer via le **toggle « Active »** de chaque workflow,
dans cet ordre (du moins risqué au plus visible) :

| Ordre | Workflow | Effet à l'activation |
|---|---|---|
| 1 | A5 conformité | Emails **internes** uniquement — risque nul côté clients |
| 2 | A3 mandats | 1 email/propriétaire concerné/jour max |
| 3 | A2 confirmations + rappels | Cron 15 min — le plus fréquent |
| 4 | A4 quittances | 1 email + PDF par bail/mois |
| 5 | A1 webhook | L'URL `/webhook/...` (prod) devient permanente |
| 6 | A7 avis, puis A8 parrainage | Emails + SMS clients post-signature |
| 7 | A6 newsletter | Envoi groupé hebdo — activer en dernier |
| 8 | A9-A10-A11 intake | Répond automatiquement aux **vrais prospects** — activer quand tout le reste est validé |

**Points d'attention au moment d'activer :**

- **Rattrapage initial** : au premier passage des crons, tout l'historique « dû » et non
  encore réservé part d'un coup (ex. A7 sur d'anciennes transactions signées il y a > 2 jours).
  Pour l'éviter, pré-réserver les clés du passé avant activation, ex. pour A7 :
  ```sql
  INSERT INTO automation_runs (id, agency_id, automation_type, ref_id, run_key, executed_at, created_at)
  SELECT gen_random_uuid()::text, agency_id, 'A7', id, 'A7:review_req:' || id,
         now()::text, now()::text
  FROM transactions WHERE signed_date::date < now()::date - 30;
  ```
  (Même principe pour A8 avec `'A8:referral:' || id`.)
- **Webhook** : tant que A1 n'est pas actif, l'URL de prod répond 404 ; seule l'URL de
  test fonctionne (et uniquement pendant *Listen for test event*).
- **IMAP** : à l'activation, n8n traite les emails **non lus** de la boîte ; videz/marquez
  lus les anciens messages avant d'activer A9.

---

## 8. Vérifier que tout tourne

- **n8n → Executions** : filtrer par workflow ; chaque exécution doit être verte.
  Configurer *Settings → Log streaming / Error workflow* pour être alerté en cas d'échec.
- **Dans l'app** : pages **Journal d'activité** et **Boîte d'envoi** — n8n écrit dans les
  mêmes tables (`activity_log`, `messages`), l'UI reflète donc son activité en direct.
- **En base**, contrôle d'idempotence global :
  ```sql
  -- aucun doublon possible : cette requête doit toujours renvoyer 0 ligne
  SELECT run_key, count(*) FROM automation_runs GROUP BY run_key HAVING count(*) > 1;
  ```

### Cohabitation avec le moteur de démo

Le moteur interne (`lib/automation-engine.ts`, bouton « Évaluer ») utilise **les mêmes
`run_key`** (sans préfixe `A2:`… pour certains ; vérifier au cas par cas) mais surtout la
**même table `automation_runs`** : si les deux tournent sur la même base, le premier à
réserver la clé gagne, l'autre ne double pas l'envoi. En production réelle, n'utilisez
plus le bouton « Évaluer » / l'horloge de démo — laissez n8n seul aux commandes.

---

## 9. Dépannage

| Symptôme | Cause probable | Correctif |
|---|---|---|
| Test connection Postgres **pend** ou timeout | Pooler Supabase en mode **transaction (port 6543)** | Repasser sur le pooler **session, port 5432** (voir README de l'app) |
| `password authentication failed` | User sans le suffixe projet | User = `postgres.<ref-projet>`, pas `postgres` |
| `SSL required` / erreur TLS | SSL désactivé dans la credential | SSL = Allow/Require |
| Le cron ne se déclenche jamais | Workflow non **activé** (toggle) ; ou fuseau | Activer ; vérifier Settings → *Timezone* de l'instance (les heures 8h/9h/10h/11h sont en heure de l'instance) |
| Webhook A1 → 404 | Workflow inactif, ou confusion test/prod | Activer le workflow ; URL prod = `/webhook/…`, test = `/webhook-test/…` |
| A9 : HTTP 401 sur le nœud Claude | Credential Header Auth mal remplie | Name **exactement** `x-api-key`, valeur `sk-ant-…` |
| A9 : HTTP 400 `model not found` | Modèle décommissionné | Mettre à jour le champ `model` dans « Préparer prompt Claude » (voir docs.claude.com) |
| A9 : rien ne se déclenche | Emails déjà lus ; mauvais dossier IMAP | Le trigger ne lit que les **non-lus** de INBOX ; envoyer un nouvel email de test |
| Emails partent en spam | SPF/DKIM absents sur le domaine expéditeur | Configurer SPF/DKIM chez votre fournisseur SMTP |
| SMS : HTTP 4xx | Provider ≠ Brevo (URL/format par défaut) | Adapter `SMS_API_URL` **et** le `jsonBody` des nœuds SMS au provider |
| Envois en double | Deux instances n8n actives sur la même base, ou modification manuelle d'`automation_runs` | Une seule instance active ; ne jamais purger `automation_runs` en prod |
| A4 : email sans PDF | `IMMOMAIL_BASE_URL` inaccessible depuis n8n | Tester le `curl` du §5 ; vérifier le déploiement Vercel |

---

## 10. Check-list finale

- [ ] 5 credentials créées et testées (Postgres 5432, SMTP, IMAP, Anthropic, SMS)
- [ ] Variables d'environnement définies (ou fallbacks assumés / nœud Set)
- [ ] 9 workflows importés, aucun nœud rouge
- [ ] `agency_id` renseigné dans « ⚙️ Config agence » (A9)
- [ ] Tests à blanc passés, **y compris le test d'idempotence** (2e exécution = 0 envoi)
- [ ] Clés du passé pré-réservées (A7/A8) si historique en base
- [ ] Boîte IMAP purgée des anciens non-lus
- [ ] Workflows activés dans l'ordre du §7
- [ ] Journal d'activité de l'app alimenté par n8n ✔
