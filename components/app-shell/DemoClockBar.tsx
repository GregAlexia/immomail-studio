"use client";

import { useState, useTransition } from "react";
import {
  CalendarClock,
  ChevronRight,
  RotateCcw,
  Play,
  X,
  Sparkles,
} from "lucide-react";
import { setClockDate, evaluateNow, resetDemo } from "@/app/actions";
import type { EngineResult } from "@/lib/automation-engine";

export function DemoClockBar({
  currentISO,
  currentLabel,
}: {
  currentISO: string;
  currentLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<EngineResult | null>(null);
  const today = currentISO.slice(0, 10);

  const run = (fn: () => Promise<EngineResult>) =>
    startTransition(async () => {
      const res = await fn();
      setToast(res);
    });

  const Btn = ({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title?: string }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={title}
      className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-sm font-medium text-[var(--color-ink)] shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
    >
      {children}
    </button>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-[var(--color-brand-soft)] px-3 py-1.5 text-[var(--color-brand-dark)]">
          <CalendarClock size={18} className="shrink-0" />
          <span className="text-sm font-semibold">
            <span className="hidden sm:inline">Date de démo : </span>
            {currentLabel}
          </span>
        </div>

        <input
          type="date"
          defaultValue={today}
          min={today}
          disabled={pending}
          onChange={(e) => e.target.value && run(() => setClockDate(e.target.value))}
          className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm shadow-sm focus:border-[var(--color-brand)] focus:outline-none"
        />

        <Btn onClick={() => run(() => evaluateNow())} title="Évaluer les automatisations échues maintenant">
          <Play size={14} /> Évaluer
        </Btn>

        <button
          type="button"
          onClick={() => {
            if (confirm("Réinitialiser la démo (recharger les données seed) ?"))
              startTransition(async () => {
                await resetDemo();
                setToast(null);
              });
          }}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-sm font-medium text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
          title="Réinitialiser la démo"
        >
          <RotateCcw size={14} /> Réinitialiser
        </button>

        {pending && <span className="text-sm text-[var(--color-muted)]">…</span>}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] rounded-xl border border-[var(--color-border)] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <div className="flex items-center gap-2 font-semibold text-[var(--color-ink)]">
              <Sparkles size={18} className="text-[var(--color-brand)]" />
              {toast.events.length > 0
                ? `${toast.events.length} automatisation${toast.events.length > 1 ? "s" : ""} déclenchée${toast.events.length > 1 ? "s" : ""}`
                : "Aucune nouvelle automatisation"}
            </div>
            <button onClick={() => setToast(null)} className="text-[var(--color-muted)] hover:text-[var(--color-ink)]">
              <X size={18} />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto px-4 py-2">
            {toast.events.length === 0 ? (
              <p className="py-3 text-sm text-[var(--color-muted)]">
                Tout est déjà à jour pour cette date. Avancez encore l'horloge pour déclencher les échéances suivantes.
              </p>
            ) : (
              <ul className="space-y-1.5 py-1">
                {toast.events.slice(0, 12).map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 rounded bg-[var(--color-brand-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-brand-dark)]">
                      {e.type}
                    </span>
                    <span className="text-[var(--color-ink)]">{e.description}</span>
                  </li>
                ))}
                {toast.events.length > 12 && (
                  <li className="flex items-center gap-1 pt-1 text-xs text-[var(--color-muted)]">
                    <ChevronRight size={12} /> et {toast.events.length - 12} autre(s) — voir le Journal d'activité
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
