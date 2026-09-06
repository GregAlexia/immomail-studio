import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, ensureSchema } from "./db/client";
import { demoClock } from "./db/schema";
import { getEspaceCourantId } from "./espaces";
import { toISO } from "./date";

// Une horloge par espace : la ligne porte l'identifiant de l'espace. Avant les
// espaces, une seule ligne « global » servait tout le monde — avancer la date
// pendant une démonstration la faisait bouger chez tous les autres, en direct.

// Mémoïsé par requête : le layout et chaque page lisent l'horloge indépendamment
// (via pageContext) — un seul aller-retour DB suffit par rendu.
export const getClock = cache(async (): Promise<{ current: string; initial: string }> => {
  await ensureSchema();
  const espace = await getEspaceCourantId();
  const rows = await db.select().from(demoClock).where(eq(demoClock.id, espace));
  if (rows.length === 0) {
    // Filet de sécurité si le seed n'a pas tourné : ancre sur maintenant.
    const now = toISO(new Date());
    await db
      .insert(demoClock)
      .values({ id: espace, currentDate: now, initialDate: now, createdAt: now })
      .onConflictDoNothing();
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
  const espace = await getEspaceCourantId();
  await db
    .update(demoClock)
    .set({ currentDate: toISO(newDate) })
    .where(eq(demoClock.id, espace));
}
