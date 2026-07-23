# ImmoMail Studio — SaaS de démonstration des automatisations pour agences immobilières

Vitrine fonctionnelle des **11 automatisations métier** (A1–A11) du PRD v2.0, avec **horloge de démo pilotable** pour déclencher en direct les automatisations différées (J-1, J+2, J+30…). Données 100 % fictives, **aucune API externe réelle** (SMS/email/avis simulés).

**🔗 Démo en ligne : https://immomail-studio.vercel.app**

> **Note d'interface (démo déployée).** Le menu est volontairement épuré par défaut : *Tableau de bord, Boîte de réception, Agenda & visites, Locations & quittances, Automatisations, Import / Export, Aide & guide, Paramétrage*. Les automatisations A3, A5, A6–A8 et leurs pages (Mandats, Conformité, Marketing, Journal, Boîte d'envoi) existent dans le code et peuvent être **activées à la demande depuis le menu Paramétrage** (réglage mémorisé par navigateur, via cookie). L'horloge de démo se pilote par un **sélecteur de date + bouton Évaluer** (les raccourcis +1 j/sem/mois ont été retirés), et les codes « Ax » ne sont plus affichés dans l'UI. Le guide intégré (**Aide & guide**) documente l'usage des espaces visibles.

## Stack

| Couche | Technologie |
|---|---|
| Frontend + Backend | **Next.js 16** (App Router, TypeScript, RSC + Server Actions) |
| UI | Tailwind CSS v4, icônes lucide-react, composants maison style shadcn |
| Base de données | **Drizzle ORM + PostgreSQL (Supabase, EU)** via `postgres` (postgres-js) |
| PDF | `pdf-lib` (vraies quittances de loyer) |
| Horloge / planif. | Moteur d'automatisations interne idempotent (pas de cron en démo) |
| Hébergement | **Vercel** (frontend + serverless) + **Supabase** (Postgres EU) |

## Démarrage rapide

```bash
npm install
cp .env.example .env.local   # puis renseigner DATABASE_URL (Supabase)
npm run seed                 # crée les tables + charge les données (3 agences)
npm run dev                  # http://localhost:3000
```

`DATABASE_URL` = connection string Supabase. Pour un usage serverless/local fiable
avec `postgres-js`, utiliser le **pooler en mode SESSION (port 5432)** :

```
postgresql://postgres.<ref>:<motdepasse>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

> ⚠️ Le pooler en mode *transaction* (port 6543) provoque des blocages avec
> `postgres-js` (récupération des types sur la 1ʳᵉ requête) — préférer le port **5432**.

## Import / Export Excel (données pilotables)

La démo est **entièrement pilotable par un fichier Excel** depuis la page **Import / Export** :

1. **Télécharger le modèle** (`GET /api/template`) — un classeur `.xlsx` pré-rempli avec les données actuelles, tous les onglets au bon format.
2. Modifier le fichier (biens, leads, RDV, mandats, baux, conformité, transactions, segments, paramètres).
3. **Ré-importer** (`POST /api/import`) — l'import **remplace toutes les données** ; l'affichage reflète alors directement le fichier.

Onglets reconnus : `Paramètres`, `Stock de biens`, `Boîte de réception`, `Leads qualifiés`,
`Rendez-vous`, `Suivi des visites`, `Mandats`, `Baux`, `Conformité`, `Transactions`,
`Segments newsletter`. Les onglets absents sont ignorés. Détail des colonnes et valeurs
acceptées dans la page **Aide → Fichier Excel source** (`/aide#excel`).

## Scénario de démo pas-à-pas

> Agence par défaut : **Agence Horizon Immobilier (Lyon)** — le scénario complet, fidèle au classeur de données de test (REF-001…007, emails EM-1001…1008).
> Date de démo initiale : **mardi 23 juin 2026, 14 h**.

### 1. Le « wow » — intake des leads (A9 · A10 · A11)
1. Ouvrir **Boîte de réception**. À gauche : **8 emails bruts** des portails (SeLoger, Leboncoin, Bien'ici, formulaire…), tous « Non traités ».
2. Cliquer **« Trier les 8 emails maintenant »**.
3. Résultat instantané, vue avant/après :
   - **5 leads qualifiés** (LD-501…505) routés vers le bon négociateur (Marie Dupont, Karim Benali, Sophie Martin) ;
   - le **spam écarté** (EM-1008) ;
   - les emails « suivi post-visite » (EM-1005) et « pièces de dossier » (EM-1006) reconnus et **non** transformés en leads ;
   - une **fiche CRM créée** sans ressaisie (A11) et une **réponse instantanée** horodatée (A10) pour chaque lead.

### 2. Visites & rappels (A1 · A2)
1. Dans le bandeau d'horloge (en haut à droite), **choisir une date ~1 semaine plus tard** puis cliquer **Évaluer**.
2. Un **toast** récapitule les automatisations déclenchées : confirmations, **rappels J-1 et H-2** par SMS pour chaque visite.
3. Démo de la **prise de RDV en ligne** : page **Agenda → « Ouvrir la page de réservation »** (ou `/book/<id>`), réserver un créneau → le RDV est créé et la **confirmation part automatiquement**.

### 3. Locations & quittances (A4)
- Choisir une **date du mois suivant** puis **Évaluer** → génération des **quittances de loyer PDF** (page **Locations & quittances**, PDF téléchargeable).
- Page **Mandats** : alertes d'expiration à 30 jours + relance propriétaire (A3).
- Page **Conformité** : DPE / PNO / bail avec code couleur (À venir / Imminent / Dépassé) et rappels (A5).

### 4. Marketing & fidélisation (A6 · A7 · A8)
- Page **Marketing** :
  - **A6** : bouton « Envoyer la newsletter » → emails segmentés aux acheteurs correspondants.
  - **A7** : demandes d'avis Google à J+2 + relance J+5 ; bouton **« Simuler : avis laissé »** pour stopper la relance.
  - **A8** : demandes de parrainage à J+30.

### 5. Les écrans de preuve
- **Journal d'activité** : la timeline horodatée (date de démo) de tout ce qui s'exécute, filtrable par automatisation.
- **Boîte d'envoi** : aperçu **fidèle** de chaque SMS/email/PDF tel que le recevrait le client.

### 6. Multi-agences & reset
- **Sélecteur d'agence** (en-tête) : basculer vers Azur Méditerranée / Capitale Paris → les données sont **isolées**.
- **Réinitialiser** : recharge l'état initial propre (ou `npm run seed`).

## Les 11 automatisations

| # | Automatisation | Déclencheur | Sortie visible |
|---|---|---|---|
| A1 | Prise de RDV automatique | Réservation sur `/book/[id]` | RDV dans l'agenda + créneau bloqué |
| A2 | Confirmation + rappels visites | Création RDV, J-1, H-2 | SMS/email (Boîte d'envoi) |
| A3 | Alerte expiration de mandat | `end_date` − 30 j | Widget + relance propriétaire |
| A4 | Quittances de loyer | Chaque mois au jour d'échéance | **PDF réel** + email |
| A5 | Rappel diagnostics & échéances | `due_date` − délai | Tableau conformité + rappel |
| A6 | Newsletter acheteurs segmentée | Manuel (bouton) | Email « nouveaux biens » |
| A7 | Collecte d'avis Google | Signature + 2 j (relance + 5 j) | Email/SMS + lien avis |
| A8 | Demande de parrainage | Signature + 30 j | Message de recommandation |
| A9 | Tri & qualification des leads | Email reçu | Email brut → fiche lead |
| A10 | Réponse instantanée | Lead créé (A9) | Accusé 24/7 horodaté |
| A11 | Création de fiche CRM | Lead qualifié (A9) | Contact pré-rempli |

## Architecture

```
lib/
  db/            schéma Drizzle (Postgres) + client postgres-js + DDL (CREATE TABLE auto)
  services/      Mock Service Layer (sms, email, calendar, pdf, review, inbox)
  automation-engine.ts   moteur idempotent (A1–A11) piloté par la date de démo
  demo-clock.ts  horloge de démo (global)
  seed-data.ts   jeu de données scénarisé
app/
  (app)/         dashboard + 9 pages métier (sélecteur agence + bandeau horloge)
  book/[id]/     page publique de réservation (A1)
  api/receipt/   génération PDF des quittances (A4)
  actions.ts     Server Actions (horloge, réservation, newsletter, avis, reset)
```

### Mock Service Layer & branchement réel
Toutes les intégrations passent par `lib/services/*`. Chaque « envoi » crée une entrée `messages` (aperçu) + `activity_log`. Pour passer en production, il suffit de **remplacer l'implémentation** de chaque service (Twilio, Brevo, Calendly, Google Business Profile, Gmail/M365) **sans toucher au reste**.

### Idempotence
Chaque action est protégée par la table `automation_runs` (`run_key` unique, ex. `reminder_j1:{appointment_id}`). Avancer/réévaluer l'horloge ne produit **jamais de doublon**.

## Déploiement (déjà en ligne : https://immomail-studio.vercel.app)

1. Créer un projet **Supabase** en région EU et récupérer la connection string du
   **pooler en mode session (port 5432)**.
2. Seeder la base : `DATABASE_URL="postgresql://...:5432/postgres" npm run seed`
   (crée les tables et charge les 3 agences).
3. Sur **Vercel** : `vercel link` puis ajouter la variable `DATABASE_URL`
   (`vercel env add DATABASE_URL production`) et déployer `vercel --prod`.

> Le mot de passe contenant des caractères spéciaux (`/ # ! ?`) doit être
> **encodé en pourcent** dans l'URL (`/`→`%2F`, `#`→`%23`, `!`→`%21`, `?`→`%3F`).

## Critères d'acceptation (§12 du PRD) — état

- [x] `npm install && npm run dev` lance l'app ; `npm run seed` charge les données
- [x] Le sélecteur d'agence isole les données (aucune fuite inter-agences)
- [x] L'horloge avance et déclenche les automatisations échues, **sans doublon** (idempotence vérifiée)
- [x] Les 11 automatisations produisent une sortie visible + une entrée de journal
- [x] A9 écarte le spam et route correctement ; A10 horodate la réponse ; A11 crée la fiche
- [x] A4 génère un **vrai PDF** téléchargeable
- [x] Aperçus SMS/email fidèles et personnalisés
- [x] Aucune dépendance à une API externe réelle (SMS/email/avis/PDF 100 % simulés)
- [x] Couche service isolée et documentée pour un futur branchement réel
- [x] README décrit le scénario de démo pas-à-pas

## Sécurité de la démo publique

- **Base Supabase** : la Row Level Security est activée sur toutes les tables
  (sans policy) — l'API Data de Supabase (clé anon) ne peut ni lire ni écrire ;
  seule l'application (connexion Postgres directe) accède aux données. Le DDL
  (`lib/db/ddl.ts`) applique ce réglage à tout nouvel environnement.
- **Mode présentateur** : définissez la variable d'environnement
  `DEMO_ADMIN_PASSWORD` (sur Vercel : Settings → Environment Variables →
  Production, puis redéployer) pour verrouiller les actions destructives —
  avancement de l'horloge, réinitialisation, import Excel. Les visiteurs
  peuvent alors naviguer et cliquer « Évaluer », mais seul le présentateur
  (déverrouillage dans **Paramétrage**, mémorisé 30 jours par navigateur)
  peut piloter la démo. Sans la variable, tout reste ouvert (mode historique).

## Hors périmètre V1 (rappel)
Authentification, envois réels, app mobile, connexion boîte mail réelle, CRM tiers réel, paiement en ligne. Architecture prête pour la V2 (voir Mock Service Layer).
