import { Play, ArrowRight, Mail, ShieldX, FileCheck2, RotateCw } from "lucide-react";
import { pageContext } from "@/lib/page-context";
import { getInbox, getLeads, propertyMap } from "@/lib/queries";
import { Card, CardHeader, PageHeader, Badge, EmptyState, Table, Th, Td, Tr, AutomationTag } from "@/components/ui";
import { ActionButton } from "@/components/ActionButton";
import { evaluateNow } from "@/app/actions";
import { fmtDateTime } from "@/lib/date";

const SOURCE: Record<string, string> = {
  seloger: "SeLoger", leboncoin: "Leboncoin", bienici: "Bien'ici", site: "Formulaire site", autre: "Email direct", spam: "Spam",
};
const REQ: Record<string, string> = { purchase: "Achat - visite", rental: "Location", valuation: "Estimation" };
const INBOX_STATUS: Record<string, { label: string; tone: "gray" | "green" | "red" | "blue" | "amber" }> = {
  non_traite: { label: "Non traité", tone: "gray" },
  qualifie: { label: "Lead qualifié ✓", tone: "green" },
  spam: { label: "Spam écarté", tone: "red" },
  suivi_visite: { label: "Suivi post-visite", tone: "blue" },
  pieces_dossier: { label: "Pièces de dossier", tone: "amber" },
};

export default async function LeadsPage() {
  const { agency } = await pageContext();
  const a = agency.id;
  const [inbox, leads, pm] = await Promise.all([getInbox(a), getLeads(a), propertyMap(a)]);
  const pending = inbox.filter((e) => e.status === "non_traite");

  return (
    <>
      <PageHeader
        title="Boîte de réception → Leads qualifiés"
        description="Le « wow » de la démo : chaque email brut des portails est trié, le spam écarté, le lead routé vers le bon négociateur, une fiche CRM créée et une réponse envoyée — automatiquement (A9 · A10 · A11)."
      >
        {pending.length > 0 && (
          <ActionButton action={evaluateNow}>
            <Play size={16} /> Trier les {pending.length} email{pending.length > 1 ? "s" : ""} maintenant
          </ActionButton>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AVANT */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Mail size={18} className="text-[var(--color-muted)]" />
            <h2 className="font-semibold text-[var(--color-ink)]">Avant — emails bruts reçus</h2>
            <Badge tone="gray">{inbox.length}</Badge>
          </div>
          <div className="space-y-3">
            {inbox.map((e) => {
              const st = INBOX_STATUS[e.status] ?? INBOX_STATUS.non_traite;
              return (
                <Card key={e.id} className={`p-4 ${e.status === "spam" ? "opacity-70" : ""}`}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge tone={e.source === "spam" ? "red" : "blue"}>{SOURCE[e.source] ?? e.source}</Badge>
                      <span className="text-xs text-[var(--color-muted)]">{e.externalId}</span>
                    </div>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  <p className="font-medium text-[var(--color-ink)]">{e.rawSubject}</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {e.senderName} · {e.senderEmail} · reçu {fmtDateTime(e.receivedAt)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{e.rawBody}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* APRÈS */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ArrowRight size={18} className="text-[var(--color-brand)]" />
            <h2 className="font-semibold text-[var(--color-ink)]">Après — leads structurés dans le CRM</h2>
            <AutomationTag type="A9" />
            <AutomationTag type="A10" />
            <AutomationTag type="A11" />
          </div>

          {leads.length === 0 ? (
            <EmptyState
              title="Aucun lead pour l'instant"
              hint="Cliquez « Trier les emails maintenant » (ou « Évaluer » en haut) pour lancer la qualification automatique."
            />
          ) : (
            <Card>
              <Table head={<><Th>Lead</Th><Th>Demande</Th><Th>Routage</Th><Th>Réponse auto</Th></>}>
                {leads.map((l) => {
                  const prop = l.propertyId ? pm.byId.get(l.propertyId) : null;
                  return (
                    <Tr key={l.id}>
                      <Td>
                        <p className="font-medium text-[var(--color-ink)]">{l.name}</p>
                        <p className="text-xs text-[var(--color-muted)]">{l.email}</p>
                        <p className="text-xs text-[var(--color-muted)]">{l.phone ?? "Tél. non communiqué"}</p>
                        <span className="text-[10px] font-semibold text-[var(--color-muted)]">{l.externalId}</span>
                      </Td>
                      <Td>
                        <Badge tone="violet">{REQ[l.requestType ?? "purchase"]}</Badge>
                        {prop && <p className="mt-1 text-xs text-[var(--color-muted)]">{prop.ref} — {prop.title}</p>}
                        <p className="mt-1"><Badge tone={l.priority === "haute" ? "red" : "gray"}>Priorité {l.priority}</Badge></p>
                      </Td>
                      <Td><span className="text-sm text-[var(--color-ink)]">{l.assignedTo}</span></Td>
                      <Td>
                        {l.firstResponseAt ? (
                          <Badge tone="green">Envoyée {fmtDateTime(l.firstResponseAt)}</Badge>
                        ) : (
                          <Badge tone="amber">En attente</Badge>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </Table>
            </Card>
          )}

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Card className="p-3">
              <ShieldX className="mx-auto mb-1 text-rose-500" size={18} />
              <p className="text-xs text-[var(--color-muted)]">Spam écarté</p>
              <p className="font-bold">{inbox.filter((e) => e.status === "spam").length}</p>
            </Card>
            <Card className="p-3">
              <FileCheck2 className="mx-auto mb-1 text-emerald-500" size={18} />
              <p className="text-xs text-[var(--color-muted)]">Leads créés</p>
              <p className="font-bold">{leads.length}</p>
            </Card>
            <Card className="p-3">
              <RotateCw className="mx-auto mb-1 text-sky-500" size={18} />
              <p className="text-xs text-[var(--color-muted)]">Réponses auto</p>
              <p className="font-bold">{leads.filter((l) => l.firstResponseAt).length}</p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
