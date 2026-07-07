import Link from "next/link";
import { Inbox, CalendarDays, ReceiptText, ArrowRight, Sparkles, MailCheck } from "lucide-react";
import { pageContext } from "@/lib/page-context";
import {
  getAppointments,
  getInbox,
  getLeads,
  getMessages,
  getRecentActivity,
  propertyMap,
} from "@/lib/queries";
import {
  Card,
  CardHeader,
  StatCard,
  PageHeader,
  Badge,
  AutomationTag,
  EmptyState,
} from "@/components/ui";
import { fmtDate, fmtDateTime, fmtTime, fromISO } from "@/lib/date";
import type { AutomationType } from "@/lib/types";

// Automatisations actives (cohérent avec les menus visibles).
const ACTIVE: AutomationType[] = ["A1", "A2", "A4", "A9", "A10", "A11"];

export default async function DashboardPage() {
  const { agency, current } = await pageContext();
  const a = agency.id;
  const [appointments, leads, inbox, activity, receipts, pm] = await Promise.all([
    getAppointments(a),
    getLeads(a),
    getInbox(a),
    getRecentActivity(a, ACTIVE, 8),
    getMessages(a, "A4"),
    propertyMap(a),
  ]);

  const upcoming = appointments
    .filter((x) => fromISO(x.scheduledAt) >= current && !["cancelled", "done", "no_show"].includes(x.status))
    .slice(0, 5);

  const month = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
  const receiptsThisMonth = receipts.filter((r) => r.sentAt.startsWith(month));
  const pendingInbox = inbox.filter((e) => e.status === "non_traite");
  const responded = leads.filter((l) => l.firstResponseAt).length;

  return (
    <>
      <PageHeader
        title={`Tableau de bord — ${agency.name}`}
        description="Vue d'ensemble du jour. Avancez l'horloge de démo (en haut à droite) pour voir les automatisations se déclencher en direct."
      />

      {pendingInbox.length > 0 && (
        <Link href="/leads" className="mb-6 block">
          <Card className="border-violet-200 bg-violet-50 p-4 transition hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Sparkles className="text-violet-600" />
                <div>
                  <p className="font-semibold text-violet-900">
                    {pendingInbox.length} email{pendingInbox.length > 1 ? "s" : ""} non trié{pendingInbox.length > 1 ? "s" : ""} dans la boîte commune
                  </p>
                  <p className="text-sm text-violet-700">
                    Cliquez « Évaluer » (ou ouvrez la boîte de réception) pour les trier, créer les fiches CRM et répondre automatiquement.
                  </p>
                </div>
              </div>
              <ArrowRight className="text-violet-600" />
            </div>
          </Card>
        </Link>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Leads qualifiés" value={leads.length} hint={`${responded} avec réponse auto`} icon={<Inbox size={18} />} tone="violet" />
        <StatCard label="Réponses automatiques" value={responded} hint="Boîte de réception" icon={<MailCheck size={18} />} tone="brand" />
        <StatCard label="Visites à venir" value={upcoming.length} icon={<CalendarDays size={18} />} tone="blue" />
        <StatCard label="Quittances du mois" value={receiptsThisMonth.length} icon={<ReceiptText size={18} />} tone="green" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Prochaines visites" icon={<CalendarDays size={18} />} action={<Link href="/agenda" className="text-sm font-medium text-[var(--color-brand-dark)]">Tout voir</Link>} />
          <div className="divide-y divide-[var(--color-border)]">
            {upcoming.length === 0 ? (
              <div className="px-5 py-6"><EmptyState title="Aucune visite à venir" /></div>
            ) : (
              upcoming.map((apt) => {
                const prop = apt.propertyId ? pm.byId.get(apt.propertyId) : null;
                return (
                  <div key={apt.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">{apt.contactName}</p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {apt.type === "estimation" ? "Estimation" : prop?.title ?? "Bien"} · {fmtDate(apt.scheduledAt)} à {fmtTime(apt.scheduledAt)}
                      </p>
                    </div>
                    <Badge tone={apt.reminderJ1SentAt ? "green" : apt.confirmationSentAt ? "blue" : "gray"}>
                      {apt.reminderJ1SentAt ? "Rappel envoyé" : apt.confirmationSentAt ? "Confirmé" : "À confirmer"}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Leads récents" subtitle="Tri, fiche CRM et réponse automatiques" icon={<Inbox size={18} />} action={<Link href="/leads" className="text-sm font-medium text-[var(--color-brand-dark)]">Tout voir</Link>} />
          <div className="divide-y divide-[var(--color-border)]">
            {leads.length === 0 ? (
              <div className="px-5 py-6"><EmptyState title="Aucun lead qualifié pour l'instant" hint="Triez la boîte de réception pour les générer." /></div>
            ) : (
              leads.slice(0, 5).map((l) => {
                const prop = l.propertyId ? pm.byId.get(l.propertyId) : null;
                return (
                  <div key={l.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">{l.name} <span className="text-xs font-normal text-[var(--color-muted)]">{l.externalId}</span></p>
                      <p className="text-sm text-[var(--color-muted)]">{prop ? `${prop.ref} · ` : ""}routé vers {l.assignedTo}</p>
                    </div>
                    <Badge tone={l.firstResponseAt ? "green" : "amber"}>{l.firstResponseAt ? "Répondu" : "En attente"}</Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Dernières automatisations" icon={<Sparkles size={18} />} action={<Link href="/automatisations" className="text-sm font-medium text-[var(--color-brand-dark)]">Voir les automatisations</Link>} />
          <div className="divide-y divide-[var(--color-border)]">
            {activity.length === 0 ? (
              <div className="px-5 py-6"><EmptyState title="Aucune automatisation déclenchée" hint="Avancez l'horloge ou cliquez « Évaluer »." /></div>
            ) : (
              activity.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 px-5 py-3">
                  {ev.automationType && <AutomationTag type={ev.automationType as AutomationType} />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-ink)]">{ev.description}</p>
                    <p className="text-xs text-[var(--color-muted)]">{fmtDateTime(ev.occurredAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
