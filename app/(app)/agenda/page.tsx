import Link from "next/link";
import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { pageContext } from "@/lib/page-context";
import { getAppointments, propertyMap } from "@/lib/queries";
import { Card, CardHeader, PageHeader, Badge, EmptyState, Table, Th, Td, Tr } from "@/components/ui";
import { fmtDate, fmtTime, eur, fromISO } from "@/lib/date";

const STATUS: Record<string, { label: string; tone: "gray" | "blue" | "green" | "amber" | "red" }> = {
  requested: { label: "Demandé", tone: "gray" },
  confirmed: { label: "Confirmé", tone: "blue" },
  reminded: { label: "Rappelé", tone: "green" },
  done: { label: "Effectué", tone: "green" },
  no_show: { label: "No-show", tone: "red" },
  cancelled: { label: "Annulé", tone: "red" },
};

export default async function AgendaPage() {
  const { agency, current } = await pageContext();
  const [appointments, pm] = await Promise.all([getAppointments(agency.id), propertyMap(agency.id)]);
  const upcoming = appointments.filter((x) => fromISO(x.scheduledAt) >= current);
  const past = appointments.filter((x) => fromISO(x.scheduledAt) < current);
  const bookable = pm.list.filter((p) => p.status === "available");

  const Row = ({ apt }: { apt: typeof appointments[number] }) => {
    const prop = apt.propertyId ? pm.byId.get(apt.propertyId) : null;
    const st = STATUS[apt.status] ?? STATUS.requested;
    return (
      <Tr>
        <Td>
          <p className="font-medium text-[var(--color-ink)]">{apt.contactName}</p>
          <p className="text-xs text-[var(--color-muted)]">{apt.contactEmail}</p>
        </Td>
        <Td>{apt.type === "estimation" ? <Badge tone="violet">Estimation</Badge> : <span className="text-sm">{prop?.title ?? "—"}</span>}</Td>
        <Td><span className="text-sm">{fmtDate(apt.scheduledAt)} · {fmtTime(apt.scheduledAt)}</span></Td>
        <Td>
          <div className="flex flex-wrap gap-1">
            {apt.confirmationSentAt && <Badge tone="blue">Confirmation</Badge>}
            {apt.reminderJ1SentAt && <Badge tone="green">Rappel J-1</Badge>}
            {apt.reminderH2SentAt && <Badge tone="amber">Rappel H-2</Badge>}
            {!apt.confirmationSentAt && <Badge tone="gray">En attente d'envoi</Badge>}
          </div>
        </Td>
        <Td><Badge tone={st.tone}>{st.label}</Badge></Td>
      </Tr>
    );
  };

  return (
    <>
      <PageHeader
        title="Agenda & visites"
        description="Prise de RDV en ligne (A1) puis confirmation et rappels automatiques par SMS/email à J-1 et H-2 (A2). Avancez l'horloge pour déclencher les rappels."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Visites à venir" icon={<CalendarDays size={18} />} subtitle={`${upcoming.length} RDV`} />
            {upcoming.length === 0 ? (
              <div className="p-5"><EmptyState title="Aucune visite à venir" /></div>
            ) : (
              <Table head={<><Th>Contact</Th><Th>Bien</Th><Th>Date</Th><Th>Suivi automatique</Th><Th>Statut</Th></>}>
                {upcoming.map((apt) => <Row key={apt.id} apt={apt} />)}
              </Table>
            )}
          </Card>

          {past.length > 0 && (
            <Card>
              <CardHeader title="Visites passées" subtitle={`${past.length} RDV`} />
              <Table head={<><Th>Contact</Th><Th>Bien</Th><Th>Date</Th><Th>Suivi automatique</Th><Th>Statut</Th></>}>
                {past.map((apt) => <Row key={apt.id} apt={apt} />)}
              </Table>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader title="Pages de réservation publiques" subtitle="A1 — type Calendly" />
          <div className="divide-y divide-[var(--color-border)]">
            {bookable.slice(0, 8).map((p) => (
              <div key={p.id} className="px-5 py-3">
                <p className="font-medium text-[var(--color-ink)]">{p.title}</p>
                <p className="flex items-center gap-1 text-xs text-[var(--color-muted)]"><MapPin size={12} /> {p.city} · {eur(p.price)}{p.transaction === "rental" ? "/mois" : ""}</p>
                <Link href={`/book/${p.id}`} target="_blank" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand-dark)]">
                  Ouvrir la page de réservation <ExternalLink size={13} />
                </Link>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
