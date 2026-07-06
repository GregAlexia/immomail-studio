import "server-only";
import { db } from "../db/client";
import { messages, activityLog } from "../db/schema";
import { toISO } from "../date";
import type { AutomationType, MessageChannel } from "../types";

export const newId = (): string => crypto.randomUUID();
export const nowIso = (): string => toISO(new Date());

// Enregistre un "envoi" mocké comme message consultable (aperçu fidèle).
export async function recordMessage(m: {
  agencyId: string;
  channel: MessageChannel;
  toContactId?: string | null;
  toName?: string | null;
  toAddress?: string | null;
  subject?: string | null;
  body: string;
  attachmentUrl?: string | null;
  automationType?: AutomationType | null;
  sentAt: string; // date de démo
}): Promise<string> {
  const id = newId();
  await db.insert(messages).values({
    id,
    agencyId: m.agencyId,
    channel: m.channel,
    toContactId: m.toContactId ?? null,
    toName: m.toName ?? null,
    toAddress: m.toAddress ?? null,
    subject: m.subject ?? null,
    body: m.body,
    attachmentUrl: m.attachmentUrl ?? null,
    automationType: m.automationType ?? null,
    sentAt: m.sentAt,
    createdAt: nowIso(),
  });
  return id;
}

// Journal central (§7 activity_log).
export async function recordActivity(a: {
  agencyId: string;
  automationType: AutomationType;
  description: string;
  refId?: string | null;
  occurredAt: string; // date de démo
}): Promise<void> {
  await db.insert(activityLog).values({
    id: newId(),
    agencyId: a.agencyId,
    automationType: a.automationType,
    description: a.description,
    refId: a.refId ?? null,
    occurredAt: a.occurredAt,
    createdAt: nowIso(),
  });
}
