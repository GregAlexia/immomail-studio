"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setLangue } from "@/app/actions";
import { cn } from "@/lib/utils";
import type { Langue } from "@/lib/i18n/langue";

/**
 * Bascule FR / EN de la démonstration.
 *
 * Deux boutons plutôt qu'un seul qui alterne : l'état courant est visible sans
 * avoir à cliquer, et l'on sait vers quoi l'on va. Un bouton unique marqué
 * « EN » laisse toujours douter s'il indique la langue affichée ou la suivante.
 */
export function SelecteurLangue({ langue, titre }: { langue: Langue; titre: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-white p-0.5 shadow-sm"
      role="group"
      aria-label={titre}
      title={titre}
    >
      <Languages size={15} className="ml-1.5 shrink-0 text-[var(--color-muted)]" aria-hidden />
      {(["fr", "en"] as const).map((code) => {
        const actif = code === langue;
        return (
          <button
            key={code}
            type="button"
            disabled={pending || actif}
            aria-pressed={actif}
            onClick={() => startTransition(() => setLangue(code))}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-bold uppercase transition",
              actif
                ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-dark)]"
                : "text-[var(--color-muted)] hover:bg-slate-100 hover:text-[var(--color-ink)] disabled:opacity-50"
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
