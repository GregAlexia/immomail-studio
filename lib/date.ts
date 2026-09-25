import {
  addDays,
  addMonths,
  addWeeks,
  format,
  parseISO,
  differenceInMinutes,
} from "date-fns";
import { fr, enGB } from "date-fns/locale";
import type { Langue } from "./i18n/langue";

// Conversions ISO <-> Date.
// On stocke en ISO "local-naïf" (sans suffixe Z) pour éviter tout décalage de
// fuseau à l'affichage en démo : l'instant écrit est celui qui s'affiche.
export const toISO = (d: Date): string => format(d, "yyyy-MM-dd'T'HH:mm:ss");
export const fromISO = (s: string): Date => parseISO(s);

// Date "jour" YYYY-MM-DD
export const toDay = (d: Date): string => format(d, "yyyy-MM-dd");

export { addDays, addMonths, addWeeks, differenceInMinutes };

/**
 * Formats lisibles à distance — en français par défaut.
 *
 * Le paramètre `langue` est **facultatif** à dessein : le moteur
 * d'automatisations et les services produisent des messages destinés aux
 * clients de l'agence, qui restent en français quelle que soit la langue de
 * l'interface. Seuls les écrans passent la langue courante.
 */
const locale = (langue: Langue = "fr") => (langue === "en" ? enGB : fr);

export function fmtDate(s?: string | null, langue?: Langue): string {
  if (!s) return "—";
  return format(fromISO(s), "d MMMM yyyy", { locale: locale(langue) });
}

export function fmtDateTime(s?: string | null, langue?: Langue): string {
  if (!s) return "—";
  return langue === "en"
    ? format(fromISO(s), "d MMM yyyy 'at' HH:mm", { locale: enGB })
    : format(fromISO(s), "d MMM yyyy 'à' HH'h'mm", { locale: fr });
}

export function fmtDayLong(s?: string | null, langue?: Langue): string {
  if (!s) return "—";
  return format(fromISO(s), "EEEE d MMMM yyyy", { locale: locale(langue) });
}

export function fmtTime(s?: string | null, langue?: Langue): string {
  if (!s) return "—";
  // « 14 h 30 » en français, « 14:30 » en anglais : le séparateur horaire n'est
  // pas le même, et date-fns ne le déduit pas de la locale.
  return langue === "en"
    ? format(fromISO(s), "HH:mm", { locale: enGB })
    : format(fromISO(s), "HH'h'mm", { locale: fr });
}

// Écart "reçu → répondu" en texte (pour A10)
export function humanGap(fromIso: string, toIsoStr: string, langue?: Langue): string {
  const mins = differenceInMinutes(fromISO(toIsoStr), fromISO(fromIso));
  const en = langue === "en";
  if (mins < 1) return en ? "under a minute" : "moins d'une minute";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (en) return m ? `${h} hr ${m} min` : `${h} hr`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export const eur = (n: number, langue: Langue = "fr"): string =>
  new Intl.NumberFormat(langue === "en" ? "en-GB" : "fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
