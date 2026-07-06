import {
  addDays,
  addMonths,
  addWeeks,
  format,
  parseISO,
  differenceInMinutes,
} from "date-fns";
import { fr } from "date-fns/locale";

// Conversions ISO <-> Date.
// On stocke en ISO "local-naïf" (sans suffixe Z) pour éviter tout décalage de
// fuseau à l'affichage en démo : l'instant écrit est celui qui s'affiche.
export const toISO = (d: Date): string => format(d, "yyyy-MM-dd'T'HH:mm:ss");
export const fromISO = (s: string): Date => parseISO(s);

// Date "jour" YYYY-MM-DD
export const toDay = (d: Date): string => format(d, "yyyy-MM-dd");

export { addDays, addMonths, addWeeks, differenceInMinutes };

// Formats français lisibles à distance
export function fmtDate(s?: string | null): string {
  if (!s) return "—";
  return format(fromISO(s), "d MMMM yyyy", { locale: fr });
}

export function fmtDateTime(s?: string | null): string {
  if (!s) return "—";
  return format(fromISO(s), "d MMM yyyy 'à' HH'h'mm", { locale: fr });
}

export function fmtDayLong(s?: string | null): string {
  if (!s) return "—";
  return format(fromISO(s), "EEEE d MMMM yyyy", { locale: fr });
}

export function fmtTime(s?: string | null): string {
  if (!s) return "—";
  return format(fromISO(s), "HH'h'mm", { locale: fr });
}

// Écart "reçu → répondu" en texte (pour A10)
export function humanGap(fromIso: string, toIsoStr: string): string {
  const mins = differenceInMinutes(fromISO(toIsoStr), fromISO(fromIso));
  if (mins < 1) return "moins d'une minute";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export const eur = (n: number): string =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
