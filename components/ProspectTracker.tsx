"use client";

import { useEffect } from "react";
// `track` vit dans l'entrée racine du paquet : l'entrée `/next` n'exporte que
// le composant `<Analytics />`.
import { track } from "@vercel/analytics";

/**
 * Lien de prospection tracé.
 *
 * Un lien de la forme `https://…/?p=artik-m` envoyé à un prospect permet de
 * savoir qu'il a ouvert la démonstration, quand, et quelles pages il a
 * parcourues — le tout dans Vercel Web Analytics, sans cookie, sans adresse IP
 * conservée et sans aucune donnée personnelle : c'est l'étiquette que *nous*
 * avons choisie qui identifie la visite, pas le visiteur.
 *
 * L'alternative — journaliser l'IP et la géolocaliser — donnerait une
 * information moins fiable (les agences sortent souvent derrière une IP
 * partagée) tout en faisant entrer le site dans un traitement de données
 * personnelles, avec l'information et la durée de conservation que cela impose.
 */

const PARAM = "p";
const CLE_SESSION = "keo:prospect-trace";

/** Étiquettes acceptées : minuscules, chiffres et tirets, 60 caractères max. */
const ETIQUETTE_VALIDE = /^[a-z0-9-]{1,60}$/;

export function ProspectTracker() {
  useEffect(() => {
    let brut: string | null = null;
    try {
      brut = new URLSearchParams(window.location.search).get(PARAM);
    } catch {
      return;
    }
    if (!brut) return;

    // Borne d'entrée : le paramètre vient de l'URL, donc du visiteur. Sans
    // liste blanche, n'importe qui pourrait créer une infinité d'étiquettes
    // distinctes et épuiser le quota d'événements du plan.
    const etiquette = brut.trim().toLowerCase();
    if (!ETIQUETTE_VALIDE.test(etiquette)) return;

    // Un seul événement par onglet : sans cette garde, un rechargement ou un
    // retour arrière gonflerait artificiellement le nombre d'ouvertures.
    try {
      if (sessionStorage.getItem(CLE_SESSION) === etiquette) return;
      sessionStorage.setItem(CLE_SESSION, etiquette);
    } catch {
      // Navigation privée ou stockage bloqué : on trace quand même, quitte à
      // compter une ouverture de trop, plutôt que de perdre l'information.
    }

    // `track()` se résume à `window.va?.("event", …)` : tant que le script
    // d'analytics n'est pas chargé, `window.va` est absent et l'événement part
    // dans le vide, **sans la moindre erreur**. Or l'effet de ce composant
    // s'exécute avant celui de `<Analytics />`. On installe donc au préalable
    // la file d'attente documentée par Vercel : le script la vide à son
    // chargement, et l'ordre de montage cesse d'avoir de l'importance.
    const w = window as Window & { vaq?: unknown[][] };
    if (typeof w.va !== "function") {
      w.va = (...args: unknown[]) => {
        (w.vaq = w.vaq ?? []).push(args);
      };
    }

    void track("demo_ouverte", { prospect: etiquette });
  }, []);

  return null;
}
