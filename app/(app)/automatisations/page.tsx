import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { pageContext } from "@/lib/page-context";
import { getActivityCounts } from "@/lib/queries";
import { Card, PageHeader, Badge } from "@/components/ui";
import { AUTOMATIONS, type AutomationType } from "@/lib/types";

// Page de l'app où l'automatisation produit sa sortie visible.
const DETAIL_HREF: Record<AutomationType, string> = {
  A1: "/agenda", A2: "/agenda",
  A3: "/mandats", A4: "/locations", A5: "/conformite",
  A6: "/marketing", A7: "/marketing", A8: "/marketing",
  A9: "/leads", A10: "/leads", A11: "/leads",
};

const CATEGORIES: { key: string; label: string }[] = [
  { key: "leads", label: "Boîte de réception — acquisition & qualification des leads" },
  { key: "visites", label: "Agenda & visites" },
  { key: "gestion", label: "Gestion — locations, mandats, conformité" },
  { key: "marketing", label: "Marketing & fidélisation" },
];

export default async function AutomationsPage() {
  const { agency } = await pageContext();
  const counts = await getActivityCounts(agency.id);
  const items = Object.values(AUTOMATIONS);

  return (
    <>
      <PageHeader
        title="Automatisations"
        description="Les 11 automatisations de la plateforme, regroupées par espace. Le code (A1…A11) de chaque carte correspond au flux n8n du même nom — voir le dossier n8n-workflows/ et son guide débutant."
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
                      <span className="rounded-md bg-[var(--color-brand-soft)] px-2 py-0.5 font-mono text-sm font-bold text-[var(--color-brand-dark)]">
                        {a.code}
                      </span>
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
                      <Link href={DETAIL_HREF[a.code]} className="text-sm font-medium text-[var(--color-brand-dark)]">Voir le détail →</Link>
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
