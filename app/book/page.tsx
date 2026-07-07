import Link from "next/link";
import { eq } from "drizzle-orm";
import { Zap, MapPin } from "lucide-react";
import { db, ensureSchema } from "@/lib/db/client";
import { properties } from "@/lib/db/schema";
import { eur } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function BookIndex() {
  await ensureSchema();
  const props = await db.select().from(properties).where(eq(properties.status, "available")).limit(12);
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white"><Zap size={16} /></div>
          <span className="font-bold text-[var(--color-ink)]">Réserver une visite</span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-4 text-xl font-bold text-[var(--color-ink)]">Nos biens disponibles à la visite</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {props.map((p) => (
            <Link key={p.id} href={`/book/${p.id}`} className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm transition hover:shadow-md">
              <p className="font-semibold text-[var(--color-ink)]">{p.title}</p>
              <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin size={13} /> {p.city}</p>
              <p className="mt-2 font-bold text-[var(--color-brand-dark)]">{eur(p.price)}{p.transaction === "rental" ? " /mois" : ""}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
