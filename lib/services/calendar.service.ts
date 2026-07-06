import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { appointments } from "../db/schema";
import { newId, nowIso } from "./_shared";
import { addDays } from "../date";

// Implémentation MOCKÉE (remplaçable par Calendly / Cal.com).
// Génère des créneaux ouvrés sur les 10 prochains jours à partir de `from`,
// en excluant les créneaux déjà réservés pour ce bien.
const SLOT_HOURS = [10, 11, 14, 16, 18];

export async function listSlots(
  propertyId: string,
  from: Date,
  days = 10
): Promise<string[]> {
  const existing = await db
    .select({ scheduledAt: appointments.scheduledAt })
    .from(appointments)
    .where(eq(appointments.propertyId, propertyId));
  const taken = new Set(existing.map((e) => e.scheduledAt));

  const slots: string[] = [];
  for (let d = 1; d <= days; d++) {
    const day = addDays(from, d);
    const dow = day.getDay();
    if (dow === 0) continue; // pas le dimanche
    for (const h of SLOT_HOURS) {
      const slot = new Date(day);
      slot.setHours(h, 0, 0, 0);
      const iso = slot.toISOString();
      if (!taken.has(iso)) slots.push(iso);
    }
  }
  return slots;
}

export async function createEvent(params: {
  agencyId: string;
  propertyId: string;
  contactName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactId?: string | null;
  scheduledAt: string;
  type?: "visite" | "estimation";
}): Promise<string> {
  const id = newId();
  await db.insert(appointments).values({
    id,
    agencyId: params.agencyId,
    propertyId: params.propertyId,
    contactId: params.contactId ?? null,
    contactName: params.contactName,
    contactEmail: params.contactEmail ?? null,
    contactPhone: params.contactPhone ?? null,
    type: params.type ?? "visite",
    scheduledAt: params.scheduledAt,
    status: "confirmed",
    createdAt: nowIso(),
  });
  return id;
}

export async function isSlotTaken(propertyId: string, iso: string): Promise<boolean> {
  const rows = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(eq(appointments.propertyId, propertyId), eq(appointments.scheduledAt, iso)));
  return rows.length > 0;
}
