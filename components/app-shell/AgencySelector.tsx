"use client";

import { useTransition } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { setAgency } from "@/app/actions";

export function AgencySelector({
  agencies,
  selectedId,
}: {
  agencies: { id: string; name: string; city: string | null }[];
  selectedId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="relative flex items-center gap-2">
      <Building2 size={18} className="text-[var(--color-brand)]" />
      <div className="relative">
        <select
          value={selectedId}
          disabled={pending}
          onChange={(e) => {
            const id = e.target.value;
            startTransition(() => setAgency(id));
          }}
          className="appearance-none rounded-lg border border-[var(--color-border)] bg-white py-1.5 pl-3 pr-8 text-sm font-semibold text-[var(--color-ink)] shadow-sm focus:border-[var(--color-brand)] focus:outline-none"
        >
          {agencies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}{a.city ? ` — ${a.city}` : ""}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
      </div>
    </div>
  );
}
