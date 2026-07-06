import Link from "next/link";
import { pageContext } from "@/lib/page-context";
import { getMessages } from "@/lib/queries";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { MessagePreview } from "@/components/MessagePreview";
import { AUTOMATIONS, type AutomationType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { agency } = await pageContext();
  const { type } = await searchParams;
  const filter = (type as AutomationType) || undefined;
  const messages = await getMessages(agency.id, filter);
  const codes = Object.keys(AUTOMATIONS) as AutomationType[];

  const sms = messages.filter((m) => m.channel === "sms").length;
  const emails = messages.filter((m) => m.channel === "email").length;

  return (
    <>
      <PageHeader
        title="Boîte d'envoi"
        description="Tous les SMS, emails et PDF générés par les automatisations — avec un aperçu fidèle à ce que recevrait le client. (Envois simulés : aucune API réelle.)"
      >
        <div className="flex gap-2">
          <Badge tone="brand">{emails} emails</Badge>
          <Badge tone="blue">{sms} SMS</Badge>
        </div>
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/messages" className={cn("rounded-full px-3 py-1 text-sm font-medium", !filter ? "bg-[var(--color-brand)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-muted)]")}>
          Tout
        </Link>
        {codes.map((c) => (
          <Link key={c} href={`/messages?type=${c}`} className={cn("rounded-full px-3 py-1 text-sm font-medium", filter === c ? "bg-[var(--color-brand)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:bg-slate-50")}>
            {c}
          </Link>
        ))}
      </div>

      {messages.length === 0 ? (
        <EmptyState title="Aucun message envoyé" hint="Déclenchez des automatisations (horloge / Évaluer) pour générer des messages." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {messages.map((m) => (
            <MessagePreview key={m.id} m={m} />
          ))}
        </div>
      )}
    </>
  );
}
