import { CHEMIN_EN, CHEMIN_FR } from "@/app/presentation/contenu";
import { LANGUE_PAR_DEFAUT, langueValide, type Langue } from "./langue";

/**
 * La langue déclarée par `<html lang>`. Module pur : le proxy le lit sur l'edge.
 *
 * La page de vente a une adresse par langue, et c'est l'adresse qui fait foi —
 * un cookie de démonstration resté sur « en » ne doit pas faire déclarer
 * anglaise la page française. Ailleurs, la démonstration suit le réglage du
 * visiteur, comme son interface.
 */
export const ENTETE_LANGUE_PAGE = "x-keo-langue-page";

export function langueDeLaPage(chemin: string, parametre: string | null, cookie: string | undefined): Langue {
  if (chemin === CHEMIN_EN || chemin.startsWith("/en/")) return "en";
  if (chemin === CHEMIN_FR) return "fr";
  return langueValide(parametre) ?? langueValide(cookie) ?? LANGUE_PAR_DEFAUT;
}
