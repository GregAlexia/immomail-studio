import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { pageContext } from "@/lib/page-context";
import { getActivity } from "@/lib/queries";
import { Card, PageHeader, Badge, AutomationTag } from "@/components/ui";
import { AUTOMATIONS, type AutomationType } from "@/lib/types";

// Seules les automatisations des 3 espaces visibles sont présentées.
const ACTIVE: AutomationType[] = ["A9", "A10", "A11", "A1", "A2", "A4"];

const CATEGORIES: { key: string; label: string; href: string }[] = [
  { key: "leads", label: "Boîte de réception — acquisition & qualification des leads", href: "/leads" },
  { key: "visites", label: "Agenda & visites", href: "/agenda" },
  { key: "gestion", label: "Locations & quittances", href: "/locations" },
];

export default async function AutomationsPage() {
  const { agency } = await pageContext();
  const activity = await getActivity(agency.id);
  const counts = activity.reduce<Record<string, number>>((acc, ev) => {
    if (ev.automationType) acc[ev.automationType] = (acc[ev.automationType] ?? 0) + 1;
    return acc;
  }, {});
  const items = ACTIVE.map((code) => AUTOMATIONS[code]);

  return (
    <>
      <PageHeader
        title="Automatisations"
        description="Les automatisations actives sur cette démonstration, regroupées par espace : boîte de réception, agenda & visites, locations & quittances."
      />
      <div className="space-y-8">
        {CATEGORIES.map((cat) => {
          const catItems = items.filter((i) => i.category === cat.key);
          if (catItems.length === 0) return null;
          return (
            <section key={cat.key}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">{cat.label}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {catItems.map((a) => (
                  <Card key={a.code} className="flex flex-col p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <AutomationTag type={a.code as AutomationType} />
                      <Badge tone="green"><CheckCircle2 size={12} /> Active</Badge>
                    </div>
                    <h3 className="font-semibold text-[var(--color-ink)]">{a.title}</h3>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{a.value}</p>
                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <span className="font-semibold">Sortie visible :</span> {a.output}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-[var(--color-muted)]">
                        {counts[a.code] ? `${counts[a.code]} déclenchement(s)` : "En attente de déclenchement"}
                      </span>
                      <Link href={cat.href} className="text-sm font-medium text-[var(--color-brand-dark)]">Voir le détail →</Link>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
