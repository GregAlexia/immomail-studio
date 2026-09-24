/**
 * Localisation approximative du visiteur, telle que Vercel la pose sur la
 * requête.
 *
 * **L'adresse IP n'est ni lue ni conservée.** Vercel fait la résolution en
 * amont et nous transmet le résultat : on obtient pays, région et ville sans
 * jamais manipuler la donnée personnelle qui a servi à les déduire.
 *
 * Tout est facultatif — en local, derrière un VPN ou depuis un réseau mal
 * référencé, les en-têtes sont simplement absents.
 */
export type Lieu = {
  pays: string | null;
  region: string | null;
  ville: string | null;
};

const LIEU_INCONNU: Lieu = { pays: null, region: null, ville: null };

/** Les valeurs arrivent encodées : « Charleville-M%C3%A9zi%C3%A8res ». */
function decoder(valeur: string | null): string | null {
  if (!valeur) return null;
  try {
    const clair = decodeURIComponent(valeur).trim();
    return clair.length > 0 && clair.length <= 120 ? clair : null;
  } catch {
    return null;
  }
}

export function lieuDeLaRequete(entetes: Headers): Lieu {
  const pays = decoder(entetes.get("x-vercel-ip-country"));
  const region = decoder(entetes.get("x-vercel-ip-country-region"));
  const ville = decoder(entetes.get("x-vercel-ip-city"));
  if (!pays && !region && !ville) return LIEU_INCONNU;
  return { pays, region, ville };
}

// Les codes ISO ne parlent pas d'eux-mêmes dans un tableau. Seuls les pays
// susceptibles d'apparaître sont nommés ; les autres restent en code, ce qui
// vaut mieux qu'une table de 250 lignes à maintenir pour rien.
const PAYS: Record<string, string> = {
  FR: "France",
  BE: "Belgique",
  CH: "Suisse",
  LU: "Luxembourg",
  MC: "Monaco",
  ES: "Espagne",
  IT: "Italie",
  PT: "Portugal",
  DE: "Allemagne",
  GB: "Royaume-Uni",
  NL: "Pays-Bas",
  MA: "Maroc",
  TN: "Tunisie",
  DZ: "Algérie",
  CA: "Canada",
  US: "États-Unis",
};

export function nomDuPays(code: string | null): string {
  if (!code) return "Inconnu";
  return PAYS[code.toUpperCase()] ?? code.toUpperCase();
}
