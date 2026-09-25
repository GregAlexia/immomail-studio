import type { ContenuAide } from "./aide";

export const AIDE_FR: ContenuAide = {
  titre: "Aide & guide d'utilisation",
  description:
    "Comment piloter la démonstration et utiliser chaque espace de l'application — des trois espaces principaux aux espaces complémentaires activables depuis le menu Paramétrage.",
  sommaire: "Sommaire",
  espacesMasques:
    "Les espaces ci-dessous (**Mandats, Conformité, Marketing, Journal d'activité, Boîte d'envoi**) sont masqués du menu par défaut. Pour les afficher : menu **Paramétrage** → activer l'interrupteur de chaque espace → **Enregistrer**. Ils restent aussi accessibles par leur adresse directe.",
  sections: [
    {
      id: "prise-en-main",
      icone: "rocket",
      titre: "1. Prise en main & horloge de démo",
      cartes: [
        {
          titre: "Choisir l'agence",
          texte:
            "En haut à gauche, le sélecteur isole les données d'une agence. Deux agences contiennent un scénario complet : **Horizon Immobilier** (Lyon) et **Keo** (Charleville-Mézières), cette dernière sur un marché de province aux prix bien plus bas.",
        },
        {
          titre: "L'horloge de démo",
          texte:
            "Le bandeau en haut à droite pilote la « date de démo ». Choisissez une date, puis cliquez **Évaluer** : les automatisations dont l'échéance est atteinte se déclenchent en direct (rappels de visite, quittances mensuelles…).",
        },
      ],
      tableau: {
        colonnes: ["Contrôle", "Effet"],
        lignes: [
          { controle: "Date de démo", effet: "Affiche la date courante de la démonstration." },
          {
            controle: "Sélecteur de date",
            effet: "Choisir une nouvelle date (l'horloge n'avance que vers l'avenir, jamais en arrière).",
          },
          { controle: "Évaluer", effet: "Déclenche toutes les automatisations échues jusqu'à la date affichée." },
          {
            controle: "Réinitialiser",
            effet: "Recharge les données d'origine et remet la date de départ (idéal entre deux rendez-vous).",
          },
          {
            controle: "FR / EN",
            effet: "Change la langue de l'interface. Les données et les messages restent en français.",
          },
        ],
      },
      encadres: [
        {
          ton: "info",
          texte:
            "À chaque évaluation, une fenêtre récapitule les automatisations déclenchées. Aucune action n'est jamais exécutée deux fois.",
        },
        {
          ton: "note",
          // Corrigé : l'ancien guide annonçait un état partagé par tous les
          // visiteurs, ce qui n'est plus vrai depuis les espaces isolés.
          texte:
            "Chaque lien de commercial (`/c/phil`, `/c/ced`…) ouvre **son propre espace** : ses données, son horloge. Avancer la date ou réinitialiser n'affecte personne d'autre. Les visiteurs arrivés sans lien nominatif partagent en revanche le même espace de démonstration — d'où l'intérêt du mode présentateur (Paramétrage) et de « Réinitialiser » avant un rendez-vous.",
        },
      ],
    },
    {
      id: "reception",
      icone: "inbox",
      titre: "2. Boîte de réception",
      chapeau: "Tri & qualification · réponse instantanée · création de fiche CRM",
      intro:
        "C'est le cœur de la démo : chaque email brut reçu des portails (SeLoger, Leboncoin, Bien'ici, formulaire) est trié automatiquement, le spam écarté, le lead routé vers le bon négociateur, une réponse envoyée et une fiche CRM créée — le tout en vue **avant / après**.",
      etapes: [
        "Ouvrir **Boîte de réception** : à gauche, les **emails bruts** non triés.",
        "Cliquer sur **Trier les emails** (ou « Évaluer » dans le bandeau).",
        "À droite apparaissent les **leads qualifiés** : nom, contact, type de demande, bien, négociateur assigné et horodatage de la réponse automatique.",
        "Les compteurs en bas résument : **spam écarté**, **leads créés**, **réponses envoyées**.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 Le tri reconnaît aussi les emails qui ne sont *pas* de nouveaux leads (suivi après visite, envoi de pièces) et ne crée pas de doublon.",
        },
      ],
    },
    {
      id: "agenda",
      icone: "agenda",
      titre: "3. Agenda & visites",
      chapeau: "Prise de RDV en ligne · confirmations & rappels automatiques",
      intro:
        "Les prospects réservent une visite en ligne ; l'agence n'a plus d'allers-retours téléphoniques. Chaque RDV déclenche une confirmation puis des rappels automatiques pour réduire les no-shows.",
      etapes: [
        "Dans **Agenda & visites**, consulter les visites **à venir** et **passées**, avec leur statut.",
        "Pour montrer la réservation : panneau **« Pages de réservation publiques »** → **Ouvrir la page de réservation** d'un bien, choisir un créneau et valider.",
        "Le RDV apparaît dans l'agenda et une **confirmation** part automatiquement.",
        "Pour déclencher les **rappels J-1 et H-2** : choisissez une date proche du RDV dans le bandeau, puis cliquez **Évaluer**.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 La colonne « Suivi automatique » montre les badges Confirmation, Rappel J-1 et Rappel H-2 au fur et à mesure que la date avance.",
        },
      ],
    },
    {
      id: "locations",
      icone: "quittance",
      titre: "4. Locations & quittances",
      chapeau: "Quittances de loyer automatiques (PDF)",
      intro:
        "Chaque mois, au jour d'échéance du loyer, la quittance est générée en PDF et envoyée au locataire — sans intervention. Plus aucune quittance oubliée.",
      etapes: [
        "Ouvrir **Locations & quittances** : chaque bail affiche le locataire, le loyer + charges et le jour d'échéance.",
        "Choisir une date du **mois suivant** (après le jour d'échéance) dans le bandeau, puis cliquer **Évaluer** : la **quittance du mois** est générée pour chaque bail concerné.",
        "Cliquer sur **Télécharger le PDF** pour montrer la quittance réelle (montant, période, bailleur, locataire, bien).",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 Le compteur « Quittances du mois » du tableau de bord se met à jour à chaque échéance franchie.",
        },
      ],
    },
    {
      id: "mandats",
      icone: "mandat",
      titre: "5. Mandats",
      chapeau: "Alerte d'expiration & relance propriétaire automatique",
      intro:
        "Un mandat qui expire sans relance, c'est un bien qui part chez le concurrent. Cet espace liste tous les mandats (exclusifs ou simples) avec leurs dates, et **30 jours avant l'échéance** une relance de renouvellement part automatiquement au propriétaire.",
      etapes: [
        "Ouvrir **Mandats** : chaque ligne montre le bien, le propriétaire, le type de mandat et la **date d'échéance**.",
        "Repérer un mandat dont l'échéance est proche, puis choisir dans le bandeau une date à **moins de 30 jours** de celle-ci et cliquer **Évaluer**.",
        "Le mandat passe en **« À relancer »** et la **relance email au propriétaire** est envoyée (visible dans la Boîte d'envoi).",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 La relance n'est envoyée qu'**une seule fois** par mandat, même si vous ré-évaluez plusieurs fois.",
        },
      ],
    },
    {
      id: "conformite",
      icone: "conformite",
      titre: "6. Conformité",
      chapeau: "Suivi des diagnostics & échéances réglementaires",
      intro:
        "DPE, assurance PNO, renouvellement de bail… chaque obligation a sa date limite. Le tableau code chaque échéance par couleur — À venir, Imminent, Dépassé — et un **rappel interne** est déclenché automatiquement avant l'échéance (délai propre à chaque ligne, 30 jours par défaut).",
      etapes: [
        "Ouvrir **Conformité** : chaque ligne montre le bien, le type d'obligation, la date limite et le délai de rappel.",
        "Avancer l'horloge à l'intérieur de la fenêtre de rappel d'une échéance, puis cliquer **Évaluer**.",
        "Le statut passe à **« Rappelé »** et l'événement apparaît dans le Journal d'activité.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 Le délai de rappel se règle *par échéance* (colonne « Rappel (jours avant) » du fichier Excel d'import).",
        },
      ],
    },
    {
      id: "marketing",
      icone: "marketing",
      titre: "7. Marketing",
      chapeau: "Newsletter segmentée · avis Google · parrainage",
      intro:
        "Trois automatisations de fidélisation réunies : la **newsletter** qui envoie à chaque acheteur les biens correspondant à ses critères, la **collecte d'avis Google** (demande 2 jours après une signature, relance au 5ᵉ jour), et la **demande de parrainage** un mois après la signature.",
      etapes: [
        "Ouvrir **Marketing** : les segments d'acheteurs sont listés avec leurs critères (budget, type, zones).",
        "Cliquer **« Envoyer la newsletter »** sur un segment : chaque contact reçoit *sa* sélection personnalisée de biens.",
        "Pour les avis : avancer l'horloge à **J+2** d'une signature → Évaluer → la demande part (email + SMS). À **J+5** sans avis, une relance unique part.",
        "Cliquer **« Simuler : avis laissé »** sur une transaction pour stopper la relance (c'est ce que ferait la détection réelle).",
        "À **J+30** de la signature : la proposition de **parrainage** (bon de 200 €) part automatiquement.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 Seuls les contacts **opt-in marketing** avec des critères renseignés reçoivent la newsletter — et jamais deux fois la même semaine.",
        },
      ],
    },
    {
      id: "journal",
      icone: "journal",
      titre: "8. Journal d'activité",
      chapeau: "La preuve horodatée de tout ce qui s'exécute",
      intro:
        "C'est l'écran de preuve de la démo : une **timeline horodatée** (à la date de démo) de chaque action exécutée par les automatisations — tri d'un email, envoi d'un rappel, génération d'une quittance, relance de mandat… Rien ne se passe « dans l'ombre ».",
      etapes: [
        "Ouvrir **Journal d'activité** : les événements sont listés du plus récent au plus ancien.",
        "Utiliser les **pastilles de filtre** (A1, A2, A4…) pour n'afficher que les événements d'une automatisation.",
        "Après chaque clic sur **Évaluer**, revenir ici pour montrer la trace exacte de ce qui vient de se déclencher.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 Chaque événement porte la **date de démo** à laquelle il s'est produit — pas la date réelle — pour un scénario cohérent.",
        },
      ],
    },
    {
      id: "envoi",
      icone: "envoi",
      titre: "9. Boîte d'envoi",
      chapeau: "L'aperçu fidèle de chaque message envoyé",
      intro:
        "Tous les **SMS, emails et PDF** générés par les automatisations, présentés **tels que le client les recevrait** : objet, corps personnalisé, pièce jointe. En démo, aucun envoi réel ne part — c'est la vitrine du rendu final.",
      etapes: [
        "Ouvrir **Boîte d'envoi** : les compteurs en haut distinguent **emails** et **SMS**.",
        "Filtrer par automatisation avec les pastilles (A2 pour les rappels, A4 pour les quittances…).",
        "Ouvrir un message pour montrer le **texte exact** reçu par le client ; les quittances offrent le **téléchargement du PDF** joint.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 Argument clé en rendez-vous : « voilà précisément ce que reçoivent vos clients, sans que personne n'ait rien rédigé ».",
        },
      ],
    },
  ],
};
