import { Mail, MessageSquare, Paperclip } from "lucide-react";
import { Card, AutomationTag } from "@/components/ui";
import { fmtDateTime } from "@/lib/date";
import type { AutomationType } from "@/lib/types";
import { getLangue, traducteur } from "@/lib/i18n";

export interface MessageView {
  id: string;
  channel: string;
  toName: string | null;
  toAddress: string | null;
  subject: string | null;
  body: string;
  attachmentUrl: string | null;
  automationType: string | null;
  sentAt: string;
}

export async function MessagePreview({ m }: { m: MessageView }) {
  const isSms = m.channel === "sms";
  // Composant serveur : il lit la langue lui-même. Seule l'enveloppe est
  // traduite — le corps du message, lui, est ce que recevrait un client
  // français de l'agence, et reste tel quel.
  const [t, langue] = await Promise.all([traducteur(), getLangue()]);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          {isSms ? (
            <MessageSquare size={16} className="text-sky-600" />
          ) : (
            <Mail size={16} className="text-[var(--color-brand)]" />
          )}
          <span className="font-semibold text-[var(--color-ink)]">
            {isSms ? "SMS" : "Email"} → {m.toName ?? "—"}
          </span>
          {m.toAddress && <span className="text-[var(--color-muted)]">· {m.toAddress}</span>}
        </div>
        <div className="flex items-center gap-2">
          {m.automationType && <AutomationTag type={m.automationType as AutomationType} />}
          <span className="text-xs text-[var(--color-muted)]">{fmtDateTime(m.sentAt, langue)}</span>
        </div>
      </div>
      <div className="px-4 py-3">
        {m.subject && <p className="mb-1 font-semibold text-[var(--color-ink)]">{m.subject}</p>}
        <p className="whitespace-pre-wrap text-sm text-slate-700">{m.body}</p>
        {m.attachmentUrl && (
          <a
            href={m.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-soft)]"
          >
            <Paperclip size={14} /> {t("Voir la quittance (PDF)")}
          </a>
        )}
      </div>
    </Card>
  );
}
