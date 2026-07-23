# Guide débutant — comprendre et activer les automatisations n8n d'ImmoMail Studio

> **À qui s'adresse ce guide ?** À une personne qui n'a **jamais utilisé n8n**.
> Pas de jargon, pas de code : uniquement ce qu'il faut comprendre pour relier
> chaque automatisation à ce qu'elle produit dans l'application, l'activer, et
> vérifier qu'elle fonctionne.
>
> Parcours de lecture conseillé : **ce guide** → [GUIDE-ACTIVATION.md](GUIDE-ACTIVATION.md)
> (mise en service détaillée) → [REFERENCE-AUTOMATISATIONS.md](REFERENCE-AUTOMATISATIONS.md)
> (tout ce qui se règle) → [DOCUMENTATION.md](DOCUMENTATION.md) (fonctionnement interne).

---

## 1. n8n, c'est quoi ? (en 1 minute)

**n8n est un robot d'atelier** : vous lui donnez des recettes, il les exécute
tout seul, jour et nuit, sans que personne ne clique nulle part.

- Une recette s'appelle un **workflow** (« flux »). Exemple de recette :
  *« chaque jour à 9h, regarde quels loyers arrivent à échéance, génère la
  quittance PDF et envoie-la au locataire »*.
- Chaque étape de la recette est un **nœud** (une boîte sur l'écran) :
  *lire dans la base*, *composer le message*, *envoyer l'email*…
- Ce qui lance la recette s'appelle le **déclencheur** (la première boîte).
  Il en existe 3 sortes ici :

| Déclencheur | En clair | Exemple |
|---|---|---|
| ⏰ **Horaire** (cron) | « tous les jours à 8h », « toutes les 15 min » | rappels de visite, quittances |
| 📧 **Email reçu** (IMAP) | « dès qu'un email arrive dans la boîte » | tri des leads |
| 🔗 **Appel d'URL** (webhook) | « quand une application appelle cette adresse » | réservation en ligne, bouton newsletter |

**Le point clé** : l'application ImmoMail et n8n travaillent sur **la même base
de données**. Tout ce que n8n fait s'affiche donc immédiatement dans
l'application — dans le **Journal d'activité** (la trace) et la **Boîte
d'envoi** (les messages envoyés). L'application est la vitrine ; n8n est le
moteur qui tourne derrière.

---

## 2. Quel flux n8n fait quoi dans l'application ?

C'est LE tableau à garder sous la main : pour chaque chose que vous **voyez
dans l'application**, le workflow n8n qui la produit.

| Ce que vous voyez dans l'application | Qui le fait | Nom du workflow dans n8n | Quand ça se déclenche |
|---|---|---|---|
| **Agenda & visites** : un RDV apparaît quand un client réserve sur la page publique `/book` | A1 | `A1 · Prise de RDV automatique` | quand le site appelle son URL |
| **Agenda & visites** : badges « Confirmé », « Rappel J-1 », « Rappel H-2 » + SMS/emails dans la Boîte d'envoi | A2 | `A2 · Confirmation + rappels de visite` | vérification toutes les 15 min |
| **Mandats** : statut « À relancer » + email de renouvellement au propriétaire | A3 | `A3 · Alerte expiration de mandat` | chaque jour à 8h |
| **Locations & quittances** : la quittance PDF du mois + email au locataire | A4 | `A4 · Quittances de loyer automatiques` | chaque jour à 9h |
| **Conformité** : statut « Rappelé » sur un diagnostic + alerte interne | A5 | `A5 · Rappel diagnostics & échéances` | chaque jour à 8h |
| **Marketing** : les acheteurs reçoivent les nouveaux biens de la semaine | A6 | `A6 · Newsletter acheteurs segmentée` | chaque lundi à 9h |
| **Marketing** : le bouton **« Envoyer la newsletter »** d'un segment | A6b | `A6b · Newsletter à la demande (segment)` | quand on appelle son URL |
| **Marketing** : demande d'avis Google 2 jours après une signature, relance au 5ᵉ jour | A7 | `A7 · Collecte automatique d'avis Google` | chaque jour à 10h |
| **Marketing** : le bouton **« Simuler : avis laissé »** (arrête la relance) | A7b | `A7b · Avis déposé (stop relance)` | quand on appelle son URL |
| **Marketing** : proposition de parrainage 1 mois après la signature | A8 | `A8 · Demande de parrainage post-transaction` | chaque jour à 11h |
| **Boîte de réception** : emails triés, spam écarté, **leads créés**, fiche CRM remplie, **réponse automatique** envoyée au prospect | A9 · A10 · A11 | `A9·A10·A11 · Intake & qualification des leads` | dès qu'un email arrive |
| **Journal d'activité** et **Boîte d'envoi** | tous | — | alimentés par tous les workflows |

> 💡 Dans l'application de **démonstration**, c'est le bouton « Évaluer » et
> l'horloge de démo qui simulent tout cela. En production, l'horloge disparaît :
> ce sont ces workflows n8n qui font le travail, aux vraies dates.

---

## 3. Les 6 mots de vocabulaire n8n à connaître

| Mot | Traduction simple |
|---|---|
| **Workflow** | Une recette d'automatisation (une page avec des boîtes reliées entre elles). |
| **Nœud** (node) | Une étape de la recette. Un nœud **rouge** = il lui manque quelque chose (souvent un identifiant de connexion). |
| **Credential** | Un « trousseau de clés » enregistré une fois pour toutes : l'accès à la base de données, au serveur d'email… Les workflows y font référence sans jamais contenir de mot de passe. |
| **Active / Inactive** | L'interrupteur en haut à droite d'un workflow. **Inactive** = la recette existe mais ne tourne pas. **Active** = elle tourne toute seule. |
| **Executions** | L'historique : chaque fois qu'un workflow a tourné, une ligne apparaît ici (verte = succès, rouge = erreur). C'est le premier endroit où regarder. |
| **Webhook** | Une adresse web (URL) qui appartient au workflow : quand quelqu'un appelle cette adresse, la recette se lance. |

---

## 4. Activer une automatisation, pas à pas

La procédure est **la même pour les 11 workflows**. Exemple guidé — dans
n8n (`https://n8n.srv843744.hstgr.cloud`) :

1. **Ouvrir le workflow** : menu **Workflows** (barre latérale) → cliquer sur
   son nom, par ex. `A3 · Alerte expiration de mandat`. La recette s'affiche
   sous forme de boîtes reliées.

2. **Chercher les boîtes à triangle rouge** ⚠️. Un triangle rouge signifie
   « il me manque mon trousseau de clés » :
   - cliquer sur la boîte → en haut du panneau, champ **Credential** ;
   - ouvrir la liste déroulante → choisir la credential existante
     (ex. `Supabase ImmoMail (pooler session 5432)` pour les boîtes Postgres,
     `SMTP ImmoMail` pour les boîtes Email) ;
   - fermer le panneau. Le triangle disparaît.
   *(Les credentials se créent une seule fois — si elles n'existent pas encore,
   suivre le [GUIDE-ACTIVATION §2](GUIDE-ACTIVATION.md) qui donne chaque champ
   à remplir.)*

3. **Tester sans risque** : bouton **« Execute workflow »** en bas du canvas.
   Le workflow tourne UNE fois, sous vos yeux — chaque boîte affiche ce qu'elle
   a fait. S'il n'y a rien d'échu aujourd'hui, il ne se passe simplement rien :
   c'est normal, pas une panne.

4. **Activer** : interrupteur **Inactive → Active** en haut à droite
   (sauvegarder si demandé). C'est tout : à partir de maintenant, la recette
   tourne toute seule à son rythme (voir la colonne « Quand ça se déclenche »
   du tableau §2).

5. **Dans quel ordre activer ?** Du moins risqué au plus visible — l'ordre
   précis et les précautions (rattrapage d'historique, boîte email à purger)
   sont dans le [GUIDE-ACTIVATION §7](GUIDE-ACTIVATION.md). En résumé :
   d'abord les internes (A5, A3), puis visites et quittances (A2, A4), puis
   les webhooks (A1, A6b, A7b), puis le marketing client (A7, A8, A6), et en
   dernier le tri des emails (A9) — car lui répond à de **vrais prospects**.

### Cas particuliers (2 minutes de plus)

- **`A9·A10·A11` (tri des leads)** : avant d'activer, ouvrir la boîte
  **« ⚙️ Config agence »** et remplacer `REMPLACER-PAR-ID-AGENCE` par le vrai
  identifiant de votre agence (il se trouve dans Supabase → SQL Editor →
  `SELECT id, name FROM agencies;`).
- **Les 3 webhooks (`A1`, `A6b`, `A7b`)** : les activer ne déclenche rien —
  ils attendent qu'on appelle leur URL. Leurs adresses :
  - réservation : `https://<votre-n8n>/webhook/immomail/booking`
  - newsletter d'un segment : `https://<votre-n8n>/webhook/immomail/newsletter`
  - avis déposé : `https://<votre-n8n>/webhook/immomail/review-done`

---

## 5. Vérifier que ça fonctionne

Après activation, trois endroits à regarder :

1. **Dans n8n → Executions** (barre latérale) : chaque passage du workflow
   crée une ligne. **Verte** = tout s'est bien passé. **Rouge** = cliquer
   dessus pour voir quelle boîte a échoué et pourquoi.
2. **Dans l'application → Journal d'activité** : chaque action de n8n y écrit
   sa trace horodatée (« Quittance mars générée… », « Rappel J-1 envoyé… »).
   Si le journal se remplit, la chaîne complète fonctionne.
3. **Dans l'application → Boîte d'envoi** : le contenu exact de chaque email
   et SMS envoyé, tel que le client le reçoit.

> 💬 Règle d'or : **une exécution verte sans aucune ligne nouvelle dans le
> Journal n'est PAS une erreur** — cela veut dire « rien n'était dû
> aujourd'hui ». Les workflows ne renvoient jamais deux fois le même message
> (protection anti-doublon intégrée), donc relancer ne « rattrape » rien : il
> faut qu'une échéance réelle arrive.

---

## 6. Si ça ne marche pas (les 4 cas les plus courants)

| Symptôme | Cause la plus probable | Solution |
|---|---|---|
| Boîte avec triangle rouge | Credential non rattachée | §4 étape 2 ci-dessus |
| Appel d'un webhook → erreur 404 « not registered » | Le workflow n'est pas **Active** | Basculer l'interrupteur en haut à droite |
| Execution rouge sur une boîte Postgres | Connexion base : mauvais mot de passe ou mauvais port | Vérifier la credential Supabase : port **5432**, utilisateur `postgres.<ref-projet>` — détail dans [GUIDE-ACTIVATION §2.1](GUIDE-ACTIVATION.md) |
| Les emails partent mais n'arrivent pas | Réglage SMTP / dossier spam | Vérifier la credential SMTP et le dossier indésirables du destinataire |

Pour tout le reste (11 symptômes détaillés) : [GUIDE-ACTIVATION §9](GUIDE-ACTIVATION.md).

---

## 7. Pour aller plus loin

| Vous voulez… | Document |
|---|---|
| Installer de zéro : créer les credentials champ par champ, tester à blanc, ordre d'activation complet | [GUIDE-ACTIVATION.md](GUIDE-ACTIVATION.md) |
| Savoir tout ce qui se règle dans chaque workflow (horaires, délais J+2/J+30, textes, montant du parrainage…) et où est utilisée l'IA | [REFERENCE-AUTOMATISATIONS.md](REFERENCE-AUTOMATISATIONS.md) |
| Comprendre le fonctionnement interne, boîte par boîte | [DOCUMENTATION.md](DOCUMENTATION.md) |
| La vue d'ensemble technique du dossier | [README.md](README.md) |
