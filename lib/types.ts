// Types métier partagés (enums SQLite stockés en TEXT, typés ici en unions TS)

export type AutomationType =
  | "A1" | "A2" | "A3" | "A4" | "A5" | "A6"
  | "A7" | "A8" | "A9" | "A10" | "A11";

export type ContactRole = "buyer" | "tenant" | "owner" | "prospect";

export type PropertyType = "apartment" | "house" | "land" | "commercial" | "studio";
export type PropertyTransaction = "sale" | "rental";
export type PropertyStatus = "available" | "under_offer" | "sold" | "rented";

export type MandateType = "exclusive" | "simple";
export type MandateStatus = "active" | "expired" | "renewed";

export type AppointmentType = "visite" | "estimation";
export type AppointmentStatus =
  | "requested" | "confirmed" | "reminded" | "done" | "no_show" | "cancelled";

export type ComplianceType = "dpe" | "pno_insurance" | "lease_renewal" | "other";
export type ComplianceStatus = "pending" | "reminded" | "done";

export type TransactionType = "sale" | "rental";

export type InboxSource = "seloger" | "leboncoin" | "bienici" | "site" | "autre" | "spam";
export type RequestType = "purchase" | "rental" | "valuation";

export type LeadStatus = "new" | "contacted" | "qualified" | "lost";
export type LeadPriority = "haute" | "moyenne" | "basse";

export type MessageChannel = "sms" | "email";

export interface BuyerCriteria {
  budgetMax?: number;
  type?: PropertyType;
  zones?: string[];
  minRooms?: number;
}

export interface SegmentCriteria {
  transaction?: PropertyTransaction;
  type?: PropertyType;
  budgetMax?: number;
  zones?: string[];
  minRooms?: number;
}

// Métadonnées des 11 automatisations (catalogue + libellés)
export const AUTOMATIONS: Record<
  AutomationType,
  { code: AutomationType; title: string; value: string; output: string; category: "leads" | "visites" | "gestion" | "marketing" }
> = {
  A9: { code: "A9", title: "Tri & qualification des leads email", value: "Plus aucun lead perdu dans la boîte commune", output: "Email brut → fiche lead structurée", category: "leads" },
  A10: { code: "A10", title: "Réponse instantanée aux leads", value: "Le premier qui répond décroche l'affaire", output: "Accusé 24/7 + horodatage reçu → répondu", category: "leads" },
  A11: { code: "A11", title: "Création automatique de fiche CRM", value: "Zéro ressaisie, zéro erreur", output: "Fiche contact pré-remplie", category: "leads" },
  A1: { code: "A1", title: "Prise de RDV automatique", value: "Supprime les allers-retours téléphoniques", output: "Page de réservation + RDV dans l'agenda", category: "visites" },
  A2: { code: "A2", title: "Confirmation + rappel SMS des visites", value: "Réduit les no-shows", output: "Aperçus SMS/email (confirmation, J-1, H-2)", category: "visites" },
  A4: { code: "A4", title: "Quittances de loyer automatiques", value: "Gain de temps administratif", output: "Vrai PDF + email mocké", category: "gestion" },
  A3: { code: "A3", title: "Alerte expiration de mandat", value: "Récurrence de business", output: "Widget « Mandats à relancer » + message", category: "gestion" },
  A5: { code: "A5", title: "Rappel diagnostics & échéances", value: "Conformité (DPE, PNO, bail)", output: "Tableau « Conformité » + rappel", category: "gestion" },
  A6: { code: "A6", title: "Newsletter acheteurs segmentée", value: "Réactive le portefeuille", output: "Email « nouveaux biens » + destinataires", category: "marketing" },
  A7: { code: "A7", title: "Collecte automatique d'avis Google", value: "E-réputation", output: "Email/SMS J+2 + relance J+5", category: "marketing" },
  A8: { code: "A8", title: "Demande de parrainage post-transaction", value: "Acquisition la moins chère", output: "Message de recommandation J+30", category: "marketing" },
};
