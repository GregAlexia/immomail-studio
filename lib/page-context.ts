import "server-only";
import { getSelectedAgency, type Agency } from "./agency";
import { getCurrentDate } from "./demo-clock";

export async function pageContext(): Promise<{ agency: Agency; current: Date }> {
  const agency = await getSelectedAgency();
  if (!agency) throw new Error("Aucune agence — lancez `npm run seed`.");
  const current = await getCurrentDate();
  return { agency, current };
}
