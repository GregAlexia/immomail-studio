"use client";

import { useTransition } from "react";

export function ActionButton({
  action,
  children,
  confirm,
  variant = "primary",
  className,
}: {
  action: () => Promise<unknown>;
  children: React.ReactNode;
  confirm?: string;
  variant?: "primary" | "outline" | "danger";
  className?: string;
}) {
  const [pending, start] = useTransition();
  const styles =
    variant === "primary"
      ? "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)]"
      : variant === "danger"
        ? "border border-[var(--color-border)] bg-white text-rose-600 hover:bg-rose-50"
        : "border border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:bg-slate-50";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(() => action().then(() => undefined));
      }}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50 ${styles} ${className ?? ""}`}
    >
      {pending ? "…" : children}
    </button>
  );
}
