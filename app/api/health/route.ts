import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

export const dynamic = "force-dynamic";

// Route de santé : vérifie l'accès base et sert de « battement de cœur ».
// Appelée chaque jour par le cron Vercel (vercel.json) pour générer de
// l'activité sur le projet Supabase Free et empêcher sa mise en pause
// automatique (~7 jours d'inactivité) — la cause n°1 de démo indisponible.
export async function GET() {
  const startedAt = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ ok: true, db: true, latencyMs: Date.now() - startedAt });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return Response.json(
      { ok: false, db: false, error: message, latencyMs: Date.now() - startedAt },
      { status: 503 }
    );
  }
}
