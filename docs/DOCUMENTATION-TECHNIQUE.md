# Documentation technique — Keo

> Anciennement « ImmoMail Studio ». Démo en ligne : https://keo.vercel.app
> Public : développeurs et profils techniques qui reprennent, maintiennent ou étendent le projet.
> Pour la documentation fonctionnelle des automatisations n8n, voir [`n8n-workflows/`](../n8n-workflows/README.md).

## Sommaire

1. [Vue d'ensemble & stack](#1-vue-densemble--stack)
2. [Arborescence du dépôt](#2-arborescence-du-dépôt)
3. [Architecture d'exécution](#3-architecture-dexécution)
4. [Base de données](#4-base-de-données)
5. [Horloge de démo](#5-horloge-de-démo)
6. [Moteur d'automatisations](#6-moteur-dautomatisations)
7. [Services](#7-services)
8. [Server Actions & routes API](#8-server-actions--routes-api)
9. [Sécurité](#9-sécurité)
10. [Import / Export Excel](#10-import--export-excel)
11. [Intégration n8n](#11-intégration-n8n)
12. [Qualité : CI, lint, tests](#12-qualité--ci-lint-tests)
13. [Déploiement & exploitation](#13-déploiement--exploitation)
14. [Développement local](#14-développement-local)
15. [Décisions notables & leçons](#15-décisions-notables--leçons)

---

## 1. Vue d'ensemble & stack

Keo est un SaaS de **démonstration** : il simule, pour des agences immobilières fictives,
11 automatisations métier (A1…A11) pilotées par une **horloge de démo** que le présentateur
avance à volonté. Chaque avancée d'horloge déclenche le moteur d'automatisations, qui produit
des artefacts visibles (emails, SMS, PDF de quittance, entrées de journal…).

| Couche | Choix | Détail |
|---|---|---|
| Framework | **Next.js 16** (App Router) | React Server Components + Server Actions, Turbopack |
| Langage | **TypeScript** strict | `npx tsc --noEmit` en CI |
| ORM | **Drizzle ORM** + driver `postgres` (postgres-js) | schéma dans `lib/db/schema.ts` |
| Base | **PostgreSQL** (Supabase en production, Postgres local en dev/CI) | 15 tables, RLS activée |
| UI | Tailwind CSS 4, lucide-react, composants maison (`components/ui.tsx`) | pas de lib de composants externe |
| PDF | `pdf-lib` | quittances de loyer (A4) |
| Excel | `exceljs` | import/export complet des données |
| Hébergement | **Vercel** (région `dub1`, colocalisée avec Supabase `eu-west-1`) | déploiement Git auto sur `main` |
| Automatisations externes | **n8n** (miroir des 11 automatisations) | générées par `n8n-workflows/build.mjs` |
| IA | Claude Haiku (`claude-haiku-4-5-20251001`) | uniquement dans le flux n8n A9 (tri des emails) ; l'app elle-même simule ce tri par règles (`inbox.service.ts`) |

## 2. Arborescence du dépôt

```
app/
  (app)/                    # Pages de l'application (layout commun avec sidebar)
    page.tsx                # Tableau de bord
    leads/ agenda/ locations/ mandats/ conformite/ marketing/
    journal/ messages/ automatisations/ import/ aide/ parametres/
  book/[propertyId]/        # Page PUBLIQUE de réservation de visite (A1/A10)
  api/
    health/route.ts         # Ping base + latence (cron keep-alive)
    import/route.ts         # Import du classeur Excel (POST multipart)
    receipt/[id]/route.ts   # PDF de quittance à la volée (A4)
    template/route.ts       # Export du classeur Excel de données
  actions.ts                # Toutes les Server Actions
  layout.tsx                # Métadonnées (OpenGraph dérivé de VERCEL_PROJECT_PRODUCTION_URL)
  error.tsx                 # Error boundary global (réveil Supabase, Réessayer)
  opengraph-image.tsx       # Image de partage 1200×630 générée (Satori)
components/
  app-shell/                # Sidebar, MobileNav, DemoClockBar, AgencySelector, nav-items
  ui.tsx                    # Card, Badge, Table, PageHeader, EmptyState…
  *.tsx                     # Formulaires client (Booking, Import, MenuSettings, Presenter…)
lib/
  db/client.ts              # Connexion postgres-js (⚠ max: 1 — voir §15)
  db/schema.ts              # Schéma Drizzle des 15 tables
  db/ddl.ts                 # CREATE TABLE IF NOT EXISTS + index + ENABLE RLS (auto au démarrage)
  automation-engine.ts      # LE moteur : 7 processeurs, idempotence, parallélisme
  demo-clock.ts             # Lecture/écriture de l'horloge (table demo_clock)
  page-context.ts           # Contexte commun des pages (agence + date courante)
  agency.ts                 # Agence sélectionnée (cookie)
  admin.ts                  # Mode présentateur (DEMO_ADMIN_PASSWORD)
  menu-settings.ts          # Menus actifs (cookie, validé côté serveur)
  queries.ts                # Requêtes de lecture (filtres SQL, GROUP BY)
  excel-io.ts               # Export/Import Excel transactionnel
  seed-data.ts              # Jeu de données de démo (2 agences)
  services/                 # email, sms, pdf, calendar, inbox (classification), review
  types.ts                  # Types métier + catalogue AUTOMATIONS (A1…A11)
scripts/
  seed.ts                   # npm run seed — (re)crée le schéma et charge seed-data
  ci-engine-test.ts         # Test d'intégration du moteur (voir §12)
n8n-workflows/              # Générateur + 11 workflows JSON + 5 docs + tests SQL
docs/                       # Cette doc + checklist PRD + portails HTML
.github/workflows/ci.yml    # Pipeline CI complet
vercel.json                 # Région dub1 + cron quotidien /api/health
eslint.config.mjs           # ESLint 9 flat config (presets natifs eslint-config-next)
```

## 3. Architecture d'exécution

- **Toutes les pages sont des React Server Components dynamiques** (`force-dynamic` via les
  données) : chaque affichage lit la base — il n'y a pas de cache applicatif, l'état de la
  démo doit toujours être frais.
- Les pages appellent `pageContext()` (`lib/page-context.ts`) qui renvoie `{ agency, current }` :
  l'agence sélectionnée (cookie) et la date de démo courante. Les requêtes de lecture sont
  centralisées dans `lib/queries.ts` et filtrent **côté SQL** (`WHERE agency_id = …`,
  `GROUP BY`, `LIMIT`).
- **Les mutations passent par les Server Actions** (`app/actions.ts`) — pas d'API REST interne
  pour l'UI. Les routes `app/api/*` n'existent que pour les usages non-UI : santé, fichiers
  binaires (PDF, Excel) et upload multipart.
- Le **layout `(app)`** monte la coquille (Sidebar/MobileNav selon les menus actifs du cookie
  `menu_keys`, DemoClockBar, AgencySelector). La page publique `/book/[propertyId]` est hors
  coquille : c'est la page « client final » de prise de rendez-vous.
- `ensureSchema()` (`lib/db/ddl.ts`) est appelé par les points d'entrée : il exécute des
  `CREATE TABLE IF NOT EXISTS`, les index et `ENABLE ROW LEVEL SECURITY` — un environnement
  vierge s'auto-provisionne au premier accès.

## 4. Base de données

15 tables (préfixe Drizzle `lib/db/schema.ts`), toutes portant `agency_id` sauf les tables
globales (`agencies`, `demo_clock`) :

| Table | Rôle | Points notables |
|---|---|---|
| `agencies` | Les 2 agences de démo | racine multi-tenant |
| `contacts` | Acheteurs, locataires, propriétaires, prospects | `role`, critères acheteur en JSONB |
| `properties` | Biens (vente/location) | statut, prix, surface |
| `mandates` | Mandats de vente | expiration → A3 |
| `appointments` | Rendez-vous visite/estimation | `(property_id, scheduled_at)` indexé — créneaux |
| `leases` | Baux | loyers → quittances A4 |
| `compliance_items` | DPE, assurance PNO, renouvellement bail | échéances → A5 |
| `transactions` | Ventes/locations conclues | `review_completed_at` → A7/A7b |
| `newsletter_segments` | Segments marketing | critères JSONB → A6/A6b |
| `inbox_emails` | Emails entrants bruts | source portail, classification → A9 |
| `leads` | Leads qualifiés extraits | numérotation par agence, statut, priorité → A10/A11 |
| `messages` | **Boîte d'envoi** : tout email/SMS « envoyé » | aperçu fidèle, `(agency_id, automation_type)` indexé |
| `activity_log` | **Journal** : une ligne par action d'automatisation | idem index composite |
| `automation_runs` | **Clés d'idempotence** (`run_key` unique) | cœur du « rejouable sans doublons » |
| `demo_clock` | Date de démo (courante + initiale) | une seule ligne |

Conventions :
- IDs `text` (UUID générés applicativement) ; dates en `timestamp` ISO sans timezone
  (l'horloge de démo est un temps simulé, pas un temps réel).
- **RLS activée sur les 15 tables, sans policy** : l'API Data publique de Supabase (PostgREST,
  clé `anon`) est totalement bloquée ; l'application n'est pas affectée car elle se connecte
  en rôle `postgres` (propriétaire, bypass RLS). Voir §9.
- Index : `agency_id` partout + composites `messages(agency_id, automation_type)`,
  `activity_log(agency_id, automation_type)`, `appointments(property_id, scheduled_at)`.

## 5. Horloge de démo

- Table `demo_clock` (une ligne) : `current` et `initial`. Lecture via `getClock()`
  (mémoïsée par requête avec `cache()` de React), écriture via `setClock()`.
- **L'horloge est globale** : partagée par tous les visiteurs de la démo (l'état des données
  l'est aussi). C'est documenté dans la page Aide, et c'est la raison du mode présentateur.
- Elle n'avance jamais en arrière depuis l'UI (`input type=date` avec `min` = aujourd'hui de
  démo). `resetDemo()` restaure données + horloge initiale via le seed.

## 6. Moteur d'automatisations

`lib/automation-engine.ts` — `runEngine(upto, agencyId?)` évalue tout ce qui est « échu »
à la date `upto` et renvoie `EngineResult { events: EngineEvent[] }` (affiché dans la popup
de la DemoClockBar et journalisé).

**Les 7 processeurs** (chacun couvre une ou plusieurs automatisations) :

| Processeur | Automatisations | Déclencheur |
|---|---|---|
| `processLeads` | A9 tri email, A10 réponse instantanée, A11 fiche CRM | emails entrants non traités à date |
| `processAppointments` | A2 confirmation + rappels J-1/H-2 | rendez-vous à venir |
| `processMandates` | A3 alerte expiration mandat | mandats expirant sous 30 j |
| `processReceipts` | A4 quittance PDF | baux actifs au 1er du mois |
| `processCompliance` | A5 rappels conformité | échéances DPE/PNO/bail |
| `processReviews` | A7 demande d'avis + relance J+7 | transactions conclues sans avis |
| `processReferrals` | A8 parrainage | transactions conclues (J+14) |

(A1 prise de RDV et A6 newsletter sont déclenchées par action utilisateur —
`bookAppointment` / `sendNewsletter` — pas par l'horloge.)

**Les trois propriétés clés du moteur :**

1. **Idempotence** — chaque action potentielle a une `run_key` déterministe
   (ex. `A4:<leaseId>:2026-07`). `claim()` tente un `INSERT … ON CONFLICT DO NOTHING`
   dans `automation_runs` : si la clé existe, l'action a déjà eu lieu → on saute.
   Rejouer « Évaluer » à la même date ne produit **rien** (testé en CI).
2. **Préchargement** — par agence, le moteur charge en une passe les biens, contacts et
   **toutes les run_keys existantes** (`Set<string>` passé à `claim()`), ce qui rend la
   ré-évaluation à vide quasi gratuite (~31 requêtes au lieu de ~370 avant optimisation).
3. **Parallélisme** — `Promise.all` sur les agences, puis sur les 7 processeurs, puis sur
   les paires email+SMS (A2/A7/A8). Temps mesuré : 656 → 411 ms sur le seed complet.

## 7. Services

`lib/services/` — briques utilisées par le moteur et les actions :

- `_shared.ts` : `recordMessage()` (écrit dans la boîte d'envoi) et `recordActivity()`
  (écrit dans le journal) — **tout artefact visible passe par là**.
- `email.service.ts` / `sms.service.ts` : « envoi » simulé = enregistrement du message
  (aucun email/SMS réel ne part de l'app ; l'envoi réel est le rôle des flux n8n).
- `calendar.service.ts` : `listSlots()` génère les créneaux de visite disponibles,
  `isSlotTaken()` protège contre la double réservation, `createEvent()` crée le RDV.
- `inbox.service.ts` : `classifyEmail()` — classification **par règles** (regex mots-clés,
  détection spam, extraction budget/type) qui simule ce que fait Claude Haiku dans le flux
  n8n A9. Déterministe pour la démo et les tests.
- `pdf.service.ts` : `generateReceipt()` — quittance PDF (pdf-lib), servie par
  `/api/receipt/[id]?period=YYYY-MM`.
- `review.service.ts` : gabarits des messages d'avis Google (A7).

## 8. Server Actions & routes API

**Server Actions** (`app/actions.ts`) — S = protégée par le mode présentateur :

| Action | Rôle |
|---|---|
| `setAgency(id)` | change l'agence courante (cookie) |
| `saveMenuKeys(keys)` | menus actifs (cookie, validés + clés verrouillées réimposées serveur) |
| `getPresenterStatus()` / `unlockPresenter(pwd)` / `lockPresenter()` | gestion du mode présentateur |
| `advanceClock(kind)` **S** / `setClockDate(str)` **S** | avance l'horloge puis `runEngine` |
| `evaluateNow()` | ré-évalue à la date courante — **volontairement ouverte** (inoffensive car idempotente) |
| `resetDemo()` **S** | reseed complet |
| `bookAppointment(input)` | réservation publique (A1) : contrôle de créneau, création RDV + confirmation |
| `sendNewsletter(segmentId)` | envoi newsletter du segment (A6) |
| `markReviewDone(transactionId)` | « avis déposé » — stoppe la relance A7 |

Les actions protégées renvoient `{ denied: true }` si le mode présentateur est verrouillé ;
l'UI ouvre alors la boîte de dialogue « Action verrouillée ».

**Routes API :**

| Route | Méthode | Rôle |
|---|---|---|
| `/api/health` | GET | `SELECT 1` + latence ; 503 si base injoignable. Cible du cron quotidien |
| `/api/import` | POST | Import Excel (multipart). 401 si présentateur verrouillé, 400 format, **413 > 5 Mo** |
| `/api/template` | GET | Export Excel complet (`keo-donnees.xlsx`) |
| `/api/receipt/[id]` | GET | PDF de quittance (`?period=YYYY-MM`) |

## 9. Sécurité

Modèle « démo publique » : tout est lisible, seules les actions destructrices sont protégées.

1. **RLS sans policy sur les 15 tables** — bloque intégralement l'API Data Supabase
   (`anon`/`authenticated`) tandis que l'app (rôle `postgres`, propriétaire) est intacte.
   Appliquée en production (migration `enable_rls_immomail_tables`) **et** dans `ddl.ts`
   pour tout nouvel environnement. Linter sécurité Supabase : 0 erreur.
2. **Mode présentateur** (`lib/admin.ts`) — activé en définissant `DEMO_ADMIN_PASSWORD`
   sur Vercel (non défini = démo entièrement ouverte, zéro changement de comportement) :
   - jeton = SHA-256 du mot de passe, stocké en cookie `httpOnly` `presenter_token` ;
   - comparaison en **temps constant** (`crypto.timingSafeEqual`) ;
   - protège : horloge (avance/date), reset, import. `evaluateNow` reste ouverte (idempotente).
3. **Bornes d'entrée** : import limité à `.xlsx`, 5 Mo max (413), erreurs JSON propres ;
   `saveMenuKeys` filtre les clés inconnues et réimpose les clés verrouillées.
4. **Aucun secret dans le dépôt** — voir le tableau des variables d'environnement (§13).

## 10. Import / Export Excel

`lib/excel-io.ts` — le classeur Excel est l'interface d'administration des données :

- **Export** (`/api/template`) : un onglet par table métier, avec les données courantes.
- **Import** (`/api/import`) : lit le classeur puis **remplace intégralement** les données.
  La séquence `DELETE FROM <table>` × N puis insertions s'exécute dans **une seule
  transaction Drizzle** (`db.transaction`) : un fichier corrompu ou une erreur en cours de
  route laisse la base **exactement dans l'état antérieur** (vérifié par test manuel :
  corruption au milieu du fichier → aucune perte).
- Cas d'usage démo : exporter, modifier des noms/biens dans Excel, réimporter → la démo
  est personnalisée pour un prospect en quelques minutes.

## 11. Intégration n8n

Le dossier [`n8n-workflows/`](../n8n-workflows/) contient le **miroir n8n** des 11
automatisations, pour montrer la version « production réelle » (vrais emails/SMS, vraie IA) :

- `build.mjs` **génère** les 11 JSON — ne jamais éditer les JSON à la main.
  Point critique du générateur : `sqlSafe()` réécrit chaque interpolation
  `{{ JSON.stringify(x) }}` en échappement SQL à quotes **simples**
  (`'…'` + doublage des `'`), car les doubles quotes sont des identifiants en PostgreSQL —
  bug qui cassait 100 % des requêtes avant correction (144 interpolations).
- `push.mjs` dépose les workflows sur une instance n8n (préfixe « Keo · », désactivés).
- `tests/test-a1.mjs` et `tests/test-webhooks.mjs` : tests unitaires **du SQL généré** —
  rendu des expressions `{{ }}`, exécution en transaction `ROLLBACK` sur la base seedée,
  y compris tests d'injection. Exécutés en CI.
- Identifiants **stables volontairement** (ne pas renommer sans migration coordonnée) :
  chemins webhook `/webhook/immomail/{booking,newsletter,review-done}`, variables d'env
  `IMMOMAIL_*`, ids de credentials `immomail-*`.
- Docs : `GUIDE-DEBUTANT.md` (entrée en matière), `GUIDE-ACTIVATION.md` (pas-à-pas),
  `REFERENCE-AUTOMATISATIONS.md` (référence + matrice de couverture app ↔ n8n),
  `DOCUMENTATION.md`, `README.md`.

## 12. Qualité : CI, lint, tests

`.github/workflows/ci.yml` — sur chaque PR et push `main`, avec un service **postgres:16** :

```
npm ci
→ shim server-only            # exécuter le moteur hors Next (tsx)
→ npx tsc --noEmit            # typage
→ npm run lint                # ESLint 9 (flat config, presets natifs eslint-config-next)
→ npm run build               # build Next production
→ npm run seed                # base éphémère
→ npx tsx scripts/ci-engine-test.ts   # intégration moteur
→ npm run seed                # re-seed
→ node n8n-workflows/tests/test-a1.mjs
→ node n8n-workflows/tests/test-webhooks.mjs
```

`scripts/ci-engine-test.ts` vérifie notamment :
- run 1 : toutes les familles d'automatisations se déclenchent (A2, A3, A4, A5, A7, A8, A9, A10, A11) ;
- run 2 (plus tard) : seules les relances différées (A7) apparaissent ;
- run 3 (même date) : **zéro événement** → idempotence prouvée ;
- pas de doublon de numérotation de leads par agence.

Le client base honore `DATABASE_SSL=disable` pour le conteneur CI sans SSL.

## 13. Déploiement & exploitation

- **Vercel**, projet lié au dépôt GitHub : chaque merge sur `main` déploie la production.
  Si un déclenchement est manqué (déjà vu : webhook raté), utiliser « Redeploy » dans le
  dashboard ou pousser un commit vide.
- `vercel.json` : `regions: ["dub1"]` (Dublin, en face de Supabase `eu-west-1` — voir §15)
  et cron `0 6 * * *` sur `/api/health` (keep-alive anti-pause Supabase Free ~7 jours).
- Les métadonnées du site utilisent `VERCEL_PROJECT_PRODUCTION_URL` : un renommage de
  projet (donc d'URL `*.vercel.app`) est suivi automatiquement au déploiement suivant.

**Variables d'environnement (Vercel → Settings → Environment Variables) :**

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | oui (Production) | Postgres — pooler Supabase **session, port 5432**, `postgres.<ref>` |
| `DEMO_ADMIN_PASSWORD` | non | définit le mot de passe présentateur ; absent = démo ouverte |
| `DATABASE_SSL` | non | `disable` uniquement pour un Postgres local/CI sans SSL |

⚠️ `DATABASE_URL` n'est définie qu'en Production : les préversions Vercel n'ont pas de base.

**Vérification post-déploiement** (systématique après un changement risqué) :
`/api/health` → 200 `{ok:true,db:true}`, puis la page d'accueil.

## 14. Développement local

```bash
# 1. PostgreSQL local (première fois)
service postgresql start
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
createdb -h 127.0.0.1 -U postgres immomail

# 2. Dépendances + données
npm ci
export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/immomail
export DATABASE_SSL=disable
npm run seed

# 3. Lancer
npm run dev          # ou : npm run build && PORT=3100 npm start

# 4. Vérifier
npm run lint && npx tsc --noEmit
node n8n-workflows/tests/test-a1.mjs        # nécessite la base seedée + psql
```

Piège connu : exécuter du code du moteur **hors de Next** (tsx, tests) demande un shim du
module `server-only` (voir l'étape correspondante dans `ci.yml`).

## 15. Décisions notables & leçons

| Décision / incident | Détail |
|---|---|
| **`max: 1` dans `lib/db/client.ts` — NE PAS AUGMENTER** | Le pooler session Supabase Free plafonne à 15 clients ; les instances Vercel gelées gardent leurs connexions. `max: 4` a causé une panne production (EMAXCONNSESSION). |
| **Région `dub1`** | L'app était en `iad1` (USA) avec la base en Irlande : ~100 ms/requête. Le bouton « Évaluer » est passé de plusieurs secondes à < 1 s en colocalisant. |
| **RLS sans policy plutôt que désactivation de l'API Data** | Réversible, ciblé, et `ddl.ts` le rejoue sur tout nouvel environnement. |
| **`evaluateNow` non protégée** | Choix assumé : idempotente et sans effet destructif, elle permet au visiteur de « jouer » sans risque. |
| **Horloge/état partagés entre visiteurs** | Un état par session n'aurait aucun sens tant que les données mutées sont globales ; documenté dans l'Aide, encadré par le mode présentateur. |
| **Classification IA simulée par règles dans l'app** | Déterministe (tests CI stables, zéro coût) ; la vraie IA (Claude Haiku) vit dans le flux n8n A9. |
| **Renommage de marque (Keo)** | Marque visible renommée ; identifiants techniques (`/webhook/immomail/*`, `IMMOMAIL_*`, credentials `immomail-*`) conservés pour ne pas casser les flux n8n déployés. |
| **Émoji dans l'image OpenGraph** | Satori ne rend pas les émojis : utiliser des SVG. |

Voir aussi [`docs/PRD-CHECKLIST-SAAS.md`](./PRD-CHECKLIST-SAAS.md) — la généralisation de
ces leçons en checklist pour les prochains SaaS.
