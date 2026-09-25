import "server-only";
import { NAV } from "@/components/app-shell/nav-items";
import type { TextesHorloge } from "@/components/app-shell/DemoClockBar";
import type { Traducteur } from "./index";

/**
 * Les intitulés de la coquille, prêts à être passés aux composants clients.
 *
 * Rassemblés ici plutôt que dans le layout : celui-ci décrit une mise en page,
 * et vingt-cinq chaînes au milieu la rendraient illisible.
 */

/** Clé de menu → intitulé traduit. Les composants de navigation n'ont besoin que de ça. */
export function libellesMenus(t: Traducteur): Record<string, string> {
  return Object.fromEntries(NAV.map((item) => [item.key, t(item.label)]));
}

export function textesHorloge(t: Traducteur): TextesHorloge {
  return {
    dateDemo: t("Date de démo :"),
    evaluer: t("Évaluer"),
    evaluerTitre: t("Évaluer les automatisations échues maintenant"),
    reinitialiser: t("Réinitialiser"),
    reinitialiserTitre: t("Réinitialiser la démo"),
    traitement: t("Traitement…"),
    confirmerTitre: t("Confirmer la réinitialisation"),
    confirmerQuestion: t("Réinitialiser la démo ?"),
    confirmerDetail: t(
      "Toutes les données actuelles (leads, rendez-vous, messages, journal) seront remplacées par le jeu de démonstration initial et l'horloge reviendra à sa date de départ."
    ),
    annuler: t("Annuler"),
    verrouTitre: t("Action verrouillée"),
    verrouDetailAvant: t(
      "Cette démo est protégée : l'horloge, la réinitialisation et l'import sont réservés au présentateur. Déverrouillez le mode présentateur dans"
    ),
    verrouLienParametrage: t("Paramétrage"),
    verrouDetailApres: ".",
    fermer: t("Fermer"),
    declencheesTitre: t("Automatisations déclenchées"),
    // Le pluriel n'a pas les mêmes règles d'une langue à l'autre : on traduit
    // la phrase entière dans chaque nombre plutôt que de coller un « s ». Les
    // deux formes traversent, le composant choisit — une fonction, elle, ne
    // franchirait pas la frontière serveur → client.
    declencheeUne: t("automatisation déclenchée"),
    declencheesPlusieurs: t("automatisations déclenchées"),
    aucune: t("Aucune nouvelle automatisation"),
    dejaAJour: t(
      "Tout est déjà à jour pour cette date. Avancez encore l'horloge pour déclencher les échéances suivantes."
    ),
    autresAvant: t("et"),
    autresApres: t("autres — voir le Journal d'activité"),
  };
}
