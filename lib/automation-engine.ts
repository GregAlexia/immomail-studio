import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db/client";
import {
  agencies,
  appointments,
  complianceItems,
  contacts,
  inboxEmails,
  leads,
  leases,
  mandates,
  properties,
  transactions,
  automationRuns,
} from "./db/schema";
type Property = typeof properties.$inferSelect;
type Contact = typeof contacts.$inferSelect;
import { newId, nowIso, recordActivity } from "./services/_shared";
import { sendSms } from "./services/sms.service";
import { sendEmail } from "./services/email.service";
import { classifyEmail } from "./services/inbox.service";
import {
  reviewLink,
  reviewEmailBody,
  reviewSmsBody,
  reviewFollowupBody,
} from "./services/review.service";
import type { AutomationType, BuyerCriteria, RequestType } from "./types";
import {
  addDays,
  addMonths,
  fmtDate,
  fmtDateTime,
  fmtTime,
  eur,
  toISO,
} from "./date";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface EngineEvent {
  type: AutomationType;
  description: string;
}
export interface EngineResult {
  events: EngineEvent[];
  counts: Partial<Record<AutomationType, number>>;
}

const REQUEST_LABEL: Record<RequestType, string> = {
  purchase: "Achat - visite",
  rental: "Location",
  valuation: "Estimation",
};

// Réserve une exécution (idempotence §6.3). true si nouvellement réservée.
// `claimed` contient les run_keys déjà réservées (préchargées en 1 requête
// par agence) : les ré-évaluations ne coûtent AUCUN aller-retour DB pour les
// actions déjà exécutées — c'était le principal poids du bouton « Évaluer »
// en production (latence réseau × dizaines de tentatives redondantes).
// L'INSERT ... ON CONFLICT reste la garantie finale contre les courses.
async function claim(
  agencyId: string,
  type: AutomationType,
  runKey: string,
  refId: string | null | undefined,
  claimed: Set<string>
): Promise<boolean> {
  if (claimed.has(runKey)) return false;
  const inserted = await db
    .insert(automationRuns)
    .values({
      id: newId(),
      agencyId,
      automationType: type,
      refId: refId ?? null,
      runKey,
      executedAt: nowIso(),
      createdAt: nowIso(),
    })
    .onConflictDoNothing({ target: automationRuns.runKey })
    .returning({ id: automationRuns.id });
  claimed.add(runKey); // réservée par nous ou par un run concurrent : plus jamais retentée
  return inserted.length > 0;
}

export async function runEngine(upto: Date, agencyId?: string): Promise<EngineResult> {
  const result: EngineResult = { events: [], counts: {} };
  const push = (type: AutomationType, description: string) => {
    result.events.push({ type, description });
    result.counts[type] = (result.counts[type] ?? 0) + 1;
  };
  const uptoIso = toISO(upto);

  const agencyRows = agencyId
    ? await db.select().from(agencies).where(eq(agencies.id, agencyId))
    : await db.select().from(agencies);

  // Les agences sont indépendantes → traitées en parallèle (latence réseau
  // masquée au lieu d'être additionnée).
  await Promise.all(
    agencyRows.map(async (agency) => {
      const aId = agency.id;
      // 3 allers-retours de préchargement, en parallèle : biens, contacts,
      // et surtout les run_keys déjà exécutées (voir claim()).
      const [props, agencyContacts, runRows] = await Promise.all([
        db.select().from(properties).where(eq(properties.agencyId, aId)),
        db.select().from(contacts).where(eq(contacts.agencyId, aId)),
        db.select({ runKey: automationRuns.runKey }).from(automationRuns).where(eq(automationRuns.agencyId, aId)),
      ]);
      const propById = new Map(props.map((p) => [p.id, p]));
      const propByRef = new Map(props.filter((p) => p.ref).map((p) => [p.ref as string, p]));
      const contactById = new Map(agencyContacts.map((c) => [c.id, c]));
      const claimed = new Set(runRows.map((r) => r.runKey));

      // Les 7 traitements touchent des tables/flags disjoints : parallèle.
      await Promise.all([
        processLeads(aId, agency.name, upto, uptoIso, push, props, propByRef, claimed),
        processAppointments(aId, upto, uptoIso, push, propById, claimed),
        processMandates(aId, upto, uptoIso, push, propById, contactById, claimed),
        processReceipts(aId, agency.name, agency.city ?? "", upto, uptoIso, push, propById, contactById, claimed),
        processCompliance(aId, upto, uptoIso, push, propById, claimed),
        processReviews(aId, agency.name, upto, uptoIso, push, contactById, claimed),
        processReferrals(aId, agency.name, upto, uptoIso, push, contactById, propById, claimed),
      ]);
    })
  );
  return result;
}

// ---------- A9 / A10 / A11 : intake leads ----------
async function processLeads(
  aId: string,
  agencyName: string,
  upto: Date,
  uptoIso: string,
  push: (t: AutomationType, d: string) => void,
  props: Property[],
  propByRef: Map<string, Property>,
  claimed: Set<string>
) {
  const emails = await db
    .select()
    .from(inboxEmails)
    .where(and(eq(inboxEmails.agencyId, aId), eq(inboxEmails.status, "non_traite")));
  if (emails.length === 0) return;

  const negotiators = [...new Set(props.map((p) => p.negotiator).filter(Boolean))] as string[];
  const fallbackNegotiator =
    negotiators.find((n) => n === "Sophie Martin") ?? negotiators.sort()[0] ?? "Accueil agence";
  // Compteur tenu en mémoire : évite de recharger tous les leads de l'agence
  // à chaque nouveau lead (auparavant un SELECT complet par email du lot).
  let leadCount = (await db.select({ id: leads.id }).from(leads).where(eq(leads.agencyId, aId))).length;

  for (const email of emails) {
    if (new Date(email.receivedAt) > upto) continue; // pas encore reçu

    const verdict = classifyEmail({
      senderName: email.senderName,
      senderEmail: email.senderEmail,
      rawSubject: email.rawSubject,
      rawBody: email.rawBody,
      source: email.source,
      parsedPropertyRef: email.parsedPropertyRef,
    });

    if (verdict.category === "spam") {
      if (await claim(aId, "A9", `triage:${email.id}`, email.id, claimed)) {
        await db
          .update(inboxEmails)
          .set({ isSpam: true, status: "spam" })
          .where(eq(inboxEmails.id, email.id));
        await recordActivity({
          agencyId: aId,
          automationType: "A9",
          description: `Spam / démarchage écarté automatiquement : « ${email.rawSubject ?? ""} »`,
          refId: email.id,
          occurredAt: uptoIso,
        });
        push("A9", `Spam écarté : ${email.senderName ?? email.senderEmail}`);
      }
      continue;
    }

    if (verdict.category === "documents") {
      if (await claim(aId, "A9", `triage:${email.id}`, email.id, claimed)) {
        await db
          .update(inboxEmails)
          .set({ status: "pieces_dossier" })
          .where(eq(inboxEmails.id, email.id));
        await recordActivity({
          agencyId: aId,
          automationType: "A9",
          description: `Email classé « pièces de dossier » (rattaché au dossier existant) : ${email.senderName}`,
          refId: email.id,
          occurredAt: uptoIso,
        });
        push("A9", `Pièces de dossier classées : ${email.senderName}`);
      }
      continue;
    }

    if (verdict.category === "visit_followup") {
      if (await claim(aId, "A9", `triage:${email.id}`, email.id, claimed)) {
        await db
          .update(inboxEmails)
          .set({ status: "suivi_visite" })
          .where(eq(inboxEmails.id, email.id));
        await recordActivity({
          agencyId: aId,
          automationType: "A9",
          description: `Email reconnu comme suivi post-visite (pas un nouveau lead) : ${email.senderName}`,
          refId: email.id,
          occurredAt: uptoIso,
        });
        push("A9", `Suivi post-visite classé : ${email.senderName}`);
      }
      continue;
    }

    // ---- Nouveau lead ----
    if (!(await claim(aId, "A9", `triage:${email.id}`, email.id, claimed))) continue;

    const prop = verdict.propertyRef ? propByRef.get(verdict.propertyRef) : undefined;
    const assignedTo = prop?.negotiator ?? fallbackNegotiator;

    // numéro de lead lisible
    const externalId = `LD-${501 + leadCount}`;
    leadCount++;

    const leadId = newId();
    await db.insert(leads).values({
      id: leadId,
      agencyId: aId,
      externalId,
      contactId: null,
      propertyId: prop?.id ?? null,
      sourceEmailId: email.id,
      name: verdict.name,
      email: verdict.email,
      phone: verdict.phone,
      assignedTo,
      requestType: verdict.requestType,
      priority: verdict.priority,
      firstResponseAt: null,
      status: "new",
      createdAt: nowIso(),
    });
    await db
      .update(inboxEmails)
      .set({
        status: "qualifie",
        leadId,
        requestType: verdict.requestType,
        parsedPropertyRef: verdict.propertyRef ?? email.parsedPropertyRef ?? null,
      })
      .where(eq(inboxEmails.id, email.id));

    await recordActivity({
      agencyId: aId,
      automationType: "A9",
      description: `Lead qualifié ${externalId} : ${verdict.name} — ${REQUEST_LABEL[verdict.requestType]}${
        verdict.propertyRef ? ` (${verdict.propertyRef})` : ""
      } → routé vers ${assignedTo}`,
      refId: leadId,
      occurredAt: uptoIso,
    });
    push("A9", `Lead ${externalId} qualifié et routé vers ${assignedTo}`);

    // ---- A11 : création/maj fiche CRM ----
    if (await claim(aId, "A11", `crm:${leadId}`, leadId, claimed)) {
      const [firstName, ...rest] = verdict.name.split(" ");
      const lastName = rest.join(" ") || "—";
      const existingContact = verdict.email
        ? (
            await db
              .select()
              .from(contacts)
              .where(and(eq(contacts.agencyId, aId), eq(contacts.email, verdict.email)))
          )[0]
        : undefined;

      const role =
        verdict.requestType === "rental"
          ? "tenant"
          : verdict.requestType === "valuation"
            ? "owner"
            : "buyer";
      const criteria: BuyerCriteria = prop
        ? {
            budgetMax: prop.price,
            type: prop.type as BuyerCriteria["type"],
            zones: prop.zone ? [prop.zone] : prop.city ? [prop.city] : [],
            minRooms: prop.rooms ?? undefined,
          }
        : {};

      let contactId: string;
      if (existingContact) {
        contactId = existingContact.id;
        await db
          .update(contacts)
          .set({ phone: verdict.phone ?? existingContact.phone })
          .where(eq(contacts.id, contactId));
      } else {
        contactId = newId();
        await db.insert(contacts).values({
          id: contactId,
          agencyId: aId,
          firstName,
          lastName,
          email: verdict.email || null,
          phone: verdict.phone,
          role,
          buyerCriteria: JSON.stringify(criteria),
          consentMarketing: true,
          createdAt: nowIso(),
        });
      }
      await db.update(leads).set({ contactId }).where(eq(leads.id, leadId));
      await recordActivity({
        agencyId: aId,
        automationType: "A11",
        description: `Fiche CRM créée sans ressaisie pour ${verdict.name} (${REQUEST_LABEL[verdict.requestType]})`,
        refId: contactId,
        occurredAt: uptoIso,
      });
      push("A11", `Fiche CRM créée : ${verdict.name}`);
    }

    // ---- A10 : réponse instantanée ----
    if (await claim(aId, "A10", `instant_resp:${leadId}`, leadId, claimed)) {
      const bookingLink = prop ? `/book/${prop.id}` : "/book";
      const propLine = prop
        ? `votre intérêt pour le bien ${prop.ref} — ${prop.title} (${eur(prop.price)}${
            prop.transaction === "rental" ? "/mois" : ""
          })`
        : "votre demande d'estimation";
      const body = `Bonjour ${verdict.name.split(" ")[0]},

Merci pour ${propLine}.
Nous avons bien reçu votre demande et un conseiller (${assignedTo}) vous recontacte très vite.

${
        verdict.requestType === "valuation"
          ? "Pour préparer l'estimation, vous pouvez réserver un créneau ici :"
          : "Pour réserver directement une visite, choisissez votre créneau ici :"
      }
👉 ${bookingLink}

À très vite,
${agencyName}`;

      await sendEmail({
        agencyId: aId,
        toName: verdict.name,
        toEmail: verdict.email || null,
        subject: `Votre demande — ${agencyName}`,
        body,
        automationType: "A10",
        sentAt: uptoIso,
      });
      await db
        .update(leads)
        .set({ firstResponseAt: uptoIso, status: "contacted" })
        .where(eq(leads.id, leadId));
      await recordActivity({
        agencyId: aId,
        automationType: "A10",
        description: `Réponse instantanée envoyée à ${verdict.name} (${fmtDateTime(uptoIso)}) — accusé 24/7`,
        refId: leadId,
        occurredAt: uptoIso,
      });
      push("A10", `Réponse instantanée → ${verdict.name}`);
    }
  }
}

// ---------- A2 : confirmation + rappels ----------
async function processAppointments(
  aId: string,
  upto: Date,
  uptoIso: string,
  push: (t: AutomationType, d: string) => void,
  propById: Map<string, Property>,
  claimed: Set<string>
) {
  const rows = await db.select().from(appointments).where(eq(appointments.agencyId, aId));

  for (const apt of rows) {
    if (["cancelled", "no_show", "done"].includes(apt.status)) continue;
    const prop = apt.propertyId ? propById.get(apt.propertyId) : undefined;
    const where = prop ? `${prop.title}${prop.city ? `, ${prop.city}` : ""}` : "l'agence";
    const name = apt.contactName ?? "client";
    const scheduled = new Date(apt.scheduledAt);

    // Confirmation immédiate
    if (!apt.confirmationSentAt && (await claim(aId, "A2", `confirm:${apt.id}`, apt.id, claimed))) {
      const body = `Bonjour ${name}, votre ${apt.type === "estimation" ? "rendez-vous d'estimation" : "visite"} est confirmé(e) le ${fmtDate(
        apt.scheduledAt
      )} à ${fmtTime(apt.scheduledAt)} (${where}). Répondez STOP pour annuler.`;
      await Promise.all([
        sendSms({ agencyId: aId, toContactId: apt.contactId, toName: name, toPhone: apt.contactPhone, body, automationType: "A2", sentAt: uptoIso }),
        sendEmail({ agencyId: aId, toContactId: apt.contactId, toName: name, toEmail: apt.contactEmail, subject: `Confirmation de votre rendez-vous — ${fmtDate(apt.scheduledAt)}`, body, automationType: "A2", sentAt: uptoIso }),
      ]);
      await db.update(appointments).set({ confirmationSentAt: uptoIso }).where(eq(appointments.id, apt.id));
      await recordActivity({ agencyId: aId, automationType: "A2", description: `Confirmation envoyée à ${name} pour le RDV du ${fmtDateTime(apt.scheduledAt)}`, refId: apt.id, occurredAt: uptoIso });
      push("A2", `Confirmation → ${name}`);
    }

    // Rappel J-1
    const j1 = addDays(scheduled, -1);
    if (!apt.reminderJ1SentAt && upto >= j1 && (await claim(aId, "A2", `reminder_j1:${apt.id}`, apt.id, claimed))) {
      const body = `Rappel : ${name}, votre ${apt.type === "estimation" ? "rendez-vous" : "visite"} a lieu demain à ${fmtTime(apt.scheduledAt)} (${where}). À demain !`;
      await sendSms({ agencyId: aId, toContactId: apt.contactId, toName: name, toPhone: apt.contactPhone, body, automationType: "A2", sentAt: uptoIso });
      await db.update(appointments).set({ reminderJ1SentAt: uptoIso, status: apt.status === "confirmed" || apt.status === "requested" ? "reminded" : apt.status }).where(eq(appointments.id, apt.id));
      await recordActivity({ agencyId: aId, automationType: "A2", description: `Rappel J-1 envoyé à ${name} pour la visite du ${fmtDate(apt.scheduledAt)}`, refId: apt.id, occurredAt: uptoIso });
      push("A2", `Rappel J-1 → ${name}`);
    }

    // Rappel H-2
    const h2 = new Date(scheduled.getTime() - 2 * 3600 * 1000);
    if (!apt.reminderH2SentAt && upto >= h2 && (await claim(aId, "A2", `reminder_h2:${apt.id}`, apt.id, claimed))) {
      const body = `${name}, votre visite est dans 2 h (${fmtTime(apt.scheduledAt)}, ${where}). À tout à l'heure !`;
      await sendSms({ agencyId: aId, toContactId: apt.contactId, toName: name, toPhone: apt.contactPhone, body, automationType: "A2", sentAt: uptoIso });
      await db.update(appointments).set({ reminderH2SentAt: uptoIso }).where(eq(appointments.id, apt.id));
      await recordActivity({ agencyId: aId, automationType: "A2", description: `Rappel H-2 envoyé à ${name} pour la visite de ${fmtTime(apt.scheduledAt)}`, refId: apt.id, occurredAt: uptoIso });
      push("A2", `Rappel H-2 → ${name}`);
    }
  }
}

// ---------- A3 : alerte expiration de mandat ----------
async function processMandates(
  aId: string,
  upto: Date,
  uptoIso: string,
  push: (t: AutomationType, d: string) => void,
  propById: Map<string, Property>,
  ownerById: Map<string, Contact>,
  claimed: Set<string>
) {
  const rows = await db.select().from(mandates).where(and(eq(mandates.agencyId, aId), eq(mandates.status, "active")));

  for (const m of rows) {
    const trigger = addDays(new Date(m.endDate), -30);
    if (upto < trigger) continue;
    if (!(await claim(aId, "A3", `mandate_expiry:${m.id}`, m.id, claimed))) continue;
    const prop = propById.get(m.propertyId);
    const owner = ownerById.get(m.ownerId);
    const ownerName = owner ? `${owner.firstName} ${owner.lastName}` : "le propriétaire";
    const body = `Bonjour ${ownerName},

Votre mandat ${m.type === "exclusive" ? "exclusif" : "simple"} sur le bien ${prop?.title ?? ""} arrive à échéance le ${fmtDate(m.endDate)}.
Nous obtenons d'excellents résultats sur ce secteur et serions ravis de le renouveler avec vous. Pouvons-nous convenir d'un point cette semaine ?

Bien à vous,`;
    await sendEmail({ agencyId: aId, toContactId: owner?.id, toName: ownerName, toEmail: owner?.email, subject: `Renouvellement de votre mandat — échéance ${fmtDate(m.endDate)}`, body, automationType: "A3", sentAt: uptoIso });
    await recordActivity({ agencyId: aId, automationType: "A3", description: `Alerte mandat à relancer : ${prop?.title ?? ""} (échéance ${fmtDate(m.endDate)}) — relance envoyée à ${ownerName}`, refId: m.id, occurredAt: uptoIso });
    push("A3", `Mandat à relancer : ${prop?.title ?? ""}`);
  }
}

// ---------- A4 : quittances de loyer ----------
async function processReceipts(
  aId: string,
  agencyName: string,
  city: string,
  upto: Date,
  uptoIso: string,
  push: (t: AutomationType, d: string) => void,
  propById: Map<string, Property>,
  tenantById: Map<string, Contact>,
  claimed: Set<string>
) {
  const rows = await db.select().from(leases).where(eq(leases.agencyId, aId));

  for (const lease of rows) {
    const start = new Date(lease.startDate);
    const floor = addMonths(upto, -3); // borne : 3 mois d'historique max au départ
    let cursor = new Date(Math.max(start.getTime(), floor.getTime()));
    cursor.setDate(1);
    for (let i = 0; i < 18; i++) {
      const due = new Date(cursor.getFullYear(), cursor.getMonth(), lease.rentDueDay, 9, 0, 0);
      if (due > upto) break;
      if (due >= start) {
        const periodKey = format(due, "yyyy-MM");
        if (await claim(aId, "A4", `receipt:${lease.id}:${periodKey}`, lease.id, claimed)) {
          const prop = propById.get(lease.propertyId);
          const tenant = tenantById.get(lease.tenantId);
          const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName}` : "le locataire";
          const periodLabel = format(due, "MMMM yyyy", { locale: fr });
          const total = lease.monthlyRent + lease.charges;
          const attachmentUrl = `/api/receipt/${lease.id}?period=${periodKey}`;
          const body = `Bonjour ${tenantName},

Veuillez trouver ci-joint votre quittance de loyer pour ${periodLabel} (${prop?.title ?? ""}).
Montant réglé : ${eur(total)} (loyer ${eur(lease.monthlyRent)} + charges ${eur(lease.charges)}).

Cordialement,
${agencyName}`;
          await sendEmail({ agencyId: aId, toContactId: tenant?.id, toName: tenantName, toEmail: tenant?.email, subject: `Quittance de loyer — ${periodLabel}`, body, attachmentUrl, automationType: "A4", sentAt: uptoIso });
          await recordActivity({ agencyId: aId, automationType: "A4", description: `Quittance ${periodLabel} générée (PDF) et envoyée à ${tenantName} — ${eur(total)}`, refId: lease.id, occurredAt: uptoIso });
          push("A4", `Quittance ${periodLabel} → ${tenantName}`);
        }
      }
      cursor = addMonths(cursor, 1);
    }
  }
}

// ---------- A5 : rappel conformité ----------
async function processCompliance(
  aId: string,
  upto: Date,
  uptoIso: string,
  push: (t: AutomationType, d: string) => void,
  propById: Map<string, Property>,
  claimed: Set<string>
) {
  const rows = await db.select().from(complianceItems).where(and(eq(complianceItems.agencyId, aId), eq(complianceItems.status, "pending")));

  for (const item of rows) {
    const trigger = addDays(new Date(item.dueDate), -item.reminderDaysBefore);
    if (upto < trigger) continue;
    if (!(await claim(aId, "A5", `compliance:${item.id}`, item.id, claimed))) continue;
    const prop = propById.get(item.propertyId);
    await db.update(complianceItems).set({ status: "reminded" }).where(eq(complianceItems.id, item.id));
    await recordActivity({ agencyId: aId, automationType: "A5", description: `Échéance conformité « ${item.label} » (${prop?.title ?? ""}) à traiter avant le ${fmtDate(item.dueDate)} — rappel déclenché`, refId: item.id, occurredAt: uptoIso });
    push("A5", `Conformité : ${item.label} (${prop?.title ?? ""})`);
  }
}

// ---------- A7 : avis Google ----------
async function processReviews(
  aId: string,
  agencyName: string,
  upto: Date,
  uptoIso: string,
  push: (t: AutomationType, d: string) => void,
  byId: Map<string, Contact>,
  claimed: Set<string>
) {
  const rows = await db.select().from(transactions).where(eq(transactions.agencyId, aId));
  const link = reviewLink(agencyName);

  for (const t of rows) {
    const client = byId.get(t.contactId);
    if (!client) continue;
    const name = `${client.firstName} ${client.lastName}`;
    const signed = new Date(t.signedDate);

    // J+2 : demande d'avis
    const reqAt = addDays(signed, 2);
    if (!t.reviewRequestedAt && upto >= reqAt && (await claim(aId, "A7", `review_req:${t.id}`, t.id, claimed))) {
      await Promise.all([
        sendEmail({ agencyId: aId, toContactId: client.id, toName: name, toEmail: client.email, subject: `Votre avis compte pour ${agencyName} 🙏`, body: reviewEmailBody(name, agencyName, link), automationType: "A7", sentAt: uptoIso }),
        sendSms({ agencyId: aId, toContactId: client.id, toName: name, toPhone: client.phone, body: reviewSmsBody(name, link), automationType: "A7", sentAt: uptoIso }),
      ]);
      await db.update(transactions).set({ reviewRequestedAt: uptoIso }).where(eq(transactions.id, t.id));
      await recordActivity({ agencyId: aId, automationType: "A7", description: `Demande d'avis Google envoyée à ${name} (J+2 de la signature)`, refId: t.id, occurredAt: uptoIso });
      push("A7", `Demande d'avis → ${name}`);
    }

    // J+5 : relance si pas d'avis déposé
    const followAt = addDays(signed, 5);
    if (t.reviewRequestedAt && !t.reviewCompletedAt && !t.reviewFollowupAt && upto >= followAt && (await claim(aId, "A7", `review_followup:${t.id}`, t.id, claimed))) {
      await sendEmail({ agencyId: aId, toContactId: client.id, toName: name, toEmail: client.email, subject: `Petit rappel — votre avis pour ${agencyName}`, body: reviewFollowupBody(name, agencyName, link), automationType: "A7", sentAt: uptoIso });
      await db.update(transactions).set({ reviewFollowupAt: uptoIso }).where(eq(transactions.id, t.id));
      await recordActivity({ agencyId: aId, automationType: "A7", description: `Relance d'avis (J+5) envoyée à ${name} — pas encore d'avis déposé`, refId: t.id, occurredAt: uptoIso });
      push("A7", `Relance avis → ${name}`);
    }
  }
}

// ---------- A8 : parrainage J+30 ----------
async function processReferrals(
  aId: string,
  agencyName: string,
  upto: Date,
  uptoIso: string,
  push: (t: AutomationType, d: string) => void,
  byId: Map<string, Contact>,
  propById: Map<string, Property>,
  claimed: Set<string>
) {
  const rows = await db.select().from(transactions).where(eq(transactions.agencyId, aId));

  for (const t of rows) {
    const refAt = addMonths(new Date(t.signedDate), 1);
    if (t.referralRequestedAt || upto < refAt) continue;
    if (!(await claim(aId, "A8", `referral:${t.id}`, t.id, claimed))) continue;
    const client = byId.get(t.contactId);
    if (!client) continue;
    const name = `${client.firstName} ${client.lastName}`;
    const prop = propById.get(t.propertyId);
    const body = `Bonjour ${client.firstName},

Cela fait un mois que vous avez ${t.type === "rental" ? "emménagé" : "signé"} pour ${prop?.title ?? "votre bien"} — nous espérons que tout se passe bien !

Si vous connaissez un proche qui souhaite acheter, vendre ou louer, recommandez-nous : pour chaque mise en relation aboutie, nous offrons un bon de 200 €.

Merci de votre confiance,
${agencyName}`;
    await Promise.all([
      sendEmail({ agencyId: aId, toContactId: client.id, toName: name, toEmail: client.email, subject: `Un mois déjà — parrainez vos proches 🎁`, body, automationType: "A8", sentAt: uptoIso }),
      sendSms({ agencyId: aId, toContactId: client.id, toName: name, toPhone: client.phone, body: `${client.firstName}, parrainez un proche chez ${agencyName} et recevez 200 € par mise en relation aboutie ! Merci de votre confiance.`, automationType: "A8", sentAt: uptoIso }),
    ]);
    await db.update(transactions).set({ referralRequestedAt: uptoIso }).where(eq(transactions.id, t.id));
    await recordActivity({ agencyId: aId, automationType: "A8", description: `Demande de parrainage (J+30) envoyée à ${name}`, refId: t.id, occurredAt: uptoIso });
    push("A8", `Parrainage → ${name}`);
  }
}
