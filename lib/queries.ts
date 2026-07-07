import "server-only";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db, ensureSchema } from "./db/client";
import {
  activityLog,
  appointments,
  complianceItems,
  contacts,
  inboxEmails,
  leads,
  leases,
  mandates,
  messages,
  newsletterSegments,
  properties,
  transactions,
} from "./db/schema";
import type { AutomationType } from "./types";

export const getProperties = async (a: string) => {
  await ensureSchema();
  return db.select().from(properties).where(eq(properties.agencyId, a)).orderBy(properties.ref);
};
export const getContacts = (a: string) =>
  db.select().from(contacts).where(eq(contacts.agencyId, a));
export const getInbox = (a: string) =>
  db.select().from(inboxEmails).where(eq(inboxEmails.agencyId, a)).orderBy(inboxEmails.receivedAt);
export const getLeads = (a: string) =>
  db.select().from(leads).where(eq(leads.agencyId, a)).orderBy(desc(leads.createdAt));
export const getAppointments = (a: string) =>
  db.select().from(appointments).where(eq(appointments.agencyId, a)).orderBy(appointments.scheduledAt);
export const getMandates = (a: string) =>
  db.select().from(mandates).where(eq(mandates.agencyId, a)).orderBy(mandates.endDate);
export const getLeases = (a: string) =>
  db.select().from(leases).where(eq(leases.agencyId, a));
export const getCompliance = (a: string) =>
  db.select().from(complianceItems).where(eq(complianceItems.agencyId, a)).orderBy(complianceItems.dueDate);
export const getTransactions = (a: string) =>
  db.select().from(transactions).where(eq(transactions.agencyId, a)).orderBy(desc(transactions.signedDate));
export const getSegments = (a: string) =>
  db.select().from(newsletterSegments).where(eq(newsletterSegments.agencyId, a));

// messages et activity_log sont les seules tables qui grossissent sans borne
// (chaque avancement d'horloge en ajoute) : le filtre par automatisation se
// fait en SQL plutôt qu'en mémoire après chargement complet.
export async function getMessages(a: string, type?: AutomationType) {
  await ensureSchema();
  const where = type
    ? and(eq(messages.agencyId, a), eq(messages.automationType, type))
    : eq(messages.agencyId, a);
  return db.select().from(messages).where(where).orderBy(desc(messages.sentAt));
}

export async function getActivity(a: string, type?: AutomationType) {
  await ensureSchema();
  const where = type
    ? and(eq(activityLog.agencyId, a), eq(activityLog.automationType, type))
    : eq(activityLog.agencyId, a);
  return db.select().from(activityLog).where(where).orderBy(desc(activityLog.occurredAt));
}

// Dernières entrées du journal pour un sous-ensemble d'automatisations
// (tableau de bord) : filtre + limite en SQL au lieu de tout charger.
export async function getRecentActivity(a: string, types: AutomationType[], limit: number) {
  await ensureSchema();
  return db
    .select()
    .from(activityLog)
    .where(and(eq(activityLog.agencyId, a), inArray(activityLog.automationType, types)))
    .orderBy(desc(activityLog.occurredAt))
    .limit(limit);
}

// Nombre de déclenchements par automatisation (page Automatisations) :
// agrégation en SQL, seules les paires (type, total) transitent.
export async function getActivityCounts(a: string): Promise<Record<string, number>> {
  await ensureSchema();
  const rows = await db
    .select({ type: activityLog.automationType, total: count() })
    .from(activityLog)
    .where(eq(activityLog.agencyId, a))
    .groupBy(activityLog.automationType);
  return Object.fromEntries(rows.filter((r) => r.type).map((r) => [r.type as string, r.total]));
}

export async function propertyMap(a: string) {
  const props = await getProperties(a);
  return {
    byId: new Map(props.map((p) => [p.id, p])),
    byRef: new Map(props.filter((p) => p.ref).map((p) => [p.ref as string, p])),
    list: props,
  };
}

export async function contactMap(a: string) {
  const cs = await getContacts(a);
  return new Map(cs.map((c) => [c.id, c]));
}

export const fullName = (c?: { firstName: string; lastName: string } | null) =>
  c ? `${c.firstName} ${c.lastName}` : "—";
