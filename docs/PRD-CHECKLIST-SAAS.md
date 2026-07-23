# Checklist PRD — Standards de construction d'un SaaS

> Points à **vérifier ou à ajouter** dans le PRD de chaque nouveau SaaS.
> Chaque point est issu d'une optimisation réellement appliquée (et souvent d'un
> incident réellement vécu) sur ImmoMail Studio. Copier les sections utiles dans
> le PRD du projet et cocher au fil de l'eau : chaque item a son **critère de
> vérification** (la « preuve » qu'il est fait).

---

## 1. Performance & architecture des données

- [ ] **Colocaliser l'hébergement et la base de données** (même région cloud).
  *Pourquoi :* app aux USA + base en Europe = ~100 ms par requête au lieu de 1-2 ms ;
  un écran qui fait 30 requêtes devient 30× plus lent.
  *Vérification :* la région du serveur (ex. `vercel.json` → `regions`) est celle de la base ;
  mesurer la latence d'une requête simple (< 5 ms).

- [ ] **Dimensionner le pool de connexions selon la plateforme serverless.**
  *Pourquoi :* chaque instance serverless garde ses connexions ouvertes ; avec un pooler
  limité (ex. Supabase Free : 15 clients en mode session), `max > 1` par instance sature
  le pooler → panne totale (vécu : EMAXCONNSESSION en production).
  *Vérification :* `max: 1` par instance serverless (ou pooler en mode transaction),
  `idle_timeout` court, et un commentaire dans le code expliquant la contrainte.

- [ ] **Filtrer et agréger côté SQL, pas côté application.**
  *Pourquoi :* rapatrier des tables entières pour les filtrer en JS multiplie les données
  transférées et le temps de réponse (vécu : ~370 → 31 requêtes sur un écran).
  *Vérification :* les listes utilisent WHERE/GROUP BY/LIMIT en SQL ; pas de `.filter()`
  applicatif sur des résultats non bornés.

- [ ] **Paralléliser les traitements indépendants** (`Promise.all` par entité, par sous-tâche).
  *Pourquoi :* un moteur qui traite séquentiellement paie la somme des latences
  (vécu : 656 → 411 ms en parallélisant par agence puis par processeur).
  *Vérification :* les boucles sur des unités indépendantes sont parallélisées ;
  temps de traitement mesuré avant/après.

- [ ] **Précharger en lot ce que la boucle va consulter** (éviter le N+1).
  *Vérification :* pas de requête à l'intérieur d'une boucle ; les données de référence
  sont chargées une fois puis consultées en mémoire (Map/Set).

- [ ] **Prévoir des index sur les clés de filtrage réelles** (dont index composites pour
  les couples fréquents, ex. `(tenant_id, type)`).
  *Vérification :* chaque WHERE fréquent a son index ; contrôle avec EXPLAIN sur les
  requêtes principales.

- [ ] **Rendre les traitements récurrents idempotents** (clé unique de type `run_key` +
  `INSERT … ON CONFLICT`), pour pouvoir relancer sans doublons.
  *Vérification :* test automatique « deux exécutions de suite → la seconde ne produit rien ».

## 2. Sécurité

- [ ] **Verrouiller l'accès direct à la base exposée par le BaaS** (Supabase/Firebase…) :
  activer RLS sur toutes les tables même si l'app passe par un backend.
  *Pourquoi :* URL projet + clé anonyme suffisent sinon à lire ET écrire toutes les tables
  (vécu : 15 tables exposées, linter Supabase à 15 erreurs).
  *Vérification :* linter sécurité du BaaS à 0 erreur ; un appel anonyme à l'API Data
  renvoie vide/refus.

- [ ] **Protéger les actions destructrices ou irréversibles** (reset, import écrasant,
  changements d'état globaux) par un rôle/mot de passe, même sur une démo publique.
  *Vérification :* sans déverrouillage, ces actions renvoient un refus propre (401/`denied`)
  et l'UI l'explique ; comparaison de secrets en temps constant (`timingSafeEqual`) ;
  jeton en cookie `httpOnly`.

- [ ] **Valider et borner toutes les entrées de fichiers/API** : type attendu, taille max
  (ex. 5 Mo → HTTP 413 avec message clair), erreurs propres.
  *Vérification :* tests manuels avec fichier trop gros / mauvais format / corrompu.

- [ ] **Aucun secret dans le code** ; variables d'environnement par environnement
  (production/préversion), et lister dans le PRD les variables à créer au déploiement.
  *Vérification :* recherche de secrets dans le dépôt vide ; tableau des env vars
  documenté (nom, rôle, où la définir).

## 3. Robustesse & disponibilité

- [ ] **Écran d'erreur applicatif convivial** (error boundary) avec bouton Réessayer,
  qui explique la cause probable (ex. réveil de la base en offre gratuite ~30 s).
  *Vérification :* couper la base en local → l'écran s'affiche → Réessayer fonctionne.

- [ ] **Endpoint de santé** (`/api/health` : ping base + latence, 503 si KO).
  *Vérification :* 200 quand tout va bien, 503 base coupée — les deux testés.

- [ ] **Contrer les mises en pause des offres gratuites** : cron quotidien qui appelle
  l'endpoint de santé (garde la base active, ex. auto-pause Supabase ~7 jours).
  *Vérification :* cron déclaré (ex. `vercel.json` → `crons`) et visible dans le
  dashboard après déploiement.

- [ ] **Toute écriture multi-tables est transactionnelle** (import/remplacement de données :
  tout ou rien).
  *Vérification :* test « fichier corrompu au milieu de l'import → base intacte ».

## 4. Qualité & industrialisation

- [ ] **CI dès le premier sprint** : typecheck + lint + build + tests sur base éphémère
  (service Postgres du runner), déclenchée sur chaque PR et sur main.
  *Vérification :* une PR avec erreur de type/lint/test est bloquée (CI rouge).

- [ ] **Lint configuré explicitement** (Next 16 : `next lint` n'existe plus — config
  ESLint flat dédiée) + script `npm run lint`.
  *Vérification :* `npm run lint` → 0 problème ; étape Lint présente dans la CI.

- [ ] **Au moins un test d'intégration métier** qui couvre le cœur du produit,
  dont le test d'idempotence (« rejouer ne crée pas de doublons »).
  *Vérification :* le test échoue si on casse volontairement la règle métier.

- [ ] **Politique de dépendances** : versions patch à jour, `npm audit` examiné à chaque
  passe qualité ; consigner les avis transitifs sans correctif non cassant au lieu de
  forcer des downgrades.
  *Vérification :* note dans la PR listant les avis restants et pourquoi ils sont acceptés.

- [ ] **Déploiement automatique branché sur la branche principale** (intégration Git),
  avec procédure de secours documentée si un déclenchement est manqué
  (redéploiement dashboard ou commit vide).
  *Vérification :* merger une PR déploie la production sans action manuelle.

- [ ] **Vérifier la production après chaque changement risqué** (santé + écran principal),
  pas seulement la CI.
  *Vérification :* check post-déploiement systématique (santé 200, page d'accueil OK).

## 5. UX & finitions

- [ ] **Jamais de `confirm()`/`alert()` natifs** : boîtes de dialogue maison, cohérentes
  avec le design, qui expliquent les conséquences, fermables par Échap/clic extérieur/Annuler.
  *Vérification :* recherche de `confirm(`/`alert(` dans le code → 0 résultat.

- [ ] **Toute action > 300 ms a un indicateur visible** : spinner sur le bouton,
  état désactivé pendant le traitement, `role="status"` pour l'accessibilité.
  *Vérification :* déclencher chaque action longue et constater le retour visuel.

- [ ] **Responsive réel, testé au viewport mobile** : les popups deviennent des
  bottom-sheets, bouton Fermer explicite, zone de contenu scrollable
  (`max-height` + `overflow-y`), `safe-area-inset` pour les encoches.
  *Vérification :* parcours complet en 390×844 (sans émulation `isMobile`, qui fausse
  les mesures) ; aucun contenu inatteignable.

- [ ] **Aide intégrée** : page guide expliquant chaque écran et le mode d'emploi de la démo,
  y compris les comportements surprenants (ex. état partagé entre visiteurs).
  *Vérification :* chaque entrée du menu a sa section d'aide.

- [ ] **Personnalisation simple quand le produit a plusieurs espaces** : menus activables
  par l'utilisateur (page Paramétrage), avec entrées verrouillées pour l'essentiel.
  *Vérification :* activer/désactiver un espace prend effet immédiatement.

## 6. Partage & référencement

- [ ] **Métadonnées OpenGraph/Twitter complètes** : `metadataBase`, titre, description,
  locale, et **image de partage 1200×630 générée** (`opengraph-image.tsx`).
  *Pourquoi :* un lien partagé dans WhatsApp/Slack/LinkedIn sans carte visuelle est
  nettement moins cliqué. Attention : le générateur d'images ne rend pas les émojis —
  utiliser des SVG.
  *Vérification :* balises `og:*`/`twitter:*` présentes dans le head ;
  `/opengraph-image` renvoie un PNG correct, inspecté visuellement.

## 7. Documentation & exploitation

- [ ] **Documentation des automatisations/intégrations à trois niveaux** :
  guide débutant (vocabulaire + tableau app ↔ automatisation), guide d'activation
  pas à pas, référence complète (rôle, paramètres, outils IA utilisés).
  *Vérification :* une personne qui découvre l'outil active une automatisation
  sans aide extérieure.

- [ ] **Matrice de couverture** fonctionnalités du produit ↔ automatisations/flux,
  avec les « N/A » explicites.
  *Vérification :* chaque fonctionnalité de l'app a une ligne dans la matrice.

- [ ] **Recette de lancement reproductible** (skill/script/README) : bootstrap base,
  seed, démarrage, pièges connus de l'environnement.
  *Vérification :* un environnement vierge exécute la recette et l'app tourne.

- [ ] **Un projet = une base** : ne pas faire cohabiter les tables de plusieurs produits
  dans le même projet BaaS (sécurité, quotas, lisibilité).
  *Vérification :* la base ne contient que les tables du produit.

---

## Leçons d'incidents à ne pas repayer

| Incident vécu | Règle générale |
|---|---|
| Panne prod EMAXCONNSESSION (pool saturé) | `max: 1` par instance serverless avec un pooler session limité |
| Bouton principal lent (~4 s) | App et base dans la même région dès le jour 1 |
| SQL cassé dans 100 % des flux n8n générés (guillemets doubles) | Tester unitairement le SQL généré, échapper avec des quotes simples (`''`) |
| Tables lisibles/modifiables par n'importe qui via l'API Data | RLS activé partout dès la création des tables |
| Déploiement manqué après merge (webhook raté) | Vérifier la prod après chaque merge ; procédure de redéploiement documentée |
| Import qui pouvait laisser la base à moitié vide | Écritures multi-tables toujours transactionnelles |
| Émoji invisible dans l'image OpenGraph | SVG plutôt qu'émojis dans les images générées |
