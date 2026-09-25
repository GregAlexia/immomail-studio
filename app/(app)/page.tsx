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
  const { agency, current, t, langue } = await pageContext();
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
        title={`${t("Tableau de bord")} — ${agency.name}`}
        description={t(
          "Vue d'ensemble du jour. Avancez l'horloge de démo (en haut à droite) pour voir les automatisations se déclencher en direct."
        )}
      />

      {pendingInbox.length > 0 && (
        <Link href="/leads" className="mb-6 block">
          <Card className="border-violet-200 bg-violet-50 p-4 transition hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Sparkles className="text-violet-600" />
                <div>
                  <p className="font-semibold text-violet-900">
                    {pendingInbox.length}{" "}
                    {pendingInbox.length > 1
                      ? t("emails non triés dans la boîte commune")
                      : t("email non trié dans la boîte commune")}
                  </p>
                  <p className="text-sm text-violet-700">
                    {t("Cliquez « Évaluer » (ou ouvrez la boîte de réception) pour les trier, créer les fiches CRM et répondre automatiquement.")}
                  </p>
                </div>
              </div>
              <ArrowRight className="text-violet-600" />
            </div>
          </Card>
        </Link>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("Leads qualifiés")} value={leads.length} hint={`${responded} ${t("avec réponse auto")}`} icon={<Inbox size={18} />} tone="violet" />
        <StatCard label={t("Réponses automatiques")} value={responded} hint={t("Boîte de réception")} icon={<MailCheck size={18} />} tone="brand" />
        <StatCard label={t("Visites à venir")} value={upcoming.length} icon={<CalendarDays size={18} />} tone="blue" />
        <StatCard label={t("Quittances du mois")} value={receiptsThisMonth.length} icon={<ReceiptText size={18} />} tone="green" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("Prochaines visites")} icon={<CalendarDays size={18} />} action={<Link href="/agenda" className="text-sm font-medium text-[var(--color-brand-dark)]">{t("Tout voir")}</Link>} />
          <div className="divide-y divide-[var(--color-border)]">
            {upcoming.length === 0 ? (
              <div className="px-5 py-6"><EmptyState title={t("Aucune visite à venir")} /></div>
            ) : (
              upcoming.map((apt) => {
                const prop = apt.propertyId ? pm.byId.get(apt.propertyId) : null;
                return (
                  <div key={apt.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">{apt.contactName}</p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {apt.type === "estimation" ? t("Estimation") : prop?.title ?? t("Bien")} · {fmtDate(apt.scheduledAt, langue)} {t("à")} {fmtTime(apt.scheduledAt, langue)}
                      </p>
                    </div>
                    <Badge tone={apt.reminderJ1SentAt ? "green" : apt.confirmationSentAt ? "blue" : "gray"}>
                      {apt.reminderJ1SentAt ? t("Rappel envoyé") : apt.confirmationSentAt ? t("Confirmé") : t("À confirmer")}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title={t("Leads récents")} subtitle={t("Tri, fiche CRM et réponse automatiques")} icon={<Inbox size={18} />} action={<Link href="/leads" className="text-sm font-medium text-[var(--color-brand-dark)]">{t("Tout voir")}</Link>} />
          <div className="divide-y divide-[var(--color-border)]">
            {leads.length === 0 ? (
              <div className="px-5 py-6"><EmptyState title={t("Aucun lead qualifié pour l'instant")} hint={t("Triez la boîte de réception pour les générer.")} /></div>
            ) : (
              leads.slice(0, 5).map((l) => {
                const prop = l.propertyId ? pm.byId.get(l.propertyId) : null;
                return (
                  <div key={l.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">{l.name} <span className="text-xs font-normal text-[var(--color-muted)]">{l.externalId}</span></p>
                      <p className="text-sm text-[var(--color-muted)]">{prop ? `${prop.ref} · ` : ""}{t("routé vers")} {l.assignedTo}</p>
                    </div>
                    <Badge tone={l.firstResponseAt ? "green" : "amber"}>{l.firstResponseAt ? t("Répondu") : t("En attente")}</Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={t("Dernières automatisations")} icon={<Sparkles size={18} />} action={<Link href="/automatisations" className="text-sm font-medium text-[var(--color-brand-dark)]">{t("Voir les automatisations")}</Link>} />
          <div className="divide-y divide-[var(--color-border)]">
            {activity.length === 0 ? (
              <div className="px-5 py-6"><EmptyState title={t("Aucune automatisation déclenchée")} hint={t("Avancez l'horloge ou cliquez « Évaluer ».")} /></div>
            ) : (
              activity.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 px-5 py-3">
                  {ev.automationType && <AutomationTag type={ev.automationType as AutomationType} />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-ink)]">{ev.description}</p>
                    <p className="text-xs text-[var(--color-muted)]">{fmtDateTime(ev.occurredAt, langue)}</p>
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
