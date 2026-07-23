import Link from "next/link";
import { CheckCircle2, Workflow } from "lucide-react";
import { pageContext } from "@/lib/page-context";
import { getActivityCounts } from "@/lib/queries";
import { Card, PageHeader, Badge } from "@/components/ui";
import { AUTOMATIONS, type AutomationType } from "@/lib/types";

// Flux n8n correspondant à chaque automatisation (voir n8n-workflows/).
const N8N_FLOW: Record<AutomationType, { file: string; extra?: string }> = {
  A1: { file: "A1-prise-rdv-webhook.json" },
  A2: { file: "A2-confirmation-rappels-visites.json" },
  A3: { file: "A3-alerte-expiration-mandat.json" },
  A4: { file: "A4-quittances-loyer.json" },
  A5: { file: "A5-rappel-conformite.json" },
  A6: { file: "A6-newsletter-segmentee.json", extra: "A6b-newsletter-webhook.json (envoi à la demande)" },
  A7: { file: "A7-avis-google.json", extra: "A7b-avis-depose-webhook.json (avis déposé)" },
  A8: { file: "A8-parrainage.json" },
  A9: { file: "A9-A10-A11-intake-leads.json" },
  A10: { file: "A9-A10-A11-intake-leads.json" },
  A11: { file: "A9-A10-A11-intake-leads.json" },
};

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
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800">
                      <Workflow size={13} className="mt-0.5 shrink-0" />
                      <span className="min-w-0">
                        <span className="font-semibold">Flux n8n :</span>{" "}
                        <code className="break-all">{N8N_FLOW[a.code].file}</code>
                        {N8N_FLOW[a.code].extra && (
                          <> · <code className="break-all">{N8N_FLOW[a.code].extra}</code></>
                        )}
                      </span>
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

        <Card className="border-violet-200 bg-violet-50 p-4">
          <p className="text-sm text-violet-900">
            💡 Les espaces <strong>Mandats, Conformité et Marketing</strong> sont masqués du menu par défaut :
            activez-les depuis le menu <Link href="/parametres" className="font-semibold underline">Paramétrage</Link> pour
            explorer les sorties de A3, A5, A6, A7 et A8. Le fonctionnement détaillé de chaque flux n8n est décrit
            dans <code>n8n-workflows/GUIDE-DEBUTANT.md</code> (lien app ↔ flux) et <code>REFERENCE-AUTOMATISATIONS.md</code>.
          </p>
        </Card>
      </div>
    </>
  );
}
