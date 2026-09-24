import { CHEMIN_EN, CHEMIN_FR, type ContenuVente } from "./contenu";

const WHATSAPP =
  "https://wa.me/33651748133?text=" +
  encodeURIComponent("Bonjour, je vous écris depuis la page de présentation de Keo.");
const MAIL = "mailto:contact@agenia.pro?subject=" + encodeURIComponent("Keo — demande d'information");

export const CONTENU_FR: ContenuVente = {
  langue: "fr",
  locale: "fr-FR",
  ogLocale: "fr_FR",
  chemin: CHEMIN_FR,
  bascule: { libelle: "English", href: CHEMIN_EN, titre: "Read this page in English" },

  meta: {
    titre: "Keo — les automatisations qui tiennent une agence immobilière",
    description:
      "Keo trie les emails des portails, répond en moins d'une minute, rappelle les visites, " +
      "édite les quittances et surveille les échéances de mandat. Démonstration ouverte, sans compte.",
  },
  edite: "par AgenIA",
  nav: {
    methode: "La méthode",
    plateforme: "Ce que ça fait",
    sansFiltre: "Sans filtre",
    tarifs: "Tarifs",
    questions: "Questions",
    demo: "Voir la démonstration",
  },

  hero: {
    pastille: "Démonstration ouverte",
    titre: ["Vos leads ne sont pas perdus.", "Ils sont arrivés trop tard."],
    lead:
      "Une demande de portail rappelée trois heures plus tard a déjà appelé l'agence suivante. " +
      "Un rappel de visite oublié devient un créneau vide. Un mandat qui expire dans trente jours " +
      "ne se signale nulle part.",
    leadFin: [
      "Aucun de ces oublis n'apparaît sur un tableau de bord : ils se confondent avec le marché, la saison, ou ",
      "« la semaine a été chargée »",
      ". C'est exactement là que Keo travaille.",
    ],
    ctaDemo: "Voir la démonstration",
    ctaQuestion: "Poser une question",
    note: "Sans compte · sans adresse email · données entièrement fictives",
    apercus: [
      {
        tete: "Première réponse",
        note: "au lead",
        valeur: "< 1 min",
        ton: "vert",
        legende: "8 emails triés, 5 leads qualifiés, 5 réponses parties.",
      },
      {
        tete: "Mandat à terme",
        note: "alerte",
        valeur: "J-30",
        ton: "ambre",
        legende: "Le propriétaire est relancé avant de regarder ailleurs.",
      },
      {
        tete: "Quittance de loyer",
        note: "échéance",
        valeur: "PDF",
        legende: "Éditée au jour dit, prête à envoyer.",
      },
      {
        tete: "Rappel de visite",
        note: "avant",
        valeur: "J-1 · H-2",
        legende: "Deux envois par visite, sans que personne y pense.",
      },
    ],
  },

  bande: {
    label: "Onze automatisations, livrées ensemble",
    items: [
      "Tri des emails de portails",
      "Réponse instantanée 24/7",
      "Fiche contact créée sans ressaisie",
      "Prise de rendez-vous en ligne",
      "Confirmations et rappels de visite",
      "Quittances de loyer en PDF",
      "Alertes d'expiration de mandat",
      "Rappels DPE et diagnostics",
      "Newsletter acheteurs segmentée",
      "Demandes d'avis Google",
      "Demandes de parrainage",
    ],
  },

  stats: [
    {
      valeur: "11",
      libelle: "automatisations",
      detail: "De la prise de rendez-vous en ligne au parrainage. Toutes visibles dans la démonstration.",
    },
    {
      valeur: "0",
      libelle: "ressaisie",
      detail:
        "L'email du portail devient un lead, une fiche contact et une réponse horodatée sans qu'une ligne soit retapée.",
    },
    {
      valeur: "24/7",
      libelle: "de réponse",
      detail: "Une demande reçue un dimanche à 22 h 40 reçoit son accusé de réception à 22 h 40.",
    },
  ],

  methode: {
    surtitre: "La méthode",
    titre: "Les trois oublis qui ne se voient jamais",
    sous:
      "Aucun des trois n'apparaît dans un chiffre d'affaires ni dans un tableau de bord. Ils " +
      "ressemblent au marché, et c'est pour ça que personne ne les corrige.",
    oublis: [
      {
        num: "01",
        titre: "Entre le portail et le rappel",
        probleme:
          "Les demandes de SeLoger, Leboncoin, Bien'ici et du formulaire arrivent dans la même boîte que les factures et les pièces de dossier. Celle qu'on rappelle trois heures plus tard a déjà appelé l'agence d'en face.",
        reponse:
          "Keo lit chaque email, distingue une vraie demande d'un suivi de visite, d'un envoi de pièces ou d'un spam, crée le lead qualifié, le route au bon négociateur, ouvre la fiche contact et envoie l'accusé de réception horodaté.",
        label: "8 emails bruts",
        chiffre: "5 leads",
      },
      {
        num: "02",
        titre: "Entre le rendez-vous et la visite",
        probleme:
          "Un créneau calé le lundi pour le samedi tient à un seul fil : que le client s'en souvienne. Le lapin ne coûte pas une visite, il coûte le déplacement, le créneau et le vendeur qui attendait.",
        reponse:
          "Le créneau se réserve en ligne et se bloque aussitôt. La confirmation part à la réservation, le rappel la veille, puis deux heures avant. Aucun de ces envois ne dépend de quelqu'un qui y pense.",
        label: "Rappels J-1 · H-2",
        chiffre: "2 envois",
      },
      {
        num: "03",
        titre: "Entre la signature et l'échéance",
        probleme:
          "Un mandat expire, un DPE arrive à terme, une quittance est due. Rien de tout cela ne remonte : ça se voit le jour où le propriétaire a déjà signé ailleurs.",
        reponse:
          "Le mandat alerte trente jours avant et la relance propriétaire part avec. Les diagnostics passent en orange puis en rouge. Les quittances sont générées au jour d'échéance, en PDF, prêtes à envoyer.",
        label: "Mandat · DPE · bail",
        chiffre: "J-30",
      },
    ],
  },

  pratique: {
    surtitre: "En pratique",
    titre: "Ce qui change dans la semaine",
    sous:
      "Le reste ne change pas : vos biens, vos méthodes, vos négociateurs. Ce sont les tâches que " +
      "personne n'a le temps de faire qui cessent d'attendre quelqu'un.",
    etapes: [
      {
        num: "01",
        titre: "Vos demandes arrivent triées",
        texte:
          "Vous n'ouvrez plus des emails, vous ouvrez des fiches. Qualifiées, attribuées, déjà répondues — même celles tombées un dimanche à 22 h 40.",
      },
      {
        num: "02",
        titre: "Vos visites se calent seules",
        texte:
          "Le client choisit son créneau sur une page de réservation. Confirmation, rappel la veille, rappel deux heures avant : rien à déclencher.",
      },
      {
        num: "03",
        titre: "Vos échéances se signalent",
        texte:
          "Quittances éditées, mandats en alerte à trente jours, diagnostics suivis. Vous arrêtez de tenir le calendrier dans votre tête.",
      },
    ],
  },

  plateforme: {
    surtitre: "La plateforme",
    titre: "Ce que Keo fait, pendant que vous faites votre métier",
    sous: "De la demande reçue à l'avis Google obtenu, dans un seul endroit.",
    cartes: [
      {
        titre: "Tri et qualification des leads",
        texte:
          "Chaque email de portail est lu, classé et transformé en lead qualifié, routé au négociateur qui suit le bien. Le spam est écarté, un suivi de visite reste un suivi de visite.",
        label: "8 emails triés",
        valeur: "5 leads",
      },
      {
        titre: "Réponse instantanée",
        texte:
          "L'accusé de réception part à la seconde où le lead existe, personnalisé sur le bien demandé, à toute heure. C'est souvent la seule réponse que le prospect aura reçue ce soir-là.",
        label: "Reçu 22 h 40",
        valeur: "Répondu 22 h 40",
      },
      {
        titre: "Rendez-vous et rappels",
        texte:
          "Page de réservation publique, créneau bloqué à la volée, confirmation immédiate, puis rappels la veille et deux heures avant, par SMS et par email.",
        label: "Créneau réservé",
        valeur: "Confirmé",
      },
      {
        titre: "Quittances de loyer",
        texte:
          "Au jour d'échéance, la quittance du mois est générée en PDF — un vrai document, pas un aperçu — et l'email d'accompagnement part avec.",
        label: "Échéance du mois",
        valeur: "PDF",
      },
      {
        titre: "Mandats et conformité",
        texte:
          "Les mandats alertent trente jours avant terme, avec la relance propriétaire. Les diagnostics, le PNO et les baux passent d'« à venir » à « imminent » puis à « dépassé ».",
        label: "Mandat MA-14",
        valeur: "J-30",
      },
      {
        titre: "Après la signature",
        texte:
          "Newsletter segmentée aux acheteurs dont le projet correspond, demande d'avis Google deux jours après la signature avec relance à cinq, demande de parrainage à trente.",
        label: "Signature + 2 j",
        valeur: "Avis",
      },
    ],
  },

  sansFiltre: {
    surtitre: "Sans filtre",
    titre: "Ce qui tourne, et ce qui se branche",
    sous:
      "La démonstration montre le produit entier, mais elle simule les envois. Voici honnêtement " +
      "ce que vous pouvez voir aujourd'hui, ce qui se connecte chez vous à l'installation, et ce " +
      "qui attend vos retours.",
    jalons: [
      {
        etat: "Dans la démonstration",
        ton: "vif",
        intro: "Tout fonctionne, ouvert, sans compte.",
        points: [
          "Les onze automatisations",
          "Quittances en PDF réels",
          "Aperçus fidèles des SMS et des emails",
          "Journal horodaté de chaque exécution",
          "Import et export de vos données en Excel",
        ],
      },
      {
        etat: "À l'installation",
        ton: "tiede",
        intro: "Ce qui se branche sur vos outils, chez vous.",
        points: [
          "L'envoi réel des SMS et des emails",
          "Votre boîte mail et vos portails",
          "Votre agenda",
          "Votre fiche Google pour les avis",
        ],
      },
      {
        etat: "Priorisé avec vous",
        ton: "froid",
        intro: "L'ordre dépend de ce que vous demandez.",
        points: [
          "Comptes et droits par négociateur",
          "Connexion à un CRM existant",
          "Vue consolidée multi-agences",
          "Application mobile",
        ],
      },
    ],
  },

  origine: {
    surtitre: "Pourquoi Keo",
    citation:
      "« Une agence ne perd pas ses mandats sur le marché. Elle les perd entre deux tâches que personne n'a eu le temps de faire. »",
    paragraphes: [
      "Un négociateur connaît son métier mieux que n'importe quel logiciel. Ce qui lui manque, ce n'est pas un conseil : c'est le quart d'heure qu'il faudrait pour rappeler avant midi, relancer le propriétaire avant l'échéance et demander l'avis avant que le client ait oublié.",
      "Keo est né de ce constat. Les automatisations ne remplacent personne — elles occupent les moments où personne n'est disponible : un dimanche soir, la veille d'une visite, le jour d'échéance d'un loyer.",
      "C'est pour ça que le moteur est protégé par une clé d'exécution unique à chaque action : rejouer une date ne réexpédie rien. Un rappel envoyé deux fois abîme plus la relation qu'un rappel oublié, et cette erreur-là ne se verrait pas de l'intérieur.",
    ],
    signature: "L'équipe Keo — édité par AgenIA, en France.",
  },

  verifier: {
    surtitre: "Ce que vous pouvez vérifier",
    titre: "Nous ne vous montrerons pas d'avis clients",
    sous:
      "Le produit est jeune, et des témoignages que vous ne pouvez pas vérifier ne valent pas " +
      "grand-chose. Voici six choses que vous pouvez contrôler vous-même, maintenant, sans nous " +
      "croire sur parole.",
    engagements: [
      {
        titre: "Une démonstration sans compte",
        texte:
          "Le produit rempli de données réalistes, ouvert à tous. Jugez avant de nous parler, et sans laisser d'adresse.",
        lien: { texte: "Entrer dans la démonstration", href: "/" },
      },
      {
        titre: "Aucun envoi réel",
        texte:
          "Pendant la démonstration, aucun SMS ni email ne part vers un vrai destinataire. Les aperçus sont fidèles, les contacts sont fictifs.",
        lien: { texte: "Voir la boîte d'envoi", href: "/messages" },
      },
      {
        titre: "Jamais de doublon",
        texte:
          "Chaque automatisation est protégée par une clé d'exécution unique. Rejouer une date ne renvoie rien deux fois — un rappel envoyé en double coûte plus cher que pas de rappel du tout.",
        lien: { texte: "Voir le journal d'activité", href: "/journal" },
      },
      {
        titre: "Vos chiffres, pas les nôtres",
        texte:
          "Un classeur Excel décrit tout le jeu de données. Téléchargez-le, remplacez-le par votre stock de biens, et regardez les automatisations tourner dessus.",
        lien: { texte: "Ouvrir l'import / export", href: "/import" },
      },
      {
        titre: "Hébergement européen",
        texte:
          "Application et base de données hébergées en Europe. La démonstration ne contient aucune donnée personnelle réelle, et n'utilise aucun cookie de mesure d'audience.",
      },
      {
        titre: "Un interlocuteur, pas un standard",
        texte:
          "AgenIA est une petite maison française. Vous écrivez, quelqu'un qui connaît le produit vous répond — et c'est ce qui décide de l'ordre des chantiers.",
        lien: { texte: "Nous écrire", href: MAIL },
      },
    ],
  },

  tarifs: {
    surtitre: "Le prix",
    titre: "Le prix, sans détour",
    sous:
      "Un abonnement mensuel, sans engagement. Ce que vous voyez est ce que vous payez : AgenIA " +
      "relève de la franchise en base de TVA, il n'y a pas de taxe à ajouter au moment de la facture.",
    mention:
      "Sans engagement, résiliable à tout moment, aucun frais de mise en service ni de sortie. La " +
      "démonstration reste ouverte et gratuite, sans compte.",
    cta: "Être rappelé",
    banniereEtiquette: "Offre en cours",
    banniere: (pct, nom, fin) =>
      `${pct} % sur ${nom}${fin ? `, jusqu'au ${fin}` : ""}.`,
    reduction: (pct, fin) => `−${pct} % ${fin ? `jusqu'au ${fin}` : "en ce moment"}`,
  },

  questions: {
    surtitre: "Questions fréquentes",
    titre: "Ce qu'on nous demande avant la démonstration",
    items: [
      {
        q: "Faut-il changer de logiciel métier ?",
        r: "Non. Keo travaille sur ce qui entre et ce qui sort — les emails de portails, les rendez-vous, les envois, les échéances. Vos outils existants restent en place ; ce qui se branche à l'installation, ce sont vos accès, pas votre organisation.",
      },
      {
        q: "Qu'est-ce qui part vraiment pendant la démonstration ?",
        r: "Rien. Aucun SMS ni email n'est envoyé à un destinataire réel : chaque envoi est déposé dans une boîte d'envoi où vous le lisez tel que le client le recevrait. Les quittances, elles, sont de vrais PDF téléchargeables.",
      },
      {
        q: "Comment les demandes sont-elles triées ?",
        r: "Par lecture du contenu de l'email : l'expéditeur, l'objet, la référence du bien citée. Un message de suivi après visite ou un envoi de pièces de dossier n'est pas transformé en lead, et le spam est écarté. Ce qui ne rentre dans aucune case reste visible : rien n'est jeté en silence.",
      },
      {
        q: "Et si une automatisation se trompe ?",
        r: "Chaque exécution laisse une ligne horodatée dans le journal d'activité, filtrable et consultable. Vous voyez ce qui s'est déclenché, quand, pour quel bien et pour quel contact — et vous reprenez la main dessus.",
      },
      {
        q: "Mes données sont-elles isolées ?",
        r: "Oui. Chaque espace de démonstration est indépendant : les biens, les contacts et même l'horloge d'un espace n'apparaissent dans aucun autre. Deux présentations peuvent tourner en même temps sans se gêner.",
      },
      {
        q: "Puis-je mettre mes propres biens dans la démonstration ?",
        r: "Oui, et c'est le meilleur test. La page Import / Export vous donne un classeur Excel pré-rempli : remplacez les lignes par votre stock, ré-importez, et les automatisations tournent sur vos références.",
      },
      {
        q: "Faut-il installer quelque chose ?",
        r: "Non. Keo s'ouvre dans un navigateur, sur ordinateur comme sur téléphone. Il n'y a rien à installer sur vos postes ni sur ceux de vos négociateurs.",
      },
      {
        q: "Combien ça coûte ?",
        r: "Le montant dépend de ce que vous branchez et du nombre de négociateurs. Regardez d'abord la démonstration : vous saurez ce que vous voulez, et nous vous dirons le prix en une phrase.",
      },
    ],
  },

  rappel: {
    surtitre: "Vous préférez qu'on vous rappelle ?",
    titre: "Laissez-nous de quoi vous joindre",
    sous:
      "Quatre champs, dont deux facultatifs. Nous rappelons nous-mêmes — vous ne tomberez pas sur " +
      "un standard.",
    champs: {
      nom: "Votre nom",
      agence: "Votre agence",
      email: "Votre email",
      telephone: "Votre téléphone",
      piege: "Ne remplissez pas ce champ",
    },
    bouton: "Être rappelé",
    mention: [
      "Ces coordonnées ne servent qu'à vous rappeler. Elles ne partent vers aucun service tiers, ne sont revendues à personne, et nous les supprimons sur simple demande à ",
      ".",
    ],
    messages: {
      envoye: "C'est noté — nous vous rappelons sous deux jours ouvrés.",
      nom: "Il manque votre nom.",
      email: "Cette adresse email ne semble pas valide.",
    },
  },

  appel: {
    surtitre: "Démonstration ouverte",
    titre: "Voyez-le tourner avant qu'on en parle.",
    texte:
      "Ouvrez la boîte de réception, triez les huit emails, avancez la date d'une semaine. En deux " +
      "minutes vous saurez si ça vous sert.",
    points: [
      "Sans compte ni adresse email",
      "Données entièrement fictives, aucun envoi réel",
      "Vos propres biens importables en un classeur Excel",
    ],
    ctaDemo: "Entrer dans la démonstration",
    ctaWhatsapp: "Nous écrire sur WhatsApp",
  },

  pied: {
    produit: "Le produit",
    maison: "La maison",
    aPropos: "Keo",
    liens: {
      methode: "La méthode",
      plateforme: "Ce que ça fait",
      sansFiltre: "Sans filtre",
      tarifs: "Tarifs",
      questions: "Questions",
      demo: "Démonstration",
      rappel: "Être rappelé",
    },
    mentions: [
      "Automatisations métier pour agences immobilières indépendantes : tri des demandes de portails, réponse instantanée, rendez-vous et rappels de visite, quittances de loyer, échéances de mandat et de diagnostic.",
      "La démonstration en ligne ne contient aucune donnée personnelle réelle et n'émet aucun envoi vers un destinataire réel.",
    ],
  },

  whatsapp: WHATSAPP,
  mail: MAIL,
};
