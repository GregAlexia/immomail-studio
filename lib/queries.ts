import "server-only";
import { and, desc, eq } from "drizzle-orm";
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

export async function getMessages(a: string, type?: AutomationType) {
  await ensureSchema();
  const rows = await db.select().from(messages).where(eq(messages.agencyId, a)).orderBy(desc(messages.sentAt));
  return type ? rows.filter((m) => m.automationType === type) : rows;
}

export async function getActivity(a: string, type?: AutomationType) {
  await ensureSchema();
  const rows = await db.select().from(activityLog).where(eq(activityLog.agencyId, a)).orderBy(desc(activityLog.occurredAt));
  return type ? rows.filter((m) => m.automationType === type) : rows;
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
