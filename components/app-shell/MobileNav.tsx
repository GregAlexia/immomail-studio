"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV } from "./nav-items";

// Détection d'hydratation sans effet : false côté serveur, true côté client.
const emptySubscribe = () => () => {};
const useMounted = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

export function MobileNav({ enabledKeys }: { enabledKeys: string[] }) {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const pathname = usePathname();
  const items = NAV.filter((item) => enabledKeys.includes(item.key));

  // Bloque le scroll du body quand le tiroir est ouvert
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-2 py-1.5 text-[var(--color-ink)] shadow-sm"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-brand)] text-white">
          <Zap size={16} />
        </span>
        <span className="font-bold leading-none">ImmoMail</span>
        <Menu size={16} className="text-[var(--color-muted)]" />
      </button>

      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-[var(--color-surface)] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white">
                  <Zap size={18} />
                </div>
                <div>
                  <p className="font-bold leading-tight text-[var(--color-ink)]">ImmoMail</p>
                  <p className="text-xs leading-tight text-[var(--color-muted)]">Studio · démo</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer le menu" className="text-[var(--color-muted)] hover:text-[var(--color-ink)]">
                <X size={22} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
              {items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-dark)]"
                        : "text-[var(--color-muted)] hover:bg-slate-100 hover:text-[var(--color-ink)]"
                    )}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>,
        document.body
      )}
    </div>
  );
}
