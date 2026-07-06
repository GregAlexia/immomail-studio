import { eq } from "drizzle-orm";
import { MapPin, Home, Ruler, DoorOpen, Zap } from "lucide-react";
import { db, ensureSchema } from "@/lib/db/client";
import { properties, agencies } from "@/lib/db/schema";
import { listSlots } from "@/lib/services/calendar.service";
import { getCurrentDate } from "@/lib/demo-clock";
import { BookingForm, type Slot } from "@/components/BookingForm";
import { eur, fmtDayLong, fmtTime, fromISO } from "@/lib/date";

export const dynamic = "force-dynamic";

const TYPE: Record<string, string> = { apartment: "Appartement", house: "Maison", studio: "Studio", land: "Terrain", commercial: "Local commercial" };

export default async function BookPage({ params }: { params: Promise<{ propertyId: string }> }) {
  await ensureSchema();
  const { propertyId } = await params;
  const prop = (await db.select().from(properties).where(eq(properties.id, propertyId)))[0];

  if (!prop) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-xl font-bold">Bien introuvable</h1>
        <p className="mt-2 text-slate-500">Ce lien de réservation n'est plus valide.</p>
      </div>
    );
  }

  const agency = (await db.select().from(agencies).where(eq(agencies.id, prop.agencyId)))[0];
  const current = await getCurrentDate();
  const slotIsos = await listSlots(prop.id, current, 8);
  const slots: Slot[] = slotIsos.slice(0, 24).map((iso) => ({
    iso,
    dayLabel: fmtDayLong(iso),
    timeLabel: fmtTime(iso),
  }));

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white"><Zap size={16} /></div>
          <span className="font-bold text-[var(--color-ink)]">{agency?.name ?? "Agence"}</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-6 px-6 py-10 lg:grid-cols-2">
        <div>
          <span className="inline-block rounded-full bg-[var(--color-brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-dark)]">
            Réservation de visite en ligne
          </span>
          <h1 className="mt-3 text-2xl font-bold text-[var(--color-ink)]">{prop.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-slate-500"><MapPin size={15} /> {prop.city}{prop.zone ? ` — ${prop.zone}` : ""}</p>
          <p className="mt-4 text-3xl font-bold text-[var(--color-brand-dark)]">{eur(prop.price)}{prop.transaction === "rental" ? " /mois" : ""}</p>
          <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-slate-200 bg-white p-3"><Home size={16} className="mb-1 text-slate-400" />{TYPE[prop.type] ?? prop.type}</div>
            <div className="rounded-lg border border-slate-200 bg-white p-3"><Ruler size={16} className="mb-1 text-slate-400" />{prop.surface ?? "—"} m²</div>
            <div className="rounded-lg border border-slate-200 bg-white p-3"><DoorOpen size={16} className="mb-1 text-slate-400" />{prop.rooms ?? "—"} pièces</div>
          </div>
          <p className="mt-4 text-sm text-slate-500">Réf. {prop.ref} · Négociateur : {prop.negotiator}</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <BookingForm agencyId={prop.agencyId} propertyId={prop.id} slots={slots} />
        </div>
      </main>
    </div>
  );
}
