import "server-only";
import { getSelectedAgency, type Agency } from "./agency";
import { getCurrentDate } from "./demo-clock";
import { getLangue, traducteur, type Traducteur } from "./i18n";
import type { Langue } from "./i18n/langue";

/**
 * Le contexte commun à toutes les pages de l'application.
 *
 * La langue et le traducteur y sont joints plutôt que réclamés page par page :
 * chaque écran appelle déjà cette fonction, et tout ce qu'elle rend est
 * mémoïsé par requête. Une page qui affiche une date a besoin de la langue au
 * même titre que de l'agence.
 */
export async function pageContext(): Promise<{
  agency: Agency;
  current: Date;
  t: Traducteur;
  langue: Langue;
}> {
  const agency = await getSelectedAgency();
  if (!agency) throw new Error("Aucune agence — lancez `npm run seed`.");
  const [current, t, langue] = await Promise.all([getCurrentDate(), traducteur(), getLangue()]);
  return { agency, current, t, langue };
}
