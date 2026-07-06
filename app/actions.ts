"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { contacts, newsletterSegments, properties, transactions } from "@/lib/db/schema";
import { AGENCY_COOKIE, getSelectedAgency } from "@/lib/agency";
import { getClock, getCurrentDate, setClock } from "@/lib/demo-clock";
import { runEngine, type EngineResult } from "@/lib/automation-engine";
import { createEvent, isSlotTaken } from "@/lib/services/calendar.service";
import { sendEmail } from "@/lib/services/email.service";
import { recordActivity } from "@/lib/services/_shared";
import { addDays, addMonths, eur, toISO } from "@/lib/date";
import { seedDatabase } from "@/lib/seed-data";
import type { SegmentCriteria } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/", "layout");
}

// ---------- Sélection d'agence ----------
export async function setAgency(agencyId: string) {
  const store = await cookies();
  store.set(AGENCY_COOKIE, agencyId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidateAll();
}

// ---------- Horloge de démo (§5) ----------
export async function advanceClock(kind: "day" | "week" | "month"): Promise<EngineResult> {
  const current = await getCurrentDate();
  const next =
    kind === "day" ? addDays(current, 1) : kind === "week" ? addDays(current, 7) : addMonths(current, 1);
  await setClock(next);
  const result = await runEngine(next);
  revalidateAll();
  return result;
}

export async function setClockDate(dateStr: string): Promise<EngineResult> {
  const current = await getCurrentDate();
  // garde-fou : l'horloge ne recule pas en exécutant des effets
  const target = new Date(`${dateStr}T12:00:00`);
  const next = target < current ? current : target;
  await setClock(next);
  const result = await runEngine(next);
  revalidateAll();
  return result;
}

export async function evaluateNow(): Promise<EngineResult> {
  const current = await getCurrentDate();
  const result = await runEngine(current);
  revalidateAll();
  return result;
}

export async function resetDemo(): Promise<void> {
  await seedDatabase();
  revalidateAll();
}

// ---------- A1 : réservation publique ----------
export async function bookAppointment(input: {
  agencyId: string;
  propertyId: string;
  slotIso: string;
  name: string;
  email: string;
  phone?: string;
}): Promise<{ ok: boolean; message: string }> {
  if (!input.name.trim() || !input.email.trim()) {
    return { ok: false, message: "Nom et email requis." };
  }
  if (await isSlotTaken(input.propertyId, input.slotIso)) {
    return { ok: false, message: "Ce créneau vient d'être réservé, choisissez-en un autre." };
  }
  const current = await getCurrentDate();
  await createEvent({
    agencyId: input.agencyId,
    propertyId: input.propertyId,
    contactName: input.name.trim(),
    contactEmail: input.email.trim(),
    contactPhone: input.phone?.trim() || null,
    scheduledAt: input.slotIso,
    type: "visite",
  });
  await recordActivity({
    agencyId: input.agencyId,
    automationType: "A1",
    description: `Nouveau RDV réservé en ligne par ${input.name.trim()} — créneau bloqué automatiquement`,
    occurredAt: toISO(current),
  });
  // Déclenche A2 (confirmation immédiate) via le moteur.
  await runEngine(current, input.agencyId);
  revalidateAll();
  return { ok: true, message: "Votre visite est réservée — confirmation envoyée par SMS et email." };
}

// ---------- A6 : newsletter segmentée ----------
export async function sendNewsletter(segmentId: string): Promise<{ count: number }> {
  const agency = await getSelectedAgency();
  if (!agency) return { count: 0 };
  const current = await getCurrentDate();
  const uptoIso = toISO(current);

  const seg = (await db.select().from(newsletterSegments).where(eq(newsletterSegments.id, segmentId)))[0];
  if (!seg) return { count: 0 };
  const sc: SegmentCriteria = seg.criteria ? JSON.parse(seg.criteria) : {};

  const props = await db.select().from(properties).where(eq(properties.agencyId, agency.id));
  const matchingProps = props.filter(
    (p) =>
      (!sc.transaction || p.transaction === sc.transaction) &&
      (!sc.type || p.type === sc.type) &&
      (!sc.budgetMax || p.price <= sc.budgetMax) &&
      (!sc.zones || sc.zones.length === 0 || (p.zone ? sc.zones.includes(p.zone) : false)) &&
      (p.status === "available")
  );

  const cs = await db.select().from(contacts).where(and(eq(contacts.agencyId, agency.id)));
  const recipients = cs.filter((c) => {
    if (!c.consentMarketing || !c.buyerCriteria) return false;
    const bc: SegmentCriteria = JSON.parse(c.buyerCriteria);
    return !sc.transaction || bc.transaction === sc.transaction;
  });

  let count = 0;
  for (const r of recipients) {
    const bc: SegmentCriteria = JSON.parse(r.buyerCriteria as string);
    const forMe = matchingProps.filter((p) => (!bc.budgetMax || p.price <= bc.budgetMax) && (!bc.type || p.type === bc.type));
    if (forMe.length === 0) continue;
    const list = forMe
      .map((p) => `• ${p.title} — ${eur(p.price)}${p.transaction === "rental" ? "/mois" : ""} (${p.surface ?? "?"} m², ${p.rooms ?? "?"} p.) — réf ${p.ref}`)
      .join("\n");
    const body = `Bonjour ${r.firstName},

${forMe.length} bien${forMe.length > 1 ? "s" : ""} correspondant à votre recherche ${seg.name} :

${list}

Un de ces biens vous intéresse ? Réservez une visite en un clic.

À bientôt,
${agency.name}`;
    await sendEmail({
      agencyId: agency.id,
      toContactId: r.id,
      toName: `${r.firstName} ${r.lastName}`,
      toEmail: r.email,
      subject: `${forMe.length} nouveau${forMe.length > 1 ? "x" : ""} bien${forMe.length > 1 ? "s" : ""} pour vous — ${agency.name}`,
      body,
      automationType: "A6",
      sentAt: uptoIso,
    });
    count++;
  }
  await recordActivity({
    agencyId: agency.id,
    automationType: "A6",
    description: `Newsletter « ${seg.name} » envoyée à ${count} acheteur(s) (${matchingProps.length} bien(s) correspondant)`,
    refId: seg.id,
    occurredAt: uptoIso,
  });
  revalidateAll();
  return { count };
}

// ---------- A7 : simuler le dépôt d'un avis (stoppe la relance) ----------
export async function markReviewDone(transactionId: string): Promise<void> {
  const agency = await getSelectedAgency();
  if (!agency) return;
  const current = await getCurrentDate();
  await db.update(transactions).set({ reviewCompletedAt: toISO(current) }).where(eq(transactions.id, transactionId));
  await recordActivity({
    agencyId: agency.id,
    automationType: "A7",
    description: `Avis Google déposé par le client — relance automatique stoppée`,
    refId: transactionId,
    occurredAt: toISO(current),
  });
  revalidateAll();
}

export async function currentClock() {
  return getClock();
}
