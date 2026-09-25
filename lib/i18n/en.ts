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
};
