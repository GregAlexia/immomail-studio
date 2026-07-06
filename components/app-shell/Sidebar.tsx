"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white">
          <Zap size={18} />
        </div>
        <div>
          <p className="font-bold leading-tight text-[var(--color-ink)]">ImmoMail</p>
          <p className="text-xs leading-tight text-[var(--color-muted)]">Studio · démo</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-dark)]"
                  : "text-[var(--color-muted)] hover:bg-slate-100 hover:text-[var(--color-ink)]"
              )}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--color-border)] px-5 py-3 text-[10px] text-[var(--color-muted)]">
        Données 100 % fictives · démo commerciale
      </div>
    </aside>
  );
}
