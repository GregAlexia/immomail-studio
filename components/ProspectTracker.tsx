"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
// `track` vit dans l'entrée racine du paquet : l'entrée `/next` n'exporte que
// le composant `<Analytics />`.
import { track } from "@vercel/analytics";

/**
 * Traçage des liens de prospection.
 *
 * Deux étiquettes indépendantes, toutes deux facultatives :
 *
 *   ?p=  l'agence démarchée — répond à « ce prospect a-t-il ouvert la démo ? »
 *   ?c=  le commercial qui a envoyé le lien — répond à « qui l'a placé ? »
 *
 *   https://…/?p=artik&c=greg
 *     → événement `demo_ouverte` { prospect: "artik", commercial: "greg" }
 *
 * Un lien peut ne porter que l'une des deux ; sans aucune, rien n'est émis.
 * Les étiquettes sont choisies par nous, jamais déduites du visiteur : le suivi
 * est nominatif par construction, sans traiter la moindre donnée personnelle.
 */

// Les deux valeurs viennent de l'URL, donc du visiteur. Sans cette borne,
// n'importe qui pourrait forger une infinité d'étiquettes distinctes et épuiser
// le quota d'événements du plan.
const ETIQUETTE_VALIDE = /^[a-z0-9-]{1,60}$/;

const CLE_SESSION = "keo:trace-lien";

function valider(brut: string | null): string | null {
  return brut && ETIQUETTE_VALIDE.test(brut) ? brut : null;
}

export function ProspectTracker() {
  const params = useSearchParams();

  useEffect(() => {
    const prospect = valider(params.get("p"));
    const commercial = valider(params.get("c"));
    if (!prospect && !commercial) return;

    // Un seul événement par couple et par onglet : sans cette garde, un
    // rechargement ou un retour arrière gonflerait le nombre d'ouvertures.
    // La signature inclut les deux étiquettes, pour qu'un même prospect
    // rouvert depuis le lien d'un autre commercial compte bien à nouveau.
    const signature = `${prospect ?? ""}|${commercial ?? ""}`;
    try {
      if (sessionStorage.getItem(CLE_SESSION) === signature) return;
      sessionStorage.setItem(CLE_SESSION, signature);
    } catch {
      // Navigation privée ou stockage bloqué : on trace quand même, quitte à
      // compter une ouverture de trop, plutôt que de perdre l'information.
    }

    // `track()` se résume à `window.va?.("event", …)` : tant que le script
    // d'analytics n'est pas chargé, `window.va` est absent et l'événement part
    // dans le vide, **sans la moindre erreur**. On installe donc au préalable
    // la file d'attente documentée par Vercel : le script la vide à son
    // chargement, et l'ordre de montage cesse d'avoir de l'importance.
    const w = window as Window & { vaq?: unknown[][] };
    if (typeof w.va !== "function") {
      w.va = (...args: unknown[]) => {
        (w.vaq = w.vaq ?? []).push(args);
      };
    }

    const donnees: Record<string, string> = {};
    if (prospect) donnees.prospect = prospect;
    if (commercial) donnees.commercial = commercial;

    void track("demo_ouverte", donnees);
  }, [params]);

  return null;
}
