import { cn } from "@/lib/utils";
import type { AutomationType } from "@/lib/types";
import { AUTOMATIONS } from "@/lib/types";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-[var(--color-brand)]">{icon}</div>}
        <div>
          <h3 className="font-semibold text-[var(--color-ink)]">{title}</h3>
          {subtitle && <p className="text-sm text-[var(--color-muted)]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

type BadgeTone = "brand" | "gray" | "green" | "amber" | "red" | "blue" | "violet";
const toneMap: Record<BadgeTone, string> = {
  brand: "bg-[var(--color-brand-soft)] text-[var(--color-brand-dark)]",
  gray: "bg-slate-100 text-slate-600",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-rose-100 text-rose-700",
  blue: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
};

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", toneMap[tone], className)}>
      {children}
    </span>
  );
}

const categoryTone: Record<string, BadgeTone> = {
  leads: "violet",
  visites: "blue",
  gestion: "amber",
  marketing: "green",
};

export function AutomationTag({ type, withTitle = false }: { type: AutomationType; withTitle?: boolean }) {
  // Les codes "Ax" ne sont pas affichés. Sans titre demandé, aucun badge.
  if (!withTitle) return null;
  const a = AUTOMATIONS[type];
  return <Badge tone={categoryTone[a.category]}>{a.title}</Badge>;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--color-muted)]">{label}</p>
        {icon && <span className={cn("rounded-lg p-1.5", toneMap[tone])}>{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-ink)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>}
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[var(--color-muted)]">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-white/50 px-6 py-12 text-center">
      <p className="font-medium text-[var(--color-ink)]">{title}</p>
      {hint && <p className="mt-1 text-sm text-[var(--color-muted)]">{hint}</p>}
    </div>
  );
}

export function Table({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
            {head}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2.5 font-semibold", className)}>{children}</th>;
}
export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top", className)}>{children}</td>;
}
export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("border-b border-[var(--color-border)] last:border-0", className)}>{children}</tr>;
}
