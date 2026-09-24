import { CHEMIN_EN, CHEMIN_FR, type ContenuVente } from "./contenu";

const WHATSAPP =
  "https://wa.me/33651748133?text=" +
  encodeURIComponent("Hello, I'm writing from the Keo presentation page.");
const MAIL = "mailto:contact@agenia.pro?subject=" + encodeURIComponent("Keo — enquiry");

/**
 * Version anglaise — **adaptée**, pas traduite mot pour mot.
 *
 * Deux partis pris, pour un lecteur anglophone à qui l'on vend un produit
 * destiné au marché français :
 *
 * - les réalités françaises du métier sont **glosées à leur première
 *   apparition** (`mandat`, `DPE`) plutôt que remplacées par un équivalent
 *   anglo-saxon approximatif — un « listing agreement » n'est pas un mandat ;
 * - les portails sont nommés tels quels : ce sont des noms propres, et leur
 *   substituer Rightmove ou Zillow affirmerait une intégration qui n'existe pas.
 *
 * Les prix et les dates se formatent en `en-GB`, mais restent en euros : c'est
 * la devise facturée.
 */
export const CONTENU_EN: ContenuVente = {
  langue: "en",
  locale: "en-GB",
  ogLocale: "en_GB",
  chemin: CHEMIN_EN,
  bascule: { libelle: "Français", href: CHEMIN_FR, titre: "Lire cette page en français" },

  meta: {
    titre: "Keo — the automations that hold an estate agency together",
    description:
      "Keo sorts portal enquiries, replies in under a minute, chases viewings, issues rent " +
      "receipts and watches listing deadlines. Open demo, no account needed.",
  },
  edite: "by AgenIA",
  nav: {
    methode: "The method",
    plateforme: "What it does",
    sansFiltre: "No spin",
    tarifs: "Pricing",
    questions: "Questions",
    demo: "See the demo",
  },

  hero: {
    pastille: "Open demo",
    titre: ["Your leads aren't lost.", "They arrived too late."],
    lead:
      "A portal enquiry called back three hours later has already rung the agency down the road. " +
      "A forgotten viewing reminder becomes an empty slot. A listing agreement expiring in thirty " +
      "days flags itself nowhere.",
    leadFin: [
      "None of these lapses shows up on a dashboard: they blend into the market, the season, or ",
      "“it was a busy week”",
      ". That is exactly where Keo works.",
    ],
    ctaDemo: "See the demo",
    ctaQuestion: "Ask a question",
    note: "No account · no email address · entirely fictional data",
    apercus: [
      {
        tete: "First reply",
        note: "to the lead",
        valeur: "< 1 min",
        ton: "vert",
        legende: "8 emails sorted, 5 qualified leads, 5 replies sent.",
      },
      {
        tete: "Listing expiring",
        note: "alert",
        valeur: "30 days",
        ton: "ambre",
        legende: "The owner is chased before they look elsewhere.",
      },
      {
        tete: "Rent receipt",
        note: "due date",
        valeur: "PDF",
        legende: "Issued on the day, ready to send.",
      },
      {
        tete: "Viewing reminder",
        note: "before",
        valeur: "1 day · 2 hrs",
        legende: "Two messages per viewing, with nobody remembering to send them.",
      },
    ],
  },

  bande: {
    label: "Eleven automations, delivered together",
    items: [
      "Portal enquiries sorted",
      "Instant reply, around the clock",
      "Contact record created without retyping",
      "Online viewing booking",
      "Viewing confirmations and reminders",
      "Rent receipts as PDFs",
      "Listing expiry alerts",
      "Energy certificate and survey reminders",
      "Segmented buyer newsletter",
      "Google review requests",
      "Referral requests",
    ],
  },

  stats: [
    {
      valeur: "11",
      libelle: "automations",
      detail: "From online booking to referrals. Every one of them visible in the demo.",
    },
    {
      valeur: "0",
      libelle: "retyping",
      detail:
        "The portal email becomes a lead, a contact record and a timestamped reply without a single line being typed again.",
    },
    {
      valeur: "24/7",
      libelle: "of replies",
      detail: "An enquiry landing at 10:40 pm on a Sunday gets its acknowledgement at 10:40 pm.",
    },
  ],

  methode: {
    surtitre: "The method",
    titre: "The three lapses nobody ever sees",
    sous:
      "None of the three shows up in revenue or on a dashboard. They look like the market, and " +
      "that is why nobody fixes them.",
    oublis: [
      {
        num: "01",
        titre: "Between the portal and the callback",
        probleme:
          "Enquiries from SeLoger, Leboncoin, Bien'ici and your own form land in the same inbox as invoices and paperwork. The one you call back three hours later has already rung the agency across the street.",
        reponse:
          "Keo reads every email, tells a real enquiry apart from a post-viewing follow-up, a document upload or spam, creates the qualified lead, routes it to the right agent, opens the contact record and sends a timestamped acknowledgement.",
        label: "8 raw emails",
        chiffre: "5 leads",
      },
      {
        num: "02",
        titre: "Between the booking and the viewing",
        probleme:
          "A Monday booking for Saturday hangs on one thread: the client remembering. A no-show doesn't cost you a viewing — it costs the journey, the slot, and the seller who waited in.",
        reponse:
          "The slot is booked online and blocked at once. Confirmation goes out on booking, a reminder the day before, another two hours ahead. None of it depends on someone thinking of it.",
        label: "1 day · 2 hrs",
        chiffre: "2 messages",
      },
      {
        num: "03",
        titre: "Between the signature and the deadline",
        probleme:
          "A listing agreement (mandat) runs out, an energy certificate (DPE) reaches its term, a rent receipt falls due. None of it surfaces: you find out the day the owner has already signed elsewhere.",
        reponse:
          "The listing alerts thirty days ahead and the owner chase goes with it. Certificates turn amber, then red. Rent receipts are generated on the due date, as PDFs, ready to send.",
        label: "Listing · DPE · lease",
        chiffre: "30 days",
      },
    ],
  },

  pratique: {
    surtitre: "In practice",
    titre: "What changes within the week",
    sous:
      "The rest doesn't change: your properties, your methods, your agents. It's the tasks nobody " +
      "has time for that stop waiting on someone.",
    etapes: [
      {
        num: "01",
        titre: "Your enquiries arrive sorted",
        texte:
          "You stop opening emails and start opening records. Qualified, assigned, already answered — including the ones that landed at 10:40 pm on a Sunday.",
      },
      {
        num: "02",
        titre: "Your viewings book themselves",
        texte:
          "The client picks a slot on a booking page. Confirmation, a reminder the day before, another two hours ahead: nothing to trigger.",
      },
      {
        num: "03",
        titre: "Your deadlines announce themselves",
        texte:
          "Rent receipts issued, listings flagged thirty days out, certificates tracked. You stop keeping the calendar in your head.",
      },
    ],
  },

  plateforme: {
    surtitre: "The platform",
    titre: "What Keo does while you do your job",
    sous: "From the enquiry received to the Google review obtained, in one place.",
    cartes: [
      {
        titre: "Lead sorting and qualification",
        texte:
          "Every portal email is read, classified and turned into a qualified lead, routed to the agent handling the property. Spam is set aside, and a post-viewing follow-up stays a follow-up.",
        label: "8 emails sorted",
        valeur: "5 leads",
      },
      {
        titre: "Instant reply",
        texte:
          "The acknowledgement leaves the second the lead exists, written around the property asked about, at any hour. It is often the only reply that prospect got that evening.",
        label: "In at 10:40 pm",
        valeur: "Out at 10:40 pm",
      },
      {
        titre: "Bookings and reminders",
        texte:
          "A public booking page, the slot blocked on the spot, immediate confirmation, then reminders the day before and two hours ahead, by SMS and email.",
        label: "Slot booked",
        valeur: "Confirmed",
      },
      {
        titre: "Rent receipts",
        texte:
          "On the due date, the month's receipt is generated as a PDF — a real document, not a preview — and the covering email goes with it.",
        label: "This month's due date",
        valeur: "PDF",
      },
      {
        titre: "Listings and compliance",
        texte:
          "Listing agreements alert thirty days before term, owner chase included. Energy certificates, landlord insurance and leases move from “upcoming” to “imminent” to “overdue”.",
        label: "Listing MA-14",
        valeur: "30 days",
      },
      {
        titre: "After the signature",
        texte:
          "A newsletter segmented to the buyers whose brief matches, a Google review request two days after signing with a nudge at five, a referral request at thirty.",
        label: "Signed + 2 days",
        valeur: "Review",
      },
    ],
  },

  sansFiltre: {
    surtitre: "No spin",
    titre: "What runs, and what gets connected",
    sous:
      "The demo shows the whole product, but it simulates the sending. Here, honestly, is what you " +
      "can see today, what gets wired to your own tools on installation, and what is waiting on " +
      "your feedback.",
    jalons: [
      {
        etat: "In the demo",
        ton: "vif",
        intro: "All of it works, open, no account.",
        points: [
          "The eleven automations",
          "Rent receipts as real PDFs",
          "Faithful previews of every SMS and email",
          "A timestamped log of every run",
          "Import and export of your data in Excel",
        ],
      },
      {
        etat: "On installation",
        ton: "tiede",
        intro: "What gets wired to your own tools.",
        points: [
          "Real sending of SMS and email",
          "Your inbox and your portals",
          "Your calendar",
          "Your Google listing, for reviews",
        ],
      },
      {
        etat: "Prioritised with you",
        ton: "froid",
        intro: "The order depends on what you ask for.",
        points: [
          "Accounts and permissions per agent",
          "A link to an existing CRM",
          "A consolidated multi-branch view",
          "A mobile app",
        ],
      },
    ],
  },

  origine: {
    surtitre: "Why Keo",
    citation:
      "“An agency doesn't lose its listings on the market. It loses them between two tasks nobody had time to do.”",
    paragraphes: [
      "An agent knows the trade better than any software. What they lack isn't advice: it's the quarter of an hour it would take to call back before noon, chase the owner before the deadline, and ask for the review before the client has forgotten.",
      "Keo came out of that. The automations replace nobody — they occupy the moments when nobody is available: a Sunday evening, the night before a viewing, the day a rent falls due.",
      "That is why the engine guards every action with a unique run key: replaying a date sends nothing twice. A reminder delivered twice damages the relationship more than a reminder forgotten, and that mistake would be invisible from the inside.",
    ],
    signature: "The Keo team — published by AgenIA, in France.",
  },

  verifier: {
    surtitre: "What you can check yourself",
    titre: "We won't show you customer testimonials",
    sous:
      "The product is young, and testimonials you cannot verify aren't worth much. Here are six " +
      "things you can check for yourself, right now, without taking our word for any of it.",
    engagements: [
      {
        titre: "A demo with no account",
        texte:
          "The product filled with realistic data, open to anyone. Judge it before speaking to us, and without leaving an address.",
        lien: { texte: "Enter the demo", href: "/" },
      },
      {
        titre: "Nothing is really sent",
        texte:
          "During the demo, no SMS or email reaches a real recipient. The previews are faithful, the contacts are fictional.",
        lien: { texte: "Open the outbox", href: "/messages" },
      },
      {
        titre: "Never a duplicate",
        texte:
          "Every automation is guarded by a unique run key. Replaying a date sends nothing twice — a reminder delivered twice costs more than no reminder at all.",
        lien: { texte: "Open the activity log", href: "/journal" },
      },
      {
        titre: "Your figures, not ours",
        texte:
          "An Excel workbook describes the whole dataset. Download it, swap in your own property stock, and watch the automations run on it.",
        lien: { texte: "Open import / export", href: "/import" },
      },
      {
        titre: "Hosted in Europe",
        texte:
          "Application and database hosted in Europe. The demo holds no real personal data, and sets no analytics cookie.",
      },
      {
        titre: "A person, not a switchboard",
        texte:
          "AgenIA is a small French outfit. You write, and someone who knows the product answers — and that is what decides the order of the work.",
        lien: { texte: "Write to us", href: MAIL },
      },
    ],
  },

  tarifs: {
    surtitre: "Pricing",
    titre: "The price, plainly",
    sous:
      "A monthly subscription, no commitment. What you see is what you pay: AgenIA is VAT-exempt " +
      "under the French small-business scheme, so there is no tax to add at invoicing.",
    mention:
      "No commitment, cancel at any time, no setup or exit fee. The demo stays open and free, with " +
      "no account.",
    cta: "Request a call",
    banniereEtiquette: "Offer running",
    banniere: (pct, nom, fin) => `${pct}% off ${nom}${fin ? `, until ${fin}` : ""}.`,
    reduction: (pct, fin) => `−${pct}% ${fin ? `until ${fin}` : "right now"}`,
  },

  questions: {
    surtitre: "Frequently asked",
    titre: "What people ask before the demo",
    items: [
      {
        q: "Do we have to change our agency software?",
        r: "No. Keo works on what comes in and what goes out — portal emails, bookings, messages, deadlines. Your existing tools stay where they are; what gets wired up on installation is your access, not your organisation.",
      },
      {
        q: "What actually gets sent during the demo?",
        r: "Nothing. No SMS or email reaches a real recipient: every message is placed in an outbox where you read it exactly as the client would receive it. Rent receipts, on the other hand, are real downloadable PDFs.",
      },
      {
        q: "How are enquiries sorted?",
        r: "By reading the email itself: the sender, the subject, the property reference quoted. A post-viewing follow-up or a document upload is not turned into a lead, and spam is set aside. Anything that fits no category stays visible — nothing is discarded silently.",
      },
      {
        q: "What if an automation gets it wrong?",
        r: "Every run leaves a timestamped line in the activity log, filterable and readable. You see what fired, when, for which property and which contact — and you take it back over.",
      },
      {
        q: "Is our data isolated?",
        r: "Yes. Each demo workspace is independent: the properties, the contacts and even the clock of one workspace appear in no other. Two presentations can run at the same time without disturbing each other.",
      },
      {
        q: "Can we put our own properties into the demo?",
        r: "Yes, and it is the best test there is. The Import / Export page hands you a pre-filled Excel workbook: replace the rows with your own stock, re-import, and the automations run on your references.",
      },
      {
        q: "Is there anything to install?",
        r: "No. Keo opens in a browser, on desktop and on a phone. There is nothing to install on your machines or on your agents'.",
      },
      {
        q: "What does it cost?",
        r: "The amount depends on what you connect and how many agents you have. Look at the demo first: you will know what you want, and we will tell you the price in one sentence.",
      },
    ],
  },

  rappel: {
    surtitre: "Would you rather we called?",
    titre: "Leave us a way to reach you",
    sous:
      "Four fields, two of them optional. We call back ourselves — you won't reach a switchboard.",
    champs: {
      nom: "Your name",
      agence: "Your agency",
      email: "Your email",
      telephone: "Your phone",
      piege: "Please leave this field empty",
    },
    bouton: "Request a call",
    mention: [
      "These details are used only to call you back. They go to no third-party service, are sold to nobody, and we delete them on request at ",
      ".",
    ],
    messages: {
      envoye: "Noted — we'll call you back within two working days.",
      nom: "Your name is missing.",
      email: "That email address doesn't look valid.",
    },
  },

  appel: {
    surtitre: "Open demo",
    titre: "Watch it run before we talk.",
    texte:
      "Open the inbox, sort the eight emails, move the date forward a week. Two minutes and you'll " +
      "know whether it's any use to you.",
    points: [
      "No account, no email address",
      "Entirely fictional data, nothing really sent",
      "Your own properties importable from one Excel workbook",
    ],
    ctaDemo: "Enter the demo",
    ctaWhatsapp: "Message us on WhatsApp",
  },

  pied: {
    produit: "The product",
    maison: "The company",
    aPropos: "Keo",
    liens: {
      methode: "The method",
      plateforme: "What it does",
      sansFiltre: "No spin",
      tarifs: "Pricing",
      questions: "Questions",
      demo: "Demo",
      rappel: "Request a call",
    },
    mentions: [
      "Workflow automation for independent estate agencies: portal enquiry sorting, instant replies, viewing bookings and reminders, rent receipts, listing and certificate deadlines.",
      "The online demo holds no real personal data and sends nothing to a real recipient.",
    ],
  },

  whatsapp: WHATSAPP,
  mail: MAIL,
};
