"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Mesure d'audience maison.
 *
 * Vercel Web Analytics reste en place — il donne les grands nombres dans son
 * propre tableau de bord — mais il ne se **lit** pas : le plan Hobby n'expose
 * aucune API. Ce composant journalise donc chaque ouverture dans notre base,
 * pour que la console d'administration ait de quoi afficher.
 *
 * La localisation n'est pas calculée ici : c'est la route qui lit les en-têtes
 * posés par Vercel, côté serveur, sans jamais toucher à l'adresse IP.
 */
export function JournalAudience() {
  const chemin = usePathname();
  // `usePathname()` rend l'URL **affichée** : pour `/c/phil`, on enregistre
  // bien `/c/phil` et non la cible de la réécriture du proxy. C'est tout
  // l'intérêt des liens par chemin.
  const dernier = useRef<string | null>(null);

  useEffect(() => {
    if (!chemin || dernier.current === chemin) return;
    dernier.current = chemin;

    void fetch("/api/vue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chemin, referent: document.referrer || null }),
      // La navigation peut emporter la page avant la fin de la requête.
      keepalive: true,
    }).catch(() => {
      // Hors ligne ou bloqué par une extension : on ne compte pas cette page.
    });
  }, [chemin]);

  return null;
}
