import { ReceiptText, Paperclip } from "lucide-react";
import { pageContext } from "@/lib/page-context";
import { getLeases, getMessages, propertyMap, contactMap, fullName } from "@/lib/queries";
import { PageHeader, Card, CardHeader, Badge, EmptyState, AutomationTag } from "@/components/ui";
import { eur, fmtDate } from "@/lib/date";

export default async function LocationsPage() {
  const { agency } = await pageContext();
  const [leases, receipts, pm, cm] = await Promise.all([
    getLeases(agency.id),
    getMessages(agency.id, "A4"),
    propertyMap(agency.id),
    contactMap(agency.id),
  ]);

  return (
    <>
      <PageHeader
        title="Locations & quittances"
        description="Chaque mois, au jour d'échéance du loyer, la quittance PDF est générée et envoyée automatiquement au locataire (A4). Avancez l'horloge d'un mois pour en générer une nouvelle."
      >
        <AutomationTag type="A4" withTitle />
      </PageHeader>

      {leases.length === 0 ? (
        <EmptyState title="Aucun bail actif" />
      ) : (
        <div className="space-y-5">
          {leases.map((lease) => {
            const prop = pm.byId.get(lease.propertyId);
            const tenant = cm.get(lease.tenantId);
            const myReceipts = receipts.filter((r) => r.attachmentUrl?.includes(lease.id));
            const total = lease.monthlyRent + lease.charges;
            return (
              <Card key={lease.id}>
                <CardHeader
                  title={prop?.title ?? "Bien loué"}
                  subtitle={`Locataire : ${fullName(tenant)} · Loyer ${eur(lease.monthlyRent)} + ${eur(lease.charges)} de charges = ${eur(total)} / mois · échéance le ${lease.rentDueDay} du mois`}
                  icon={<ReceiptText size={18} />}
                  action={<Badge tone="brand">{myReceipts.length} quittance(s)</Badge>}
                />
                {myReceipts.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-[var(--color-muted)]">Aucune quittance générée pour l'instant.</div>
                ) : (
                  <div className="divide-y divide-[var(--color-border)]">
                    {myReceipts.map((r) => (
                      <div key={r.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-ink)]">{r.subject}</p>
                          <p className="text-xs text-[var(--color-muted)]">Envoyée le {fmtDate(r.sentAt)} à {tenant?.email}</p>
                        </div>
                        {r.attachmentUrl && (
                          <a href={r.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-soft)]">
                            <Paperclip size={14} /> Télécharger le PDF
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
