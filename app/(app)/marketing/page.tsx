import { Megaphone, Star, Gift, Send } from "lucide-react";
import { pageContext } from "@/lib/page-context";
import { getSegments, getTransactions, getMessages, propertyMap, contactMap, fullName } from "@/lib/queries";
import { PageHeader, Card, CardHeader, Badge, EmptyState, Table, Th, Td, Tr, AutomationTag } from "@/components/ui";
import { ActionButton } from "@/components/ActionButton";
import { sendNewsletter, markReviewDone } from "@/app/actions";
import { fmtDate } from "@/lib/date";
import type { SegmentCriteria } from "@/lib/types";

export default async function MarketingPage() {
  // `t` est déjà pris par la transaction dans les deux tableaux ci-dessous :
  // le traducteur s'appelle donc `tr` dans ce fichier.
  const { agency, t: tr, langue } = await pageContext();
  const [segments, txs, pm, cm, mA6, mA7, mA8] = await Promise.all([
    getSegments(agency.id),
    getTransactions(agency.id),
    propertyMap(agency.id),
    contactMap(agency.id),
    getMessages(agency.id, "A6"),
    getMessages(agency.id, "A7"),
    getMessages(agency.id, "A8"),
  ]);

  return (
    <>
      <PageHeader
        title={tr("Marketing & fidélisation")}
        description={tr(
          "Réactivez votre portefeuille et votre e-réputation : newsletter segmentée (A6), collecte d'avis Google à J+2 avec relance J+5 (A7), demande de parrainage à J+30 (A8)."
        )}
      />

      {/* A6 */}
      <Card className="mb-6">
        <CardHeader title={tr("Newsletter acheteurs segmentée")} icon={<Megaphone size={18} />} action={<AutomationTag type="A6" />} subtitle={`${mA6.length} ${tr("email(s) envoyé(s)")}`} />
        <div className="divide-y divide-[var(--color-border)]">
          {segments.length === 0 ? (
            <div className="p-5"><EmptyState title={tr("Aucun segment")} /></div>
          ) : (
            segments.map((s) => {
              const c: SegmentCriteria = s.criteria ? JSON.parse(s.criteria) : {};
              return (
                <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">{s.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {tr("Cible :")} {c.type ? tr(c.type) : tr("tous types")} · {c.transaction === "rental" ? tr("location") : tr("vente")}
                      {c.budgetMax ? ` · ≤ ${c.budgetMax.toLocaleString(langue === "en" ? "en-GB" : "fr-FR")} €` : ""}
                      {c.zones?.length ? ` · ${c.zones.join(", ")}` : ""}
                    </p>
                  </div>
                  <ActionButton action={sendNewsletter.bind(null, s.id)}>
                    <Send size={15} /> {tr("Envoyer la newsletter")}
                  </ActionButton>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* A7 */}
        <Card>
          <CardHeader title={tr("Collecte d'avis Google")} icon={<Star size={18} />} action={<AutomationTag type="A7" />} subtitle={`${mA7.length} ${tr("message(s)")}`} />
          {txs.length === 0 ? (
            <div className="p-5"><EmptyState title={tr("Aucune transaction")} /></div>
          ) : (
            <Table head={<><Th>{tr("Client")}</Th><Th>{tr("Signé le")}</Th><Th>{tr("Avis")}</Th><Th></Th></>}>
              {txs.map((t) => {
                const client = cm.get(t.contactId);
                const state = t.reviewCompletedAt ? "done" : t.reviewFollowupAt ? "followup" : t.reviewRequestedAt ? "requested" : "none";
                return (
                  <Tr key={t.id}>
                    <Td>{fullName(client)}</Td>
                    <Td className="text-sm">{fmtDate(t.signedDate, langue)}</Td>
                    <Td>
                      {state === "done" && <Badge tone="green">{tr("Avis déposé ✓")}</Badge>}
                      {state === "followup" && <Badge tone="amber">{tr("Relancé (J+5)")}</Badge>}
                      {state === "requested" && <Badge tone="blue">{tr("Demande envoyée")}</Badge>}
                      {state === "none" && <Badge tone="gray">{tr("À venir (J+2)")}</Badge>}
                    </Td>
                    <Td>
                      {t.reviewRequestedAt && !t.reviewCompletedAt && (
                        <ActionButton variant="outline" action={markReviewDone.bind(null, t.id)}>{tr("Simuler : avis laissé")}</ActionButton>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Table>
          )}
        </Card>

        {/* A8 */}
        <Card>
          <CardHeader title={tr("Demande de parrainage")} icon={<Gift size={18} />} action={<AutomationTag type="A8" />} subtitle={`${mA8.length} ${tr("message(s)")}`} />
          {txs.length === 0 ? (
            <div className="p-5"><EmptyState title={tr("Aucune transaction")} /></div>
          ) : (
            <Table head={<><Th>{tr("Client")}</Th><Th>{tr("Bien")}</Th><Th>{tr("Signé le")}</Th><Th>{tr("Parrainage (J+30)")}</Th></>}>
              {txs.map((t) => {
                const client = cm.get(t.contactId);
                const prop = pm.byId.get(t.propertyId);
                return (
                  <Tr key={t.id}>
                    <Td>{fullName(client)}</Td>
                    <Td className="text-sm">{prop?.ref}</Td>
                    <Td className="text-sm">{fmtDate(t.signedDate, langue)}</Td>
                    <Td>{t.referralRequestedAt ? <Badge tone="green">{tr("Envoyé")}</Badge> : <Badge tone="gray">{tr("À venir")}</Badge>}</Td>
                  </Tr>
                );
              })}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
