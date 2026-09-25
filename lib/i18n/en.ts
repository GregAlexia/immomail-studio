/**
 * Traduction anglaise de l'interface de démonstration.
 *
 * **La clé est la chaîne française**, à la lettre près. Une clé absente laisse
 * le français s'afficher ; `npx tsx scripts/verifier-traductions.ts` liste les
 * oublis.
 *
 * Ce qui n'est **pas** traduit, délibérément : les données de démonstration
 * (agences, biens, contacts) et les messages que les automatisations produisent
 * — emails, SMS, quittances. Ce sont des biens français vendus par une agence
 * française à des clients français ; les rédiger en anglais donnerait une
 * démonstration invraisemblable. C'est l'outil qui change de langue, pas le
 * marché.
 */
export const EN: Record<string, string> = {
  // --- Navigation -----------------------------------------------------------
  "Tableau de bord": "Dashboard",
  "Boîte de réception": "Inbox",
  "Agenda & visites": "Diary & viewings",
  "Locations & quittances": "Lettings & receipts",
  "Mandats": "Listings",
  "Conformité": "Compliance",
  "Marketing": "Marketing",
  "Journal d'activité": "Activity log",
  "Boîte d'envoi": "Outbox",
  "Automatisations": "Automations",
  "Import / Export": "Import / Export",
  "Aide & guide": "Help & guide",
  "Paramétrage": "Settings",

  // Descriptions des menus, affichées dans Paramétrage.
  "Vue d'ensemble du jour (toujours actif).": "Today at a glance (always on).",
  "Tri des emails, leads qualifiés, réponses automatiques (A9 · A10 · A11).":
    "Email sorting, qualified leads, automatic replies (A9 · A10 · A11).",
  "Rendez-vous, confirmations et rappels (A1 · A2).":
    "Bookings, confirmations and reminders (A1 · A2).",
  "Baux et quittances PDF (A4).": "Leases and PDF rent receipts (A4).",
  "Alertes d'expiration et relances propriétaires (A3).":
    "Expiry alerts and owner chasers (A3).",
  "DPE, PNO, échéances de bail (A5).":
    "Energy certificates, landlord insurance, lease deadlines (A5).",
  "Newsletter, avis Google, parrainage (A6 · A7 · A8).":
    "Newsletter, Google reviews, referrals (A6 · A7 · A8).",
  "Timeline horodatée de toutes les automatisations.":
    "Timestamped timeline of every automation.",
  "Aperçu fidèle des SMS, emails et PDF envoyés.":
    "Faithful preview of every SMS, email and PDF sent.",
  "Les automatisations actives et leurs compteurs.":
    "The active automations and their counters.",
  "Pilotage complet par fichier Excel.": "Full control from an Excel file.",
  "Guide intégré de la démo.": "The demo's built-in guide.",
  "Choix des menus actifs (toujours actif).": "Which menus are on (always on).",

  // --- Coquille -------------------------------------------------------------
  "Démo agences immobilières": "Estate agency demo",
  "Données 100 % fictives · démo commerciale": "100% fictional data · sales demo",
  "Ouvrir le menu": "Open the menu",
  "Fermer le menu": "Close the menu",
  "Agence affichée": "Agency shown",
  "Langue de l'interface": "Interface language",
  "Base de données vide": "Empty database",
  "Chargez les données de démonstration avec :": "Load the demo data with:",
  "puis rechargez cette page.": "then reload this page.",

  // --- Barre d'horloge ------------------------------------------------------
  "Date de démo :": "Demo date:",
  "Évaluer": "Run",
  "Évaluer les automatisations échues maintenant": "Run the automations now due",
  "Réinitialiser": "Reset",
  "Réinitialiser la démo": "Reset the demo",
  "Traitement…": "Working…",
  "Confirmer la réinitialisation": "Confirm the reset",
  "Réinitialiser la démo ?": "Reset the demo?",
  "Toutes les données actuelles (leads, rendez-vous, messages, journal) seront remplacées par le jeu de démonstration initial et l'horloge reviendra à sa date de départ.":
    "All current data — leads, bookings, messages, activity log — will be replaced by the initial demo set, and the clock will return to its starting date.",
  "Annuler": "Cancel",
  "Action verrouillée": "Action locked",
  "Cette démo est protégée : l'horloge, la réinitialisation et l'import sont réservés au présentateur. Déverrouillez le mode présentateur dans":
    "This demo is protected: the clock, the reset and the import are reserved for the presenter. Unlock presenter mode in",
  "Fermer": "Close",
  "Automatisations déclenchées": "Automations triggered",
  "automatisations déclenchées": "automations triggered",
  "automatisation déclenchée": "automation triggered",
  "Aucune nouvelle automatisation": "No new automation",
  "Tout est déjà à jour pour cette date. Avancez encore l'horloge pour déclencher les échéances suivantes.":
    "Everything is already up to date for this date. Move the clock forward again to trigger the next deadlines.",
  "et": "and",
  "autres — voir le Journal d'activité": "more — see the Activity log",

  // --- Catalogue des automatisations ---------------------------------------
  "Tri & qualification des leads email": "Email lead sorting & qualification",
  "Plus aucun lead perdu dans la boîte commune": "No more leads lost in the shared inbox",
  "Email brut → fiche lead structurée": "Raw email → structured lead record",
  "Réponse instantanée aux leads": "Instant reply to leads",
  "Le premier qui répond décroche l'affaire": "Whoever replies first wins the business",
  "Accusé 24/7 + horodatage reçu → répondu": "24/7 acknowledgement, timestamped in → out",
  "Création automatique de fiche CRM": "Automatic CRM record creation",
  "Zéro ressaisie, zéro erreur": "No retyping, no mistakes",
  "Fiche contact pré-remplie": "Pre-filled contact record",
  "Prise de RDV automatique": "Automatic booking",
  "Supprime les allers-retours téléphoniques": "Ends the phone tag",
  "Page de réservation + RDV dans l'agenda": "Booking page + appointment in the diary",
  "Confirmation + rappel SMS des visites": "Viewing confirmation + SMS reminders",
  "Réduit les no-shows": "Cuts no-shows",
  "Aperçus SMS/email (confirmation, J-1, H-2)": "SMS/email previews (confirmation, 1 day, 2 hrs)",
  "Quittances de loyer automatiques": "Automatic rent receipts",
  "Gain de temps administratif": "Admin time saved",
  "Vrai PDF + email mocké": "A real PDF + a simulated email",
  "Alerte expiration de mandat": "Listing expiry alert",
  "Récurrence de business": "Repeat business",
  "Widget « Mandats à relancer » + message": "A “listings to chase” panel + a message",
  "Rappel diagnostics & échéances": "Certificate & deadline reminders",
  "Conformité (DPE, PNO, bail)": "Compliance (energy certificate, landlord insurance, lease)",
  "Tableau « Conformité » + rappel": "A “Compliance” table + a reminder",
  "Newsletter acheteurs segmentée": "Segmented buyer newsletter",
  "Réactive le portefeuille": "Reactivates your database",
  "Email « nouveaux biens » + destinataires": "A “new properties” email + its recipients",
  "Collecte automatique d'avis Google": "Automatic Google review collection",
  "E-réputation": "Online reputation",
  "Email/SMS J+2 + relance J+5": "Email/SMS at 2 days + a nudge at 5",
  "Demande de parrainage post-transaction": "Post-sale referral request",
  "Acquisition la moins chère": "The cheapest acquisition there is",
  "Message de recommandation J+30": "A recommendation message at 30 days",

  // --- Tableau de bord ------------------------------------------------------
  "Vue d'ensemble du jour. Avancez l'horloge de démo (en haut à droite) pour voir les automatisations se déclencher en direct.":
    "Today at a glance. Move the demo clock forward (top right) to watch the automations fire live.",
  "emails non triés dans la boîte commune": "unsorted emails in the shared inbox",
  "email non trié dans la boîte commune": "unsorted email in the shared inbox",
  "Cliquez « Évaluer » (ou ouvrez la boîte de réception) pour les trier, créer les fiches CRM et répondre automatiquement.":
    "Click “Run” (or open the inbox) to sort them, create the CRM records and reply automatically.",
  "Leads qualifiés": "Qualified leads",
  "avec réponse auto": "with an automatic reply",
  "Réponses automatiques": "Automatic replies",
  "Quittances du mois": "Receipts this month",
  "Prochaines visites": "Next viewings",
  "Tout voir": "See all",
  "Confirmé": "Confirmed",
  "À confirmer": "To confirm",
  "Leads récents": "Recent leads",
  "Tri, fiche CRM et réponse automatiques": "Sorting, CRM record and reply, all automatic",
  "Aucun lead qualifié pour l'instant": "No qualified lead yet",
  "Triez la boîte de réception pour les générer.": "Sort the inbox to generate them.",
  "routé vers": "routed to",
  "Répondu": "Replied",
  "Dernières automatisations": "Latest automations",
  "Voir les automatisations": "See the automations",
  "Aucune automatisation déclenchée": "No automation triggered",
  "Avancez l'horloge ou cliquez « Évaluer ».": "Move the clock forward, or click “Run”.",
  "Bien": "Property",
  "Estimation": "Valuation",
  "à": "at",

  // --- Boîte de réception / leads ------------------------------------------
  "Boîte de réception → Leads qualifiés": "Inbox → Qualified leads",
  "Le « wow » de la démo : chaque email brut des portails est trié, le spam écarté, le lead routé vers le bon négociateur, une fiche CRM créée et une réponse envoyée — automatiquement (A9 · A10 · A11).":
    "The demo's “wow”: every raw portal email is sorted, spam is set aside, the lead is routed to the right agent, a CRM record is created and a reply is sent — automatically (A9 · A10 · A11).",
  "Trier les": "Sort the",
  "emails maintenant": "emails now",
  "Trier l'email maintenant": "Sort the email now",
  "Avant — emails bruts reçus": "Before — raw emails received",
  "reçu": "received",
  "Après — leads structurés dans le CRM": "After — structured leads in the CRM",
  "Aucun lead pour l'instant": "No lead yet",
  "Cliquez « Trier les emails maintenant » (ou « Évaluer » en haut) pour lancer la qualification automatique.":
    "Click “Sort the emails now” (or “Run” at the top) to start the automatic qualification.",
  "Lead": "Lead",
  "Demande": "Request",
  "Routage": "Routing",
  "Réponse auto": "Auto reply",
  "Tél. non communiqué": "No phone given",
  "Priorité": "Priority",
  "haute": "high",
  "moyenne": "medium",
  "basse": "low",
  "Envoyée": "Sent",
  "En attente": "Pending",
  "Spam écarté": "Spam set aside",
  "Leads créés": "Leads created",
  "Réponses auto": "Auto replies",
  "SeLoger": "SeLoger",
  "Leboncoin": "Leboncoin",
  "Bien'ici": "Bien'ici",
  "Formulaire site": "Website form",
  "Email direct": "Direct email",
  "Spam": "Spam",
  "Achat - visite": "Purchase — viewing",
  "Location": "Letting",
  "Non traité": "Not sorted",
  "Lead qualifié ✓": "Qualified lead ✓",
  "Suivi post-visite": "Post-viewing follow-up",
  "Pièces de dossier": "Application documents",

  // --- Agenda ---------------------------------------------------------------
  "Prise de RDV en ligne (A1) puis confirmation et rappels automatiques par SMS/email à J-1 et H-2 (A2). Avancez l'horloge pour déclencher les rappels.":
    "Online booking (A1), then automatic confirmation and SMS/email reminders 1 day and 2 hours ahead (A2). Move the clock forward to fire the reminders.",
  "Demandé": "Requested",
  "Rappelé": "Reminded",
  "Effectué": "Done",
  "No-show": "No-show",
  "Annulé": "Cancelled",
  "Confirmation": "Confirmation",
  "Rappel J-1": "Reminder, 1 day",
  "Rappel H-2": "Reminder, 2 hrs",
  "En attente d'envoi": "Not sent yet",
  "Visites à venir": "Upcoming viewings",
  "RDV": "bookings",
  "Aucune visite à venir": "No upcoming viewing",
  "Visites passées": "Past viewings",
  "Pages de réservation publiques": "Public booking pages",
  "A1 — type Calendly": "A1 — Calendly style",
  "/mois": "/month",
  "Ouvrir la page de réservation": "Open the booking page",
  "Contact": "Contact",
  "Date": "Date",
  "Suivi automatique": "Automatic follow-up",

  // --- Locations & quittances ----------------------------------------------
  "Chaque mois, au jour d'échéance du loyer, la quittance PDF est générée et envoyée automatiquement au locataire (A4). Avancez l'horloge d'un mois pour en générer une nouvelle.":
    "Every month, on the rent due date, the PDF receipt is generated and sent to the tenant automatically (A4). Move the clock forward a month to generate another.",
  "Aucun bail actif": "No active lease",
  "Bien loué": "Let property",
  "Locataire :": "Tenant:",
  "Loyer": "Rent",
  "de charges": "of service charges",
  "/ mois": "/ month",
  "échéance le": "due on the",
  "du mois": "of the month",
  "quittance(s)": "receipt(s)",
  "Aucune quittance générée pour l'instant.": "No receipt generated yet.",
  "Envoyée le": "Sent on",
  "Télécharger le PDF": "Download the PDF",

  // --- Mandats --------------------------------------------------------------
  "Alerte automatique avant l'échéance d'un mandat (30 jours), avec relance pré-rédigée au propriétaire — pour ne jamais perdre un renouvellement (A3).":
    "An automatic alert 30 days before a listing agreement expires, with a pre-written owner chaser — so a renewal is never lost (A3).",
  "Aucun mandat": "No listing agreement",
  "Propriétaire": "Owner",
  "Relance auto": "Auto chaser",
  "Exclusif": "Sole agency",
  "Simple": "Multiple agency",
  "Expiré depuis": "Expired",
  "Actif": "Active",
  "Relance envoyée": "Chaser sent",

  // --- Conformité -----------------------------------------------------------
  "Conformité — diagnostics & échéances": "Compliance — certificates & deadlines",
  "Rappel automatique avant chaque échéance réglementaire (DPE, assurance PNO, renouvellement de bail) selon le délai paramétré (A5).":
    "An automatic reminder before each statutory deadline — energy certificate, landlord insurance, lease renewal — at the notice period you set (A5).",
  "Aucune échéance de conformité": "No compliance deadline",
  "Type": "Type",
  "Échéance": "Due",
  "Rappel": "Reminder",
  "Statut": "Status",
  "Traité": "Handled",
  "Dépassé": "Overdue",
  "Imminent": "Imminent",
  "À venir": "Upcoming",
  "Rappel envoyé": "Reminder sent",
  "Dépassé de": "Overdue by",
  "Dans": "In",
  "j": "d",
  "j avant": "d before",
  "DPE": "Energy certificate (DPE)",
  "Assurance PNO": "Landlord insurance",
  "Renouvellement bail": "Lease renewal",
  "Autre": "Other",

  // --- Marketing ------------------------------------------------------------
  "Marketing & fidélisation": "Marketing & retention",
  "Réactivez votre portefeuille et votre e-réputation : newsletter segmentée (A6), collecte d'avis Google à J+2 avec relance J+5 (A7), demande de parrainage à J+30 (A8).":
    "Reactivate your database and your online reputation: segmented newsletter (A6), Google review collection at 2 days with a nudge at 5 (A7), referral request at 30 days (A8).",
  "email(s) envoyé(s)": "email(s) sent",
  "Aucun segment": "No segment",
  "Cible :": "Target:",
  "tous types": "all types",
  "location": "letting",
  "vente": "sale",
  "apartment": "apartment",
  "house": "house",
  "land": "land",
  "commercial": "commercial",
  "studio": "studio",
  "Envoyer la newsletter": "Send the newsletter",
  "Collecte d'avis Google": "Google review collection",
  "message(s)": "message(s)",
  "Aucune transaction": "No transaction",
  "Client": "Client",
  "Signé le": "Signed on",
  "Avis": "Review",
  "Avis déposé ✓": "Review left ✓",
  "Relancé (J+5)": "Nudged (day 5)",
  "Demande envoyée": "Request sent",
  "À venir (J+2)": "Upcoming (day 2)",
  "Simuler : avis laissé": "Simulate: review left",
  "Demande de parrainage": "Referral request",
  "Parrainage (J+30)": "Referral (day 30)",
  "Envoyé": "Sent",

  // --- Automatisations ------------------------------------------------------
  "Les 11 automatisations de la plateforme, regroupées par espace. Le code (A1…A11) de chaque carte correspond au flux n8n du même nom — voir le dossier n8n-workflows/ et son guide débutant.":
    "The platform's 11 automations, grouped by area. Each card's code (A1…A11) matches the n8n workflow of the same name — see the n8n-workflows/ folder and its beginner's guide.",
  "Boîte de réception — acquisition & qualification des leads":
    "Inbox — lead acquisition & qualification",
  "Gestion — locations, mandats, conformité": "Management — lettings, listings, compliance",
  "Marketing & fidélisation ": "Marketing & retention ",
  "Active": "On",
  "Sortie visible :": "Visible output:",
  "déclenchement(s)": "run(s)",
  "En attente de déclenchement": "Not triggered yet",
  "Voir le détail": "See the detail",

  // --- Journal & boîte d'envoi ---------------------------------------------
  "L'écran clé de la démo : la trace horodatée (date de démo) de tout ce que les automatisations exécutent.":
    "The demo's key screen: a timestamped trail (in demo time) of everything the automations do.",
  "Tout": "All",
  "Aucune entrée": "No entry",
  "Avancez l'horloge de démo ou cliquez « Évaluer » pour déclencher des automatisations.":
    "Move the demo clock forward, or click “Run”, to trigger automations.",
  "Tous les SMS, emails et PDF générés par les automatisations — avec un aperçu fidèle à ce que recevrait le client. (Envois simulés : aucune API réelle.)":
    "Every SMS, email and PDF the automations produce — shown exactly as the client would receive it. (Sending is simulated: no real API.)",
  "Aucun message envoyé": "No message sent",
  "Déclenchez des automatisations (horloge / Évaluer) pour générer des messages.":
    "Trigger some automations — the clock, or “Run” — to generate messages.",

  // --- Import / Export ------------------------------------------------------
  "Import / Export Excel": "Excel import / export",
  "Pilotez la démo avec vos propres données : téléchargez le modèle, modifiez-le, ré-importez-le. Le contenu affiché reflète directement le fichier.":
    "Drive the demo with your own data: download the template, edit it, re-import it. What you see reflects the file directly.",
  "Onglets reconnus dans le classeur": "Sheets recognised in the workbook",
  "Les onglets du classeur portent des noms français — ce sont les clés de lecture du fichier, elles ne changent pas avec la langue de l'interface : Agences, Paramètres, Stock de biens, Acheteurs, Boîte de réception, Leads qualifiés, Rendez-vous, Suivi des visites, Mandats, Baux, Conformité, Transactions, Segments newsletter.":
    "The workbook's sheet names are in French — they are how the file is read, and they do not change with the interface language: Agences, Paramètres, Stock de biens, Acheteurs, Boîte de réception, Leads qualifiés, Rendez-vous, Suivi des visites, Mandats, Baux, Conformité, Transactions, Segments newsletter.",
  "Multi-agences :": "Multi-branch:",
  "listez vos agences dans l'onglet Agences, puis indiquez l'agence de chaque ligne via la colonne Agence (présente sur chaque onglet de données). Une ligne sans agence est rattachée à la première agence listée.":
    "list your branches in the Agences sheet, then set each row's branch in the Agence column (present on every data sheet). A row with no branch is attached to the first one listed.",
  "Le détail des colonnes, valeurs acceptées et exemples est dans l'":
    "Columns, accepted values and examples are detailed in",
  "aide → Fichier Excel source": "Help → Source Excel file",
  "Les onglets absents sont simplement ignorés.": "Missing sheets are simply ignored.",
  "Échec de l'envoi du fichier.": "The file could not be uploaded.",
  "Récupérer le modèle Excel": "Get the Excel template",
  "Téléchargez le classeur pré-rempli avec les données actuelles. Il contient tous les onglets au bon format — modifiez-le, ajoutez vos biens, leads, RDV… puis ré-importez-le.":
    "Download the workbook, pre-filled with the current data. It holds every sheet in the right format — edit it, add your properties, leads and bookings, then re-import it.",
  "Télécharger le modèle (.xlsx)": "Download the template (.xlsx)",
  "Importer votre fichier": "Import your file",
  "L'import": "The import",
  "remplace toutes les données": "replaces all the data",
  "de la démo par le contenu du fichier. L'affichage reflètera alors directement votre classeur.":
    "in the demo with the contents of the file. What you see will then reflect your workbook directly.",
  "Choisir un fichier .xlsx": "Choose an .xlsx file",
  "Import en cours…": "Importing…",
  "Importer et remplacer les données": "Import and replace the data",
  "Import réussi —": "Import successful —",
  "agence(s) :": "agency/agencies:",
  "Redirection vers le tableau de bord…": "Taking you to the dashboard…",
  "Échec de l'import.": "The import failed.",
  "Voir la quittance (PDF)": "View the receipt (PDF)",

  // --- Paramétrage ----------------------------------------------------------
  "Choisissez les espaces visibles dans le menu de l'application. Les pages désactivées restent accessibles par leur adresse directe ; seul le menu change. Le réglage est mémorisé sur ce navigateur.":
    "Choose which areas appear in the application menu. Pages you switch off stay reachable at their own address; only the menu changes. The setting is remembered in this browser.",
  "Mode présentateur": "Presenter mode",
  "Protection désactivée : aucune variable": "Protection off: no",
  "n'est configurée sur le serveur. Tous les visiteurs peuvent piloter l'horloge, réinitialiser la démo et importer des données. Pour protéger la démo publique, définissez cette variable (sur Vercel : Settings → Environment Variables) puis redéployez.":
    "variable is set on the server. Any visitor can drive the clock, reset the demo and import data. To protect the public demo, set that variable (on Vercel: Settings → Environment Variables) and redeploy.",
  "Mode présentateur déverrouillé": "Presenter mode unlocked",
  "Horloge, réinitialisation et import sont utilisables depuis ce navigateur.":
    "The clock, the reset and the import are available from this browser.",
  "Verrouiller": "Lock",
  "Démo verrouillée": "Demo locked",
  "Mot de passe présentateur": "Presenter password",
  "Déverrouiller": "Unlock",
  "Mot de passe incorrect": "Wrong password",
  "Enregistrement…": "Saving…",
  "Enregistrer": "Save",
  "Rétablir les menus par défaut": "Restore the default menus",
  "Enregistré — la navigation est à jour": "Saved — the navigation is up to date",
};
