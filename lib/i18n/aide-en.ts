import type { ContenuAide } from "./aide";

/**
 * Version anglaise du guide — adaptée, pas traduite mot pour mot.
 *
 * Les noms d'écrans reprennent ceux du dictionnaire `en.ts` : un guide qui
 * parlerait de « Boîte de réception » pendant que le menu affiche « Inbox »
 * serait pire qu'un guide en français.
 */
export const AIDE_EN: ContenuAide = {
  titre: "Help & user guide",
  description:
    "How to drive the demo and use each area of the application — from the three main areas to the extra ones you can switch on from the Settings menu.",
  sommaire: "Contents",
  espacesMasques:
    "The areas below (**Listings, Compliance, Marketing, Activity log, Outbox**) are hidden from the menu by default. To show them: **Settings** menu → switch each area on → **Save**. They also stay reachable at their own address.",
  sections: [
    {
      id: "prise-en-main",
      icone: "rocket",
      titre: "1. Getting started & the demo clock",
      cartes: [
        {
          titre: "Choosing the agency",
          texte:
            "Top left, the selector isolates one agency's data. Two agencies carry a full scenario: **Horizon Immobilier** (Lyon) and **Keo** (Charleville-Mézières), the latter in a provincial market at far lower prices.",
        },
        {
          titre: "The demo clock",
          texte:
            "The bar at the top right drives the “demo date”. Pick a date, then click **Run**: every automation whose deadline has been reached fires live — viewing reminders, monthly rent receipts, and so on.",
        },
      ],
      tableau: {
        colonnes: ["Control", "What it does"],
        lignes: [
          { controle: "Demo date", effet: "Shows the demo's current date." },
          {
            controle: "Date picker",
            effet: "Pick a new date (the clock only moves forward, never back).",
          },
          { controle: "Run", effet: "Fires every automation due up to the date shown." },
          {
            controle: "Reset",
            effet: "Reloads the original data and restores the starting date — ideal between two meetings.",
          },
          {
            controle: "FR / EN",
            effet: "Switches the interface language. The data and the messages stay in French.",
          },
        ],
      },
      encadres: [
        {
          ton: "info",
          texte:
            "After each run, a panel sums up which automations fired. No action is ever performed twice.",
        },
        {
          ton: "note",
          texte:
            "Each salesperson's link (`/c/phil`, `/c/ced`…) opens **its own workspace**: its own data, its own clock. Moving the date or resetting affects nobody else. Visitors arriving without a named link do share one demo workspace — hence presenter mode (Settings), and “Reset” before a meeting.",
        },
      ],
    },
    {
      id: "reception",
      icone: "inbox",
      titre: "2. Inbox",
      chapeau: "Sorting & qualification · instant reply · CRM record creation",
      intro:
        "This is the heart of the demo: every raw email from the portals (SeLoger, Leboncoin, Bien'ici, your own form) is sorted automatically, spam is set aside, the lead is routed to the right agent, a reply is sent and a CRM record created — all shown **before / after**.",
      etapes: [
        "Open **Inbox**: on the left, the unsorted **raw emails**.",
        "Click **Sort the emails** (or “Run” in the top bar).",
        "On the right, the **qualified leads** appear: name, contact details, request type, property, assigned agent and the timestamp of the automatic reply.",
        "The counters at the bottom sum it up: **spam set aside**, **leads created**, **replies sent**.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 The sorting also recognises emails that are *not* new leads — a post-viewing follow-up, a document upload — and creates no duplicate.",
        },
      ],
    },
    {
      id: "agenda",
      icone: "agenda",
      titre: "3. Diary & viewings",
      chapeau: "Online booking · automatic confirmations & reminders",
      intro:
        "Prospects book a viewing online, so the agency stops playing phone tag. Each booking triggers a confirmation, then automatic reminders to cut no-shows.",
      etapes: [
        "In **Diary & viewings**, look through the **upcoming** and **past** viewings, with their status.",
        "To show the booking flow: the **“Public booking pages”** panel → **Open the booking page** for a property, pick a slot and confirm.",
        "The booking appears in the diary and a **confirmation** goes out automatically.",
        "To fire the **1-day and 2-hour reminders**: pick a date close to the booking in the top bar, then click **Run**.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 The “Automatic follow-up” column shows the Confirmation, 1-day and 2-hour reminder badges as the date moves forward.",
        },
      ],
    },
    {
      id: "locations",
      icone: "quittance",
      titre: "4. Lettings & receipts",
      chapeau: "Automatic rent receipts (PDF)",
      intro:
        "Every month, on the rent due date, the receipt is generated as a PDF and sent to the tenant — with nobody lifting a finger. No more forgotten receipts.",
      etapes: [
        "Open **Lettings & receipts**: each lease shows the tenant, the rent plus service charges, and the due day.",
        "Pick a date in the **following month** (after the due day) in the top bar, then click **Run**: the **month's receipt** is generated for every lease concerned.",
        "Click **Download the PDF** to show the real receipt — amount, period, landlord, tenant, property.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 The dashboard's “Receipts this month” counter updates at each due date passed.",
        },
      ],
    },
    {
      id: "mandats",
      icone: "mandat",
      titre: "5. Listings",
      chapeau: "Expiry alert & automatic owner chaser",
      intro:
        "A listing agreement that expires without a chaser is a property lost to a competitor. This area lists every agreement — sole or multiple — with its dates, and **thirty days before expiry** a renewal chaser goes out to the owner automatically.",
      etapes: [
        "Open **Listings**: each row shows the property, the owner, the type of agreement and the **expiry date**.",
        "Spot an agreement close to expiry, then pick a date **within thirty days** of it in the top bar and click **Run**.",
        "The agreement moves to **“To chase”** and the **chaser email to the owner** is sent — visible in the Outbox.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 The chaser is sent **once only** per agreement, however many times you run the clock again.",
        },
      ],
    },
    {
      id: "conformite",
      icone: "conformite",
      titre: "6. Compliance",
      chapeau: "Tracking certificates & statutory deadlines",
      intro:
        "Energy certificate, landlord insurance, lease renewal… every obligation has its deadline. The table colour-codes each one — Upcoming, Imminent, Overdue — and an **internal reminder** fires automatically before the date, at a notice period set per row (thirty days by default).",
      etapes: [
        "Open **Compliance**: each row shows the property, the type of obligation, the deadline and the notice period.",
        "Move the clock inside a deadline's reminder window, then click **Run**.",
        "The status moves to **“Reminded”** and the event appears in the Activity log.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 The notice period is set *per deadline* — the “Rappel (jours avant)” column of the Excel import file.",
        },
      ],
    },
    {
      id: "marketing",
      icone: "marketing",
      titre: "7. Marketing",
      chapeau: "Segmented newsletter · Google reviews · referrals",
      intro:
        "Three retention automations in one place: the **newsletter** that sends each buyer the properties matching their brief, **Google review collection** (requested two days after a signature, nudged on the fifth day), and the **referral request** a month after signing.",
      etapes: [
        "Open **Marketing**: the buyer segments are listed with their criteria — budget, type, areas.",
        "Click **“Send the newsletter”** on a segment: each contact receives *their own* tailored selection of properties.",
        "For reviews: move the clock to **two days** after a signature → Run → the request goes out by email and SMS. At **five days** with no review, a single nudge follows.",
        "Click **“Simulate: review left”** on a transaction to stop the nudge — exactly what real detection would do.",
        "**Thirty days** after signing, the **referral** offer (a €200 voucher) goes out automatically.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 Only contacts who have **opted in to marketing** and have criteria on file receive the newsletter — and never twice in the same week.",
        },
      ],
    },
    {
      id: "journal",
      icone: "journal",
      titre: "8. Activity log",
      chapeau: "The timestamped proof of everything that runs",
      intro:
        "This is the demo's evidence screen: a **timestamped timeline** — in demo time — of every action the automations perform. An email sorted, a reminder sent, a receipt generated, a listing chased… nothing happens out of sight.",
      etapes: [
        "Open **Activity log**: events are listed newest first.",
        "Use the **filter chips** (A1, A2, A4…) to show only one automation's events.",
        "After each click on **Run**, come back here to show exactly what just fired.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 Each event carries the **demo date** on which it happened — not the real date — so the scenario stays coherent.",
        },
      ],
    },
    {
      id: "envoi",
      icone: "envoi",
      titre: "9. Outbox",
      chapeau: "A faithful preview of every message sent",
      intro:
        "Every **SMS, email and PDF** the automations produce, shown **exactly as the client would receive it**: subject, personalised body, attachment. In the demo nothing is really sent — this is the shop window for the finished output.",
      etapes: [
        "Open **Outbox**: the counters at the top separate **emails** from **SMS**.",
        "Filter by automation with the chips (A2 for reminders, A4 for receipts…).",
        "Open a message to show the **exact text** the client receives; receipts offer the attached **PDF download**.",
      ],
      encadres: [
        {
          ton: "note",
          texte:
            "💡 The key argument in a meeting: “this is precisely what your clients receive, and nobody wrote a word of it.”",
        },
      ],
    },
  ],
};
