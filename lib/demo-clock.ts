import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, ensureSchema } from "./db/client";
import { demoClock } from "./db/schema";
import { toISO } from "./date";

const CLOCK_ID = "global";

// Mémoïsé par requête : le layout et chaque page lisent l'horloge indépendamment
// (via pageContext) — un seul aller-retour DB suffit par rendu.
export const getClock = cache(async (): Promise<{ current: string; initial: string }> => {
  await ensureSchema();
  const rows = await db.select().from(demoClock).where(eq(demoClock.id, CLOCK_ID));
  if (rows.length === 0) {
    // Filet de sécurité si le seed n'a pas tourné : ancre sur maintenant.
    const now = toISO(new Date());
    await db.insert(demoClock).values({
      id: CLOCK_ID,
      currentDate: now,
      initialDate: now,
      createdAt: now,
    });
    return { current: now, initial: now };
  }
  return { current: rows[0].currentDate, initial: rows[0].initialDate };
});

export async function getCurrentDate(): Promise<Date> {
  const { current } = await getClock();
  return new Date(current);
}

export async function setClock(newDate: Date): Promise<void> {
  await ensureSchema();
  await db
    .update(demoClock)
    .set({ currentDate: toISO(newDate) })
    .where(eq(demoClock.id, CLOCK_ID));
}
