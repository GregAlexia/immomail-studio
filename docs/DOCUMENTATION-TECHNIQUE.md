# Documentation technique — Keo

> Anciennement « ImmoMail Studio ». En ligne : **https://keo.agenia.pro**
> (aussi `https://immomail-studio.vercel.app`).
> ⚠️ `keo.vercel.app` n'est **pas** ce projet — ce sous-domaine appartient à un tiers.
> Public : développeurs et profils techniques qui reprennent, maintiennent ou étendent le projet.
> Pour la documentation fonctionnelle des automatisations n8n, voir [`n8n-workflows/`](../n8n-workflows/README.md).

## Sommaire

1. [Vue d'ensemble & stack](#1-vue-densemble--stack)
2. [Arborescence du dépôt](#2-arborescence-du-dépôt)
3. [Architecture d'exécution](#3-architecture-dexécution)
4. [Base de données](#4-base-de-données)
5. [Espaces isolés & liens de commerciaux](#5-espaces-isolés--liens-de-commerciaux)
6. [Horloge de démo](#6-horloge-de-démo)
7. [Moteur d'automatisations](#7-moteur-dautomatisations)
8. [Services](#8-services)
9. [Server Actions & routes API](#9-server-actions--routes-api)
10. [Page de vente](#10-page-de-vente)
11. [Console d'administration](#11-console-dadministration)
12. [Sécurité](#12-sécurité)
13. [Import / Export Excel](#13-import--export-excel)
14. [Intégration n8n](#14-intégration-n8n)
15. [Qualité : CI, lint, tests](#15-qualité--ci-lint-tests)
16. [Déploiement & exploitation](#16-déploiement--exploitation)
17. [Développement local](#17-développement-local)
18. [Décisions notables & leçons](#18-décisions-notables--leçons)

---

## 1. Vue d'ensemble & stack

Keo est un SaaS de **démonstration** : il simule, pour des agences immobilières fictives,
11 automatisations métier (A1…A11) pilotées par une **horloge de démo** que le présentateur
avance à volonté. Chaque avancée d'horloge déclenche le moteur d'automatisations, qui produit
des artefacts visibles (emails, SMS, PDF de quittance, entrées de journal…).

Autour de cette démonstration, deux surfaces publiques s'y sont ajoutées : une **page de
vente** (`/presentation`, §10) et une **console du propriétaire** (`/admin`, §11). Et sous
elle, les **espaces isolés** (§5) : chaque commercial démontre sur son propre jeu de données,
avec sa propre horloge.

| Couche | Choix | Détail |
|---|---|---|
| Framework | **Next.js 16** (App Router) | React Server Components + Server Actions, Turbopack |
| Langage | **TypeScript** strict | `npx tsc --noEmit` en CI |
| ORM | **Drizzle ORM** + driver `postgres` (postgres-js) | schéma dans `lib/db/schema.ts` |
| Base | **PostgreSQL** (Supabase en production, Postgres local en dev/CI) | 19 tables, RLS activée |
| Routage en amont | **`proxy.ts`** (edge) | traduit les liens `/c/<nom>` en cookies. `middleware.ts` est **déprécié en Next 16** et renommé ainsi |
| Authentification | aucune sur la démo ; **OAuth Google** sur `/admin` | un seul compte autorisé, écrit à la main (§11) |
| UI | Tailwind CSS 4, lucide-react, composants maison (`components/ui.tsx`) | pas de lib de composants externe |
| PDF | `pdf-lib` | quittances de loyer (A4) |
| Excel | `exceljs` | import/export complet des données |
| Hébergement | **Vercel** (région `dub1`, colocalisée avec Supabase `eu-west-1`) | déploiement Git auto sur `main` |
| Automatisations externes | **n8n** (miroir des 11 automatisations) | générées par `n8n-workflows/build.mjs` |
| IA | Claude Haiku (`claude-haiku-4-5-20251001`) | uniquement dans le flux n8n A9 (tri des emails) ; l'app elle-même simule ce tri par règles (`inbox.service.ts`) |

## 2. Arborescence du dépôt

```
proxy.ts                    # EDGE — /c/<nom> → cookies + réécriture (ex-middleware.ts)
app/
  (app)/                    # Pages de l'application (layout commun avec sidebar)
    page.tsx                # Tableau de bord
    leads/ agenda/ locations/ mandats/ conformite/ marketing/
    journal/ messages/ automatisations/ import/ aide/ parametres/
  book/[propertyId]/        # Page PUBLIQUE de réservation de visite (A1/A10)
  presentation/             # PAGE DE VENTE publique (§10)
    page.tsx  vente.css     # système visuel AgenIA (préfixe `ag-`)
    actions.ts              # formulaire de rappel → table inscriptions
  admin/                    # CONSOLE DU PROPRIÉTAIRE (§11)
    connexion/page.tsx      # publique — bouton Google, état de configuration
    (prive)/                # groupe protégé par son layout (barrière de session)
      layout.tsx  page.tsx  tarifs/  comptes/
    actions.ts              # écritures, chacune gardée par exigerAdmin()
  api/
    health/route.ts         # Ping base + latence (cron keep-alive)
    import/route.ts         # Import du classeur Excel (POST multipart)
    receipt/[id]/route.ts   # PDF de quittance à la volée (A4)
    template/route.ts       # Export du classeur Excel de données
    vue/route.ts            # Journal d'audience maison (§11)
    admin/{connexion,retour,sortie}/route.ts   # Dialogue OAuth Google
  actions.ts                # Toutes les Server Actions de la démo
  layout.tsx                # Métadonnées (OpenGraph dérivé de VERCEL_PROJECT_PRODUCTION_URL)
  error.tsx                 # Error boundary global (réveil Supabase, Réessayer)
  opengraph-image.tsx       # Image de partage 1200×630 générée (Satori)
components/
  app-shell/                # Sidebar, MobileNav, DemoClockBar, AgencySelector, nav-items
  ui.tsx                    # Card, Badge, Table, PageHeader, EmptyState…
  ProspectTracker.tsx       # Événement Vercel Analytics `demo_ouverte`
  JournalAudience.tsx       # Signale chaque page ouverte à /api/vue
  *.tsx                     # Formulaires client (Booking, Import, MenuSettings, Presenter…)
lib/
  db/client.ts              # Connexion postgres-js (⚠ max: 1 — voir §18) + ensureSchema()
  db/schema.ts              # Schéma Drizzle des 19 tables
  db/ddl.ts                 # CREATE TABLE IF NOT EXISTS + index + ENABLE RLS (auto au démarrage)
  db/espaces.ts             # Espaces : réservation, listage, suppression bornée
  db/audience.ts            # Journal d'audience : écriture + agrégats
  db/offres.ts              # Offres : CRUD + calcul du prix affiché
  db/inscriptions.ts        # Demandes de rappel
  automation-engine.ts      # LE moteur : 7 processeurs, idempotence, parallélisme
  demo-clock.ts             # Lecture/écriture de l'horloge (UNE LIGNE PAR ESPACE)
  page-context.ts           # Contexte commun des pages (agence + date courante)
  agency.ts                 # Agence sélectionnée ET filtre d'espace — cœur de l'isolation
  espaces.ts                # Espace courant (cookie) — réservé au serveur
  demo-profil.ts            # Module PUR partagé par l'edge et le serveur (étiquettes, /c/)
  admin.ts                  # Mode présentateur (DEMO_ADMIN_PASSWORD)
  admin-session.ts          # Session de la console (cookie signé HMAC)
  admin-google.ts           # Dialogue OAuth Google
  geo.ts                    # Pays/région/ville depuis les en-têtes Vercel (jamais l'IP)
  menu-settings.ts          # Menus actifs (cookie, validé côté serveur)
  queries.ts                # Requêtes de lecture (filtres SQL, GROUP BY)
  excel-io.ts               # Export/Import Excel transactionnel, borné à l'espace
  seed-data.ts              # Jeu de données de démo (4 agences)
  services/                 # email, sms, pdf, calendar, inbox (classification), review
  types.ts                  # Types métier + catalogue AUTOMATIONS (A1…A11)
scripts/
  seed.ts                   # npm run seed — (re)crée le schéma et charge seed-data
  ci-engine-test.ts         # Test d'intégration du moteur (voir §15)
  verifier-profil.ts        # Étiquettes `?p=` et chemins `/c/<nom>`
  verifier-espaces.ts       # Isolation : horloge, réinitialisation, import/export
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
  `menu_keys`, DemoClockBar, AgencySelector). Trois familles de pages vivent **hors** de cette
  coquille : `/book/[propertyId]` (prise de rendez-vous côté client final), `/presentation`
  (page de vente, §10) et `/admin` (console, §11).
- **`proxy.ts` s'exécute en amont, sur l'edge** : il traduit `/c/<nom>` en cookies et réécrit
  vers l'accueil *sans changer l'URL affichée* (§5). Il n'a **aucun accès à Postgres** — d'où
  `lib/demo-profil.ts`, module volontairement pur (constantes et expressions régulières
  figées à la compilation), seul import partagé entre l'edge et le serveur.
- `ensureSchema()` (`lib/db/client.ts`) est appelé par les points d'entrée : il exécute des
  `CREATE TABLE IF NOT EXISTS`, les index et `ENABLE ROW LEVEL SECURITY` — un environnement
  vierge s'auto-provisionne au premier accès.

  > En production, il ne rejoue pas le DDL à chaque démarrage à froid : une **sonde d'une
  > ligne** tranche d'abord. **Cette sonde doit porter sur le dernier objet ajouté au DDL.**
  > Laissée sur un objet ancien, elle déclare à jour une base qui ignore le nouveau, et la
  > première requête tombe sur une table absente — c'est arrivé à l'arrivée des espaces.

## 4. Base de données

19 tables (schéma Drizzle `lib/db/schema.ts`). La **chaîne d'appartenance** commande tout :
une donnée métier pend d'une agence, une agence pend d'un espace. Quatre tables sortent de
cette chaîne — `workspaces`, `demo_clock`, et les trois tables du site (`audience_vues`,
`offres`, `inscriptions`), qui décrivent le site et non une démonstration.

| Table | Rôle | Points notables |
|---|---|---|
| `workspaces` | **Espaces isolés** (§5) | l'identifiant *est* l'étiquette du commercial |
| `agencies` | Les 4 agences de démo, par espace | `workspace_id` — c'est là que se joue l'isolation |
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
| `demo_clock` | Date de démo (courante + initiale) | **une ligne par espace**, pas une seule |
| `audience_vues` | Journal d'audience maison (§11) | pays/région/ville, **jamais l'IP** |
| `offres` | Offres commerciales publiées sur `/presentation` | prix en **centimes entiers** |
| `inscriptions` | Demandes de rappel de la page de vente | coordonnées réelles — voir §12 |

Conventions :
- IDs `text` (UUID générés applicativement) ; dates en `timestamp` ISO sans timezone
  (l'horloge de démo est un temps simulé, pas un temps réel).
- **RLS activée sur les 19 tables, sans policy** : l'API Data publique de Supabase (PostgREST,
  clé `anon`) est totalement bloquée ; l'application n'est pas affectée car elle se connecte
  en rôle `postgres` (propriétaire, bypass RLS). Voir §12.
- Index : `agency_id` partout + composites `messages(agency_id, automation_type)`,
  `activity_log(agency_id, automation_type)`, `appointments(property_id, scheduled_at)`,
  `agencies(workspace_id)`, et `audience_vues(vu_le DESC)` — le journal grossit à chaque page
  ouverte et se lit toujours par tranche de dates.
- **`TABLES_PAR_AGENCE` (`lib/db/ddl.ts`) est une liste à tenir à jour.** Toute nouvelle
  table portant un `agency_id` doit y figurer, sans quoi ses lignes survivraient à une
  réinitialisation d'espace, orphelines et invisibles. Les trois tables du site en sont
  délibérément absentes.

> ⚠️ **La base Supabase est partagée avec un autre projet.** Elle contient aussi des tables
> `p3d_*` qui n'appartiennent pas à Keo. Ne jamais raisonner en « toutes les tables du
> schéma `public` » pour une purge ou une migration : s'appuyer sur `TABLE_NAMES`.

## 5. Espaces isolés & liens de commerciaux

**Chaque commercial a son propre jeu de données.** Un espace = un jeu complet.

L'isolation ne coûte **aucune modification des requêtes métier**, et c'est tout son intérêt :
toute donnée pend d'une agence, toute agence d'un espace, et `lib/queries.ts` part toujours
d'un `agencyId` issu de `getAgencies()`. Restreindre cette seule fonction
(`lib/agency.ts`) à l'espace courant isole donc l'application entière.

**L'identifiant de l'espace *est* l'étiquette du commercial** : `/c/phil` sert l'espace
`phil`. Pas de table de correspondance. La démonstration n'ayant aucune authentification,
c'est le lien qui tient lieu d'identité ; un visiteur sans lien nominatif atterrit sur
l'espace partagé `demo`.

Trois conséquences, chacune couverte par `scripts/verifier-espaces.ts` :

- **une horloge par espace** — avancer la date ne la fait plus bouger chez les autres ;
- **« Réinitialiser » ne recharge que son espace** — l'action vidait auparavant *toutes* les
  tables, effaçant la démonstration d'un collègue en pleine présentation ;
- **l'import et l'export Excel sont bornés** au même espace.

L'espace est semé à la première ouverture du lien. `reserverEspace()` n'accorde la création
qu'à un seul appelant (`INSERT … ON CONFLICT DO NOTHING … RETURNING` rend un tableau vide aux
perdants) : deux onglets ouverts en même temps ne peuvent pas semer deux fois, sans verrou.

### Pourquoi un chemin `/c/<nom>` et non un paramètre `?c=`

Le plan Vercel Hobby ne donne accès qu'aux **pages vues**, pas aux propriétés des événements
personnalisés — `vercel.analytics_event.count` n'existe pas sur ce compte. Un `?c=phil` est
donc invisible dans les statistiques, alors qu'un **chemin** distinct est compté à part.

`proxy.ts` intercepte `/c/<nom>`, mémorise commercial et profil en cookies, puis **réécrit**
(et non redirige) vers l'accueil : l'URL affichée reste `/c/phil`, donc la page vue aussi.

Trois étiquettes, toutes facultatives et toutes contraintes à `^[a-z0-9-]{1,60}$` — elles
viennent de l'URL, donc du visiteur, et finissent à l'écran :

| Paramètre | Désigne | Effet |
|---|---|---|
| `?p=` | le profil de démonstration | ouvre la démo sur cette agence |
| `?c=` | le commercial | étiquette l'ouverture — préférer `/c/<nom>` |
| `?n=` | le nom à afficher | renomme l'agence **à l'écran**, sans rien écrire en base |

## 6. Horloge de démo

- Table `demo_clock` : `current` et `initial`. Lecture via `getClock()` (mémoïsée par requête
  avec `cache()` de React), écriture via `setClock()`.
- **Une ligne par espace**, l'identifiant étant celui de l'espace. L'horloge était globale
  jusqu'aux espaces isolés (§5) : elle s'appelait alors `global`, et le DDL la renomme en
  `demo` en conservant sa date.
- Elle n'avance jamais en arrière depuis l'UI (`input type=date` avec `min` = aujourd'hui de
  démo). `resetDemo()` restaure données + horloge initiale de **l'espace courant**.

## 7. Moteur d'automatisations

`lib/automation-engine.ts` — `runEngine(upto, portee)` évalue tout ce qui est « échu »
à la date `upto` et renvoie `EngineResult { events: EngineEvent[] }` (affiché dans la popup
de la DemoClockBar et journalisé).

La **portée** (`{ workspaceId }`) est obligatoire en pratique : sans elle, avancer l'horloge
déclencherait les automatisations de tous les commerciaux à la fois (§5).

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

## 8. Services

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

## 9. Server Actions & routes API

**Server Actions** (`app/actions.ts`) — S = protégée par le mode présentateur :

| Action | Rôle |
|---|---|
| `setAgency(id)` | change l'agence courante (cookie) — **et efface les cookies de profil et de nom**, sans quoi une autre agence hériterait du nom affiché par `?n=` |
| `saveMenuKeys(keys)` | menus actifs (cookie, validés + clés verrouillées réimposées serveur) |
| `getPresenterStatus()` / `unlockPresenter(pwd)` / `lockPresenter()` | gestion du mode présentateur |
| `advanceClock(kind)` **S** / `setClockDate(str)` **S** | avance l'horloge **de l'espace courant** puis `runEngine` |
| `evaluateNow()` | ré-évalue à la date courante — **volontairement ouverte** (inoffensive car idempotente) |
| `resetDemo()` **S** | reseed **de l'espace courant seulement** (§5) |
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
| `/api/vue` | POST | Journal d'audience. **Rend toujours 204**, même en échec (§11) |
| `/api/admin/connexion` | GET | Départ OAuth : pose l'anti-rejeu, redirige vers Google |
| `/api/admin/retour` | GET | Retour OAuth : vérifie, échange, ouvre la session |
| `/api/admin/sortie` | POST | Déconnexion. **POST seulement** — en GET, une balise `<img>` tierce suffirait à déconnecter |

**Autres Server Actions :**

| Action | Fichier | Rôle |
|---|---|---|
| `actionDemanderRappel` | `app/presentation/actions.ts` | formulaire de rappel → `inscriptions` |
| `actionCreerOffre` / `actionModifierOffre` / `actionSupprimerOffre` | `app/admin/actions.ts` | tarifs — chacune gardée par `exigerAdmin()` |

## 10. Page de vente

`/presentation` — la page commerciale, dans la langue visuelle des autres produits AgenIA :
préfixe CSS `ag-`, Archivo (titres) + Source Serif 4 (texte et italiques d'emphase), papier
crème `#f0efe8`. Le système vit dans `app/presentation/vente.css` ; il n'existe dans aucun
dépôt partagé et a été repris du CSS compilé de `margeo.agenia.pro`.

- **Rendu dynamique** (`force-dynamic`) : les tarifs se règlent depuis la console, la page
  doit refléter le dernier enregistrement et non l'état du jour du build.
- **Repli si la base tombe** : `offresOuRien()` avale l'erreur et rend une liste vide. Sans
  tarifs la page reste entièrement lisible — une page de vente ne doit pas renvoyer une
  erreur parce que Postgres a hoqueté. Vérifié sur une prévisualisation, qui n'a pas de base.
- **Bandeau de promotion** : affiché quand une réduction court, en annonçant la plus forte.
  Une réduction dont la date de fin est passée s'arrête d'elle-même (`reductionActive()`),
  sans intervention.
- **Prix affichés sans mention « HT »** : AgenIA relève de la franchise en base de TVA
  (article 293 B).
- **Formulaire de rappel** : écrit dans `inscriptions`, retient le commercial dont le lien a
  amené le visiteur, et porte un champ-piège hors écran (`position: absolute; left: -9999px`
  plutôt que `display: none` — un automate évite un champ masqué, mais remplit celui qu'il
  croit simplement décalé).

## 11. Console d'administration

`/admin` — trois écrans réservés au propriétaire : **fréquentation**, **tarifs**, **comptes**.

### Connexion

**OAuth 2.0 / OpenID Connect avec Google, écrit à la main** (`lib/admin-google.ts`) : un seul
fournisseur, un seul compte, aucune table d'utilisateurs, et le flux « code d'autorisation »
tient en deux requêtes. Une bibliothèque d'authentification apporterait sa configuration, ses
adaptateurs de base et son suivi de compatibilité Next pour un besoin qu'elle dépasse.

La signature du jeton d'identité n'est **pas** revérifiée, et c'est correct : il arrive par
une connexion TLS directe avec le point d'échange de Google — le cas qu'OpenID Connect
(§ 3.1.3.7) autorise explicitement. Restent contrôlés : émetteur, destinataire, expiration,
et `email_verified`.

La session est un **cookie signé en HMAC-SHA256** (`lib/admin-session.ts`), pas une table.
L'adresse autorisée est relue **à chaque vérification** : la retirer de la variable
d'environnement ferme immédiatement les sessions en cours.

> **Le layout protège l'affichage ; chaque Server Action se protège en plus** par
> `exigerAdmin()`. Une action est un point d'entrée HTTP à part entière, appelable par POST
> sans jamais passer par la page qui l'affiche.

La page de connexion vit **hors** du groupe `(prive)`, sans quoi elle se redirigerait vers
elle-même à l'infini.

### Journal d'audience

Vercel Web Analytics reste en place, mais **il ne se *lit* pas** : le plan Hobby n'expose
aucune API. D'où un journal maison — `components/JournalAudience.tsx` signale chaque page
ouverte à `/api/vue`, qui l'enregistre avec le pays, la région et la ville **posés par Vercel
sur la requête** (`x-vercel-ip-*`).

**L'adresse IP n'est ni lue ni conservée.** Vercel fait la résolution en amont et ne transmet
que le résultat : on obtient le lieu sans jamais manipuler la donnée personnelle qui a servi
à le déduire. Une ville ne désigne personne ; une IP imposerait mention d'information, base
légale et durée de conservation, pour un gain faible (les agences sortent souvent derrière
une IP partagée).

Deux garde-fous : le chemin enregistré est borné par une expression régulière stricte (sans
quoi un visiteur remplirait le journal de chemins forgés), et `/admin` n'est pas compté — la
console ne doit pas gonfler ses propres statistiques.

`usePathname()` rend l'URL **affichée** : `/c/phil` est donc enregistré tel quel, et non la
cible de la réécriture. C'est tout l'intérêt des liens par chemin.

### Tarifs

Prix, pourcentage de réduction, date de fin, arguments, rang, mise en avant, publication.
Prix stockés en **centimes entiers** — un prix en flottant finit par afficher 148,99 € là où
l'on a saisi 149 €. `aujourdhui()` calcule la date **à Paris** et non en UTC : entre minuit et
deux heures, l'UTC est encore la veille et une offre expirée resterait affichée.

## 12. Sécurité

Modèle « démo publique » : tout est lisible, seules les actions destructrices sont protégées.
La console `/admin`, elle, suit un modèle inverse — **fermée par défaut**.

1. **RLS sans policy sur les 19 tables** — bloque intégralement l'API Data Supabase
   (`anon`/`authenticated`) tandis que l'app (rôle `postgres`, propriétaire) est intacte.
   Appliquée en production (migration `enable_rls_immomail_tables`) **et** dans `ddl.ts`
   pour tout nouvel environnement. Linter sécurité Supabase : 0 erreur.
   Les `inscriptions` portent des coordonnées réelles : les laisser lisibles par la clé anon
   publique serait une fuite, pas une commodité.
2. **Mode présentateur** (`lib/admin.ts`) — activé en définissant `DEMO_ADMIN_PASSWORD`
   sur Vercel (non défini = démo entièrement ouverte, zéro changement de comportement) :
   - jeton = SHA-256 du mot de passe, stocké en cookie `httpOnly` `presenter_token` ;
   - comparaison en **temps constant** (`crypto.timingSafeEqual`) ;
   - protège : horloge (avance/date), reset, import. `evaluateNow` reste ouverte (idempotente).
3. **Console fermée par défaut** (`lib/admin-session.ts`, `lib/admin-google.ts`) — tant que
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` et `ADMIN_SESSION_SECRET` manquent, `/admin`
   n'ouvre pas. **Contrairement au mode présentateur, elle ne bascule jamais en accès libre
   en l'absence de configuration** : la différence est délibérée — le présentateur protège
   une démo publique, la console protège des données.
   - anti-rejeu du dialogue OAuth par cookie d'état comparé en temps constant ;
   - cookies `httpOnly`, `sameSite: lax` (`strict` casserait le retour depuis Google, qui est
     une navigation de premier niveau venue d'un autre site) ;
   - `exigerAdmin()` sur chaque écriture, en plus de la barrière du layout.
4. **Bornes d'entrée** : import limité à `.xlsx`, 5 Mo max (413), erreurs JSON propres ;
   `saveMenuKeys` filtre les clés inconnues et réimpose les clés verrouillées ; les étiquettes
   d'URL sont contraintes à `^[a-z0-9-]{1,60}$` (§5) ; le chemin journalisé est borné.
5. **Aucun secret dans le dépôt** — voir le tableau des variables d'environnement (§16).

## 13. Import / Export Excel

`lib/excel-io.ts` — le classeur Excel est l'interface d'administration des données :

- **Export** (`/api/template`) : un onglet par table métier, avec les données courantes.
- **Import** (`/api/import`) : lit le classeur puis **remplace intégralement** les données.
  La séquence `DELETE FROM <table>` × N puis insertions s'exécute dans **une seule
  transaction Drizzle** (`db.transaction`) : un fichier corrompu ou une erreur en cours de
  route laisse la base **exactement dans l'état antérieur** (vérifié par test manuel :
  corruption au milieu du fichier → aucune perte).
- **Les deux sont bornés à l'espace courant** (§5) : un commercial n'exporte et ne remplace
  que son propre jeu. Avant les espaces, un import écrasait les données de tout le monde.
- Cas d'usage démo : exporter, modifier des noms/biens dans Excel, réimporter → la démo
  est personnalisée pour un prospect en quelques minutes.

## 14. Intégration n8n

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

## 15. Qualité : CI, lint, tests

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

Deux scripts de vérification complètent la CI, exécutables à la main :
`npx tsx scripts/verifier-profil.ts` (étiquettes `?p=` et chemins `/c/<nom>`) et
`npx tsx scripts/verifier-espaces.ts` (isolation de l'horloge, de la réinitialisation et de
l'import/export).

> Piège : un module importé par un script `tsx` autonome ne peut pas contenir
> `import "server-only"` — Next l'aliase en interne, il n'est pas résoluble ailleurs. C'est
> la raison du découpage `lib/espaces.ts` (serveur) / `lib/db/espaces.ts` (sans `server-only`).

## 16. Déploiement & exploitation

- **Vercel**, projet lié au dépôt GitHub : chaque merge sur `main` déploie la production.
  Si un déclenchement est manqué (déjà vu : webhook raté), utiliser « Redeploy » dans le
  dashboard ou pousser un commit vide.
- `vercel.json` : `regions: ["dub1"]` (Dublin, en face de Supabase `eu-west-1` — voir §18)
  et cron `0 6 * * *` sur `/api/health` (keep-alive anti-pause Supabase Free ~7 jours).
- Les métadonnées du site utilisent `VERCEL_PROJECT_PRODUCTION_URL` : un renommage de
  projet (donc d'URL `*.vercel.app`) est suivi automatiquement au déploiement suivant.

**Variables d'environnement (Vercel → Settings → Environment Variables) :**

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | oui (Production) | Postgres — pooler Supabase **session, port 5432**, `postgres.<ref>` |
| `DEMO_ADMIN_PASSWORD` | non | définit le mot de passe présentateur ; absent = démo ouverte |
| `DATABASE_SSL` | non | `disable` uniquement pour un Postgres local/CI sans SSL |
| `GOOGLE_CLIENT_ID` | pour `/admin` | client OAuth « Application Web » de la console Google Cloud |
| `GOOGLE_CLIENT_SECRET` | pour `/admin` | idem |
| `ADMIN_SESSION_SECRET` | pour `/admin` | signature du cookie de session, 24 caractères min. Le changer déconnecte |
| `ADMIN_EMAIL` | non | seule adresse Google admise ; défaut `cojagregory@gmail.com` |

Les URI de redirection à déclarer côté Google, **une par domaine servi** — ils doivent
correspondre au caractère près, faute de quoi Google répond `redirect_uri_mismatch` sans
autre explication :

```
https://keo.agenia.pro/api/admin/retour
https://immomail-studio.vercel.app/api/admin/retour
http://localhost:3000/api/admin/retour
```

C'est pourquoi `origineDemandee()` calcule l'origine depuis les en-têtes transmis
(`x-forwarded-host` / `x-forwarded-proto`) et non depuis `request.url`, qui porte l'hôte
interne derrière le proxy de Vercel.

⚠️ **`DATABASE_URL` n'est définie que sur la cible Production : les prévisualisations Vercel
n'ont aucune base.** Tout ce qui lit ou écrit Postgres y est silencieusement inerte — une
route qui avale ses erreurs rend 204 sans rien enregistrer, et l'on croit à un bug de code.
Vérifier ces fonctionnalités **après fusion, en production**.

**Domaines.** `keo.agenia.pro` est un **CNAME vers `cname.vercel-dns.com`** dans la zone OVH
d'`agenia.pro` — la zone n'est pas gérée par Vercel. L'apex `agenia.pro` pointe ailleurs
(GitHub Pages) : ne pas y toucher.

**Vérification post-déploiement** (systématique après un changement risqué) :
`/api/health` → 200 `{ok:true,db:true}`, puis la page d'accueil.

## 17. Développement local

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

## 18. Décisions notables & leçons

| Décision / incident | Détail |
|---|---|
| **`max: 1` dans `lib/db/client.ts` — NE PAS AUGMENTER** | Le pooler session Supabase Free plafonne à 15 clients ; les instances Vercel gelées gardent leurs connexions. `max: 4` a causé une panne production (EMAXCONNSESSION). |
| **Région `dub1`** | L'app était en `iad1` (USA) avec la base en Irlande : ~100 ms/requête. Le bouton « Évaluer » est passé de plusieurs secondes à < 1 s en colocalisant. |
| **RLS sans policy plutôt que désactivation de l'API Data** | Réversible, ciblé, et `ddl.ts` le rejoue sur tout nouvel environnement. |
| **`evaluateNow` non protégée** | Choix assumé : idempotente et sans effet destructif, elle permet au visiteur de « jouer » sans risque. |
| **~~Horloge/état partagés entre visiteurs~~ → espaces isolés** | Le partage était assumé tant que la démo était unique. Il est devenu intenable dès que plusieurs commerciaux ont démarché en parallèle : « Réinitialiser » effaçait la démonstration d'un collègue **en pleine présentation**. Corrigé en restreignant la seule `getAgencies()` (§5), sans toucher à une requête métier. |
| **L'isolation passe par la chaîne d'appartenance, pas par RLS** | Le rôle applicatif est propriétaire des tables : il contourne RLS. Une policy n'aurait donc rien isolé. C'est `agencies.workspace_id` qui porte le cloisonnement. |
| **Chemin `/c/<nom>` plutôt que paramètre `?c=`** | Recommandation d'abord faite avec `?c=`, puis **rétractée** : `vercel metrics` ne liste pas `vercel.analytics_event.count` sur ce compte. Le plan Hobby ne donne que les pages vues — un paramètre est invisible, un chemin est compté. |
| **`track()` est un no-op silencieux si le script n'est pas chargé** | `<ProspectTracker />` monté avant `<Analytics />` : `window.va` absent, chaque événement perdu **sans la moindre erreur**. Symptôme : `POST /view → 200` mais aucun `POST /event`. Correctif : installer la file `window.vaq` documentée par Vercel. |
| **Journal d'audience maison** | Vercel Web Analytics ne se *lit* pas sur ce plan : aucune API. Sans journal propre, la console n'aurait rien à afficher. |
| **Géolocalisation sans IP** | Vercel résout en amont et transmet pays/région/ville. On obtient le lieu sans jamais conserver la donnée personnelle — pas de mention d'information ni de durée de conservation à tenir. |
| **Console fermée par défaut, à l'inverse du mode présentateur** | Le présentateur protège une démo publique : sans mot de passe, tout reste ouvert. La console protège des données : sans identifiants, elle n'ouvre pas. |
| **Sonde de fraîcheur du schéma** | `ensureSchema()` court-circuite le DDL en production. La sonde doit porter sur **le dernier objet ajouté** ; laissée en arrière, elle déclare à jour une base incomplète. |
| **`import "server-only"` casse les scripts `tsx`** | Ce n'est pas un vrai paquet npm : Next l'aliase en interne. D'où `lib/db/espaces.ts` sans `server-only`, importable par `npm run seed`. |
| **Identité d'une Server Action = hachage de build** | Après un déploiement, un onglet resté ouvert appelle une action qui n'existe plus : `Failed to find Server Action "…"`, 404. Rien n'est cassé côté base — `Ctrl+F5` suffit. |
| **Classification IA simulée par règles dans l'app** | Déterministe (tests CI stables, zéro coût) ; la vraie IA (Claude Haiku) vit dans le flux n8n A9. |
| **Renommage de marque (Keo)** | Marque visible renommée ; identifiants techniques (`/webhook/immomail/*`, `IMMOMAIL_*`, credentials `immomail-*`) conservés pour ne pas casser les flux n8n déployés. |
| **`keo.vercel.app` n'est pas ce projet** | Ce sous-domaine appartient à un tiers (« Keo.cl »). L'ancienne documentation le donnait comme URL de démonstration. |
| **Émoji dans l'image OpenGraph** | Satori ne rend pas les émojis : utiliser des SVG. |

Voir aussi [`docs/PRD-CHECKLIST-SAAS.md`](./PRD-CHECKLIST-SAAS.md) — la généralisation de
ces leçons en checklist pour les prochains SaaS.
