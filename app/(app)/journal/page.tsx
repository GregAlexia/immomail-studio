import Link from "next/link";
import { pageContext } from "@/lib/page-context";
import { getActivity } from "@/lib/queries";
import { Card, PageHeader, EmptyState, AutomationTag } from "@/components/ui";
import { fmtDateTime } from "@/lib/date";
import { AUTOMATIONS, type AutomationType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { agency } = await pageContext();
  const { type } = await searchParams;
  const filter = (type as AutomationType) || undefined;
  const activity = await getActivity(agency.id, filter);
  const codes = Object.keys(AUTOMATIONS) as AutomationType[];

  return (
    <>
      <PageHeader
        title="Journal d'activité"
        description="L'écran clé de la démo : la trace horodatée (date de démo) de tout ce que les automatisations exécutent."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/journal" className={cn("rounded-full px-3 py-1 text-sm font-medium", !filter ? "bg-[var(--color-brand)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-muted)]")}>
          Tout
        </Link>
        {codes.map((c) => (
          <Link key={c} href={`/journal?type=${c}`} className={cn("rounded-full px-3 py-1 text-sm font-medium", filter === c ? "bg-[var(--color-brand)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:bg-slate-50")}>
            {c}
          </Link>
        ))}
      </div>

      {activity.length === 0 ? (
        <EmptyState title="Aucune entrée" hint="Avancez l'horloge de démo ou cliquez « Évaluer » pour déclencher des automatisations." />
      ) : (
        <Card className="p-2">
          <ol className="relative">
            {activity.map((ev) => (
              <li key={ev.id} className="flex gap-4 px-3 py-3">
                <div className="w-36 shrink-0 pt-0.5 text-xs text-[var(--color-muted)]">{fmtDateTime(ev.occurredAt)}</div>
                {ev.automationType && <div className="shrink-0"><AutomationTag type={ev.automationType as AutomationType} /></div>}
                <p className="text-sm text-[var(--color-ink)]">{ev.description}</p>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </>
  );
}
