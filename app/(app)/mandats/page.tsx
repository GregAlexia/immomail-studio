import { pageContext } from "@/lib/page-context";
import { getMandates, getActivity, propertyMap, contactMap, fullName } from "@/lib/queries";
import { PageHeader, Card, Badge, EmptyState, Table, Th, Td, Tr, AutomationTag } from "@/components/ui";
import { fmtDate, fromISO } from "@/lib/date";

export default async function MandatesPage() {
  const { agency, current } = await pageContext();
  const [mandates, activity, pm, cm] = await Promise.all([
    getMandates(agency.id),
    getActivity(agency.id, "A3"),
    propertyMap(agency.id),
    contactMap(agency.id),
  ]);
  const relaunched = new Set(activity.map((e) => e.refId));

  return (
    <>
      <PageHeader
        title="Mandats"
        description="Alerte automatique avant l'échéance d'un mandat (30 jours), avec relance pré-rédigée au propriétaire — pour ne jamais perdre un renouvellement (A3)."
      >
        <AutomationTag type="A3" withTitle />
      </PageHeader>

      {mandates.length === 0 ? (
        <EmptyState title="Aucun mandat" />
      ) : (
        <Card>
          <Table head={<><Th>Bien</Th><Th>Propriétaire</Th><Th>Type</Th><Th>Échéance</Th><Th>Statut</Th><Th>Relance auto</Th></>}>
            {mandates.map((m) => {
              const prop = pm.byId.get(m.propertyId);
              const owner = cm.get(m.ownerId);
              const days = Math.round((fromISO(m.endDate).getTime() - current.getTime()) / 86400000);
              return (
                <Tr key={m.id}>
                  <Td><span className="font-medium text-[var(--color-ink)]">{prop?.title ?? "—"}</span><p className="text-xs text-[var(--color-muted)]">{prop?.ref}</p></Td>
                  <Td>{fullName(owner)}<p className="text-xs text-[var(--color-muted)]">{owner?.email}</p></Td>
                  <Td><Badge tone="gray">{m.type === "exclusive" ? "Exclusif" : "Simple"}</Badge></Td>
                  <Td>
                    {fmtDate(m.endDate)}
                    <p className={`text-xs ${days <= 0 ? "text-rose-600" : days <= 30 ? "text-amber-600" : "text-[var(--color-muted)]"}`}>
                      {days <= 0 ? `Expiré depuis ${-days} j` : `Dans ${days} j`}
                    </p>
                  </Td>
                  <Td><Badge tone={m.status === "active" ? "green" : "gray"}>{m.status === "active" ? "Actif" : m.status}</Badge></Td>
                  <Td>{relaunched.has(m.id) ? <Badge tone="brand">Relance envoyée</Badge> : <Badge tone="gray">—</Badge>}</Td>
                </Tr>
              );
            })}
          </Table>
        </Card>
      )}
    </>
  );
}
