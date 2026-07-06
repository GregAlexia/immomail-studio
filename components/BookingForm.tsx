"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CalendarClock } from "lucide-react";
import { bookAppointment } from "@/app/actions";

export interface Slot {
  iso: string;
  dayLabel: string;
  timeLabel: string;
}

export function BookingForm({
  agencyId,
  propertyId,
  slots,
}: {
  agencyId: string;
  propertyId: string;
  slots: Slot[];
}) {
  const [selected, setSelected] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const days = [...new Set(slots.map((s) => s.dayLabel))];

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-2 text-emerald-600" size={32} />
        <p className="font-semibold text-emerald-900">Visite réservée !</p>
        <p className="mt-1 text-sm text-emerald-800">{done}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (!selected) { setError("Choisissez un créneau."); return; }
        start(async () => {
          const res = await bookAppointment({ agencyId, propertyId, slotIso: selected, name, email, phone });
          if (res.ok) setDone(res.message);
          else setError(res.message);
        });
      }}
      className="space-y-5"
    >
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Choisissez un créneau de visite</label>
        {slots.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun créneau disponible pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {days.map((day) => (
              <div key={day}>
                <p className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <CalendarClock size={12} /> {day}
                </p>
                <div className="flex flex-wrap gap-2">
                  {slots.filter((s) => s.dayLabel === day).map((s) => (
                    <button
                      type="button"
                      key={s.iso}
                      onClick={() => setSelected(s.iso)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        selected === s.iso
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-[var(--color-brand)]"
                      }`}
                    >
                      {s.timeLabel}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input required placeholder="Nom complet" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none" />
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none" />
        <input placeholder="Téléphone (optionnel)" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none sm:col-span-2" />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--color-brand)] py-2.5 font-semibold text-white shadow-sm transition hover:bg-[var(--color-brand-dark)] disabled:opacity-50"
      >
        {pending ? "Réservation…" : "Réserver ma visite"}
      </button>
      <p className="text-center text-xs text-slate-400">
        Confirmation immédiate par SMS et email, puis rappels automatiques avant la visite.
      </p>
    </form>
  );
}
