import { pageContext } from "@/lib/page-context";
import { getCompliance, propertyMap } from "@/lib/queries";
import { PageHeader, Card, Badge, EmptyState, Table, Th, Td, Tr, AutomationTag } from "@/components/ui";
import { fmtDate, fromISO } from "@/lib/date";

const TYPE_LABEL: Record<string, string> = {
  dpe: "DPE", pno_insurance: "Assurance PNO", lease_renewal: "Renouvellement bail", other: "Autre",
};

export default async function CompliancePage() {
  const { agency, current } = await pageContext();
  const [items, pm] = await Promise.all([getCompliance(agency.id), propertyMap(agency.id)]);

  function statusOf(due: string, reminderDays: number, status: string) {
    if (status === "done") return { label: "Traité", tone: "green" as const };
    const dueT = fromISO(due).getTime();
    const trigger = dueT - reminderDays * 86400000;
    if (current.getTime() > dueT) return { label: "Dépassé", tone: "red" as const };
    if (current.getTime() >= trigger) return { label: "Imminent", tone: "amber" as const };
    return { label: "À venir", tone: "gray" as const };
  }

  return (
    <>
      <PageHeader
        title="Conformité — diagnostics & échéances"
        description="Rappel automatique avant chaque échéance réglementaire (DPE, assurance PNO, renouvellement de bail) selon le délai paramétré (A5)."
      >
        <AutomationTag type="A5" withTitle />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState title="Aucune échéance de conformité" />
      ) : (
        <Card>
          <Table head={<><Th>Bien</Th><Th>Type</Th><Th>Échéance</Th><Th>Rappel</Th><Th>Statut</Th></>}>
            {items.map((c) => {
              const prop = pm.byId.get(c.propertyId);
              const st = statusOf(c.dueDate, c.reminderDaysBefore, c.status);
              const days = Math.round((fromISO(c.dueDate).getTime() - current.getTime()) / 86400000);
              return (
                <Tr key={c.id}>
                  <Td><span className="font-medium text-[var(--color-ink)]">{prop?.title ?? "—"}</span><p className="text-xs text-[var(--color-muted)]">{prop?.ref}</p></Td>
                  <Td>{TYPE_LABEL[c.type] ?? c.type}<p className="text-xs text-[var(--color-muted)]">{c.label}</p></Td>
                  <Td>{fmtDate(c.dueDate)}<p className="text-xs text-[var(--color-muted)]">{days <= 0 ? `Dépassé de ${-days} j` : `Dans ${days} j`}</p></Td>
                  <Td><span className="text-sm text-[var(--color-muted)]">{c.reminderDaysBefore} j avant</span></Td>
                  <Td><Badge tone={st.tone}>{st.label}</Badge>{c.status === "reminded" && <p className="mt-1 text-xs text-[var(--color-brand-dark)]">Rappel envoyé</p>}</Td>
                </Tr>
              );
            })}
          </Table>
        </Card>
      )}
    </>
  );
}
