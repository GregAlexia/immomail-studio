import "server-only";
import { recordMessage } from "./_shared";
import type { AutomationType } from "../types";

// Implémentation MOCKÉE. Pour brancher Twilio plus tard : remplacer le corps de
// sendSms par un appel API réel, en conservant la même signature.
export async function sendSms(params: {
  agencyId: string;
  toContactId?: string | null;
  toName?: string | null;
  toPhone?: string | null;
  body: string;
  automationType?: AutomationType | null;
  sentAt: string;
}): Promise<string> {
  return recordMessage({
    agencyId: params.agencyId,
    channel: "sms",
    toContactId: params.toContactId,
    toName: params.toName,
    toAddress: params.toPhone,
    body: params.body,
    automationType: params.automationType,
    sentAt: params.sentAt,
  });
}
