"use client";

import { useState, useTransition } from "react";
import { Check, Lock } from "lucide-react";
import { NAV, LOCKED_KEYS, DEFAULT_KEYS } from "@/components/app-shell/nav-items";
import { saveMenuKeys } from "@/app/actions";
import { cn } from "@/lib/utils";

export function MenuSettingsForm({ initialKeys }: { initialKeys: string[] }) {
  const [keys, setKeys] = useState<Set<string>>(new Set(initialKeys));
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggle = (key: string) => {
    if (LOCKED_KEYS.includes(key)) return;
    setSaved(false);
    setKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = () =>
    startTransition(async () => {
      await saveMenuKeys([...keys]);
      setSaved(true);
    });

  const reset = () => {
    setSaved(false);
    setKeys(new Set(DEFAULT_KEYS));
  };

  return (
    <div>
      <div className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        {NAV.map((item) => {
          const locked = LOCKED_KEYS.includes(item.key);
          const on = keys.has(item.key);
          const Icon = item.icon;
          return (
            <label
              key={item.key}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5",
                locked ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:bg-slate-50"
              )}
            >
              <span className={cn("rounded-lg p-2", on ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-dark)]" : "bg-slate-100 text-slate-400")}>
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium text-[var(--color-ink)]">
                  {item.label}
                  {locked && <Lock size={12} className="text-[var(--color-muted)]" />}
                </span>
                {item.description && (
                  <span className="block truncate text-sm text-[var(--color-muted)]">{item.description}</span>
                )}
              </span>
              <input
                type="checkbox"
                className="peer sr-only"
                checked={on}
                disabled={locked}
                onChange={() => toggle(item.key)}
              />
              <span
                aria-hidden
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                  on ? "bg-[var(--color-brand)]" : "bg-slate-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                    on ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={pending}
          className="rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
        >
          Rétablir les menus par défaut
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
            <Check size={16} /> Enregistré — la navigation est à jour
          </span>
        )}
      </div>
    </div>
  );
}
