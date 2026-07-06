import type { RequestType } from "../types";

export interface RawInboxEmail {
  senderName?: string | null;
  senderEmail?: string | null;
  rawSubject?: string | null;
  rawBody?: string | null;
  source: string;
  parsedPropertyRef?: string | null;
}

export type InboxClassification =
  | { category: "spam" }
  | { category: "visit_followup"; propertyRef?: string }
  | { category: "documents"; propertyRef?: string }
  | {
      category: "lead";
      name: string;
      email: string;
      phone: string | null;
      requestType: RequestType;
      propertyRef?: string;
      priority: "haute" | "moyenne" | "basse";
    };

const norm = (s?: string | null) => (s ?? "").toLowerCase();

function extractPhone(body: string): string | null {
  const m = body.match(/0[1-9](?:[ . ]?\d{2}){4}/);
  return m ? m[0].replace(/[. ]/g, " ").replace(/\s+/g, " ").trim() : null;
}

function extractRef(email: RawInboxEmail): string | undefined {
  if (email.parsedPropertyRef) return email.parsedPropertyRef;
  const hay = `${email.rawSubject ?? ""} ${email.rawBody ?? ""}`;
  const m = hay.match(/REF-\d{3,}/i);
  return m ? m[0].toUpperCase() : undefined;
}

function detectRequestType(text: string): RequestType {
  if (/estim|estimer|estimation|valeur de mon|vendre mon|faire évaluer/.test(text))
    return "valuation";
  if (/location|louer|loyer|t\d à \d|€\/mois|libre\s*\?|cdi|locataire/.test(text))
    return "rental";
  return "purchase";
}

// Cœur de la qualification automatique (A9). Implémentation MOCKÉE : remplaçable
// par un vrai parseur Gmail/IMAP + LLM sans changer la signature.
export function classifyEmail(email: RawInboxEmail): InboxClassification {
  const subject = norm(email.rawSubject);
  const body = norm(email.rawBody);
  const text = `${subject} ${body}`;
  const ref = extractRef(email);

  // 1) Spam / démarchage
  const spamSignals = [
    email.source === "spam",
    /partenaire-pub|noreply@.*pub|boostez vos annonces|-50%|abonnement publicitaire|promo/.test(
      `${norm(email.senderEmail)} ${text}`
    ),
  ];
  if (spamSignals.some(Boolean)) return { category: "spam" };

  // 2) Soumission de pièces pour un dossier existant
  if (
    /pièce jointe|ci-joint|fiche de paie|avis d'imposition|justificatif|mon dossier|pièces du dossier|manque-t-il/.test(
      text
    )
  ) {
    return { category: "documents", propertyRef: ref };
  }

  // 3) Suivi après une visite déjà réalisée (pas un nouveau lead)
  if (
    subject.startsWith("re:") ||
    /merci pour la visite|suite à (la|notre) visite|visite d'hier|je réfléchis|je vous redis/.test(
      text
    )
  ) {
    return { category: "visit_followup", propertyRef: ref };
  }

  // 4) Nouveau lead qualifié
  const requestType = detectRequestType(text);
  const phone = extractPhone(email.rawBody ?? "");
  const priority: "haute" | "moyenne" | "basse" =
    requestType === "valuation" ? "moyenne" : "haute";

  return {
    category: "lead",
    name: (email.senderName ?? "Contact inconnu").trim(),
    email: (email.senderEmail ?? "").trim(),
    phone,
    requestType,
    propertyRef: ref,
    priority,
  };
}
