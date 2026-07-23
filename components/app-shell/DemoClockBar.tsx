"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  CalendarClock,
  ChevronRight,
  RotateCcw,
  Play,
  X,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { setClockDate, evaluateNow, resetDemo, type ClockResult } from "@/app/actions";
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
  const [locked, setLocked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const today = currentISO.slice(0, 10);

  useEffect(() => { setMounted(true); }, []);

  // Fermeture au clavier (Échap)
  useEffect(() => {
    if (!toast && !locked) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setToast(null); setLocked(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toast, locked]);

  const run = (fn: () => Promise<ClockResult>) =>
    startTransition(async () => {
      const res = await fn();
      if (res.denied) { setLocked(true); return; }
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
                const r = await resetDemo();
                if (r?.denied) { setLocked(true); return; }
                setToast(null);
              });
          }}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-sm font-medium text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
          title="Réinitialiser la démo"
        >
          <RotateCcw size={14} /> <span className="hidden sm:inline">Réinitialiser</span>
        </button>

        {pending && <span className="text-sm text-[var(--color-muted)]">…</span>}
      </div>

      {mounted && locked && createPortal(
        <>
          <div className="fixed inset-0 z-[70] bg-slate-900/40 sm:hidden" onClick={() => setLocked(false)} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Action verrouillée"
            className="fixed inset-x-0 bottom-0 z-[71] flex flex-col rounded-t-2xl border border-amber-200 bg-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96 sm:rounded-xl"
          >
            <div className="flex items-start gap-3 px-4 py-4">
              <span className="rounded-lg bg-amber-100 p-2 text-amber-700"><Lock size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--color-ink)]">Action verrouillée</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Cette démo est protégée : l'horloge, la réinitialisation et l'import sont réservés au présentateur.
                  Déverrouillez le mode présentateur dans{" "}
                  <Link href="/parametres" className="font-medium text-[var(--color-brand-dark)] underline" onClick={() => setLocked(false)}>
                    Paramétrage
                  </Link>.
                </p>
              </div>
            </div>
            <div className="border-t border-[var(--color-border)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setLocked(false)}
                className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
              >
                Fermer
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {mounted && toast && createPortal(
        // Mobile : bottom sheet pleine largeur avec fond assombri.
        // Desktop (sm+) : carte flottante en bas à droite, sans fond.
        <>
          <div
            className="fixed inset-0 z-[70] bg-slate-900/40 sm:hidden"
            onClick={() => setToast(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Automatisations déclenchées"
            className="fixed inset-x-0 bottom-0 z-[71] flex max-h-[75dvh] flex-col rounded-t-2xl border border-[var(--color-border)] bg-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96 sm:max-h-[70vh] sm:rounded-xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2 font-semibold text-[var(--color-ink)]">
                <Sparkles size={18} className="shrink-0 text-[var(--color-brand)]" />
                <span className="truncate">
                  {toast.events.length > 0
                    ? `${toast.events.length} automatisation${toast.events.length > 1 ? "s" : ""} déclenchée${toast.events.length > 1 ? "s" : ""}`
                    : "Aucune nouvelle automatisation"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Fermer"
                className="-m-2 shrink-0 rounded-lg p-2 text-[var(--color-muted)] transition hover:bg-slate-100 hover:text-[var(--color-ink)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
              {toast.events.length === 0 ? (
                <p className="py-3 text-sm text-[var(--color-muted)]">
                  Tout est déjà à jour pour cette date. Avancez encore l'horloge pour déclencher les échéances suivantes.
                </p>
              ) : (
                <ul className="space-y-2 py-1">
                  {toast.events.slice(0, 12).map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                      <span className="mt-0.5 shrink-0 rounded bg-[var(--color-brand-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-brand-dark)]">
                        {e.type}
                      </span>
                      <span className="min-w-0 text-[var(--color-ink)]">{e.description}</span>
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

            <div className="border-t border-[var(--color-border)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setToast(null)}
                className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
              >
                Fermer
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
