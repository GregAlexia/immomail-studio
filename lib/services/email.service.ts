import "server-only";
import { recordMessage } from "./_shared";
import type { AutomationType } from "../types";

// Implémentation MOCKÉE. Pour brancher Brevo / Gmail / Microsoft 365 plus tard :
// remplacer le corps par un appel API réel, signature inchangée.
export async function sendEmail(params: {
  agencyId: string;
  toContactId?: string | null;
  toName?: string | null;
  toEmail?: string | null;
  subject: string;
  body: string; // texte ou HTML léger
  attachmentUrl?: string | null;
  automationType?: AutomationType | null;
  sentAt: string;
}): Promise<string> {
  return recordMessage({
    agencyId: params.agencyId,
    channel: "email",
    toContactId: params.toContactId,
    toName: params.toName,
    toAddress: params.toEmail,
    subject: params.subject,
    body: params.body,
    attachmentUrl: params.attachmentUrl,
    automationType: params.automationType,
    sentAt: params.sentAt,
  });
}
