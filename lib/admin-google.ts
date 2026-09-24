import "server-only";

/**
 * Connexion Google de la console d'administration (OAuth 2.0 / OpenID Connect).
 *
 * Écrit à la main plutôt qu'avec une bibliothèque d'authentification : il n'y a
 * ici **qu'un fournisseur, qu'un compte et aucune table d'utilisateurs**, et le
 * flux « code d'autorisation » tient en deux requêtes. Une bibliothèque
 * apporterait sa propre configuration, ses adaptateurs de base et son suivi de
 * compatibilité avec Next 16, pour un besoin qu'elle dépasse largement.
 */

const AUTORISATION = "https://accounts.google.com/o/oauth2/v2/auth";
const JETON = "https://oauth2.googleapis.com/token";
const EMETTEURS = new Set(["accounts.google.com", "https://accounts.google.com"]);

export function identifiantsPresents(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * L'adresse de retour déclarée à Google. Elle doit correspondre **au caractère
 * près** à l'une de celles enregistrées dans la console Google — d'où le calcul
 * à partir de l'origine réellement servie, et non d'une constante : le site
 * répond à la fois sur `keo.agenia.pro` et sur `immomail-studio.vercel.app`.
 */
export function urlRetour(origine: string): string {
  return `${origine}/api/admin/retour`;
}

/**
 * L'origine telle que le visiteur la voit.
 *
 * `request.url` porte l'hôte interne derrière le proxy de Vercel ; ce sont les
 * en-têtes transmis qui disent le domaine réellement tapé. Se tromper ici
 * produit un `redirect_uri_mismatch` côté Google, sans autre explication.
 */
export function origineDemandee(entetes: Headers, repli: string): string {
  const hote = entetes.get("x-forwarded-host") ?? entetes.get("host");
  if (!hote) return repli;
  const protocole = entetes.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");
  return `${protocole}://${hote}`;
}

export function urlAutorisation(origine: string, etat: string): string {
  const parametres = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: urlRetour(origine),
    response_type: "code",
    scope: "openid email",
    state: etat,
    // Sans quoi Google reconnecte en silence le dernier compte utilisé, ce qui
    // rend impossible de se tromper d'adresse… et de s'en apercevoir.
    prompt: "select_account",
  });
  return `${AUTORISATION}?${parametres}`;
}

type Profil = { email: string };

/**
 * Échange le code contre l'identité du visiteur.
 *
 * La signature du jeton d'identité n'est **pas** revérifiée, et c'est correct :
 * il arrive par une connexion TLS directe entre notre serveur et le point
 * d'échange de Google, authentifié par le certificat du serveur. C'est le cas
 * que la spécification OpenID Connect (§ 3.1.3.7) autorise explicitement à
 * traiter ainsi. Restent à contrôler les affirmations du jeton, faites ici :
 * émetteur, destinataire, expiration, adresse vérifiée.
 */
export async function echangerCode(origine: string, code: string): Promise<Profil | null> {
  const reponse = await fetch(JETON, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: urlRetour(origine),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!reponse.ok) return null;

  const { id_token: jeton } = (await reponse.json()) as { id_token?: string };
  if (typeof jeton !== "string") return null;

  const parties = jeton.split(".");
  if (parties.length !== 3) return null;

  try {
    const charge = JSON.parse(Buffer.from(parties[1], "base64url").toString("utf8")) as {
      iss?: unknown;
      aud?: unknown;
      exp?: unknown;
      email?: unknown;
      email_verified?: unknown;
    };
    if (typeof charge.iss !== "string" || !EMETTEURS.has(charge.iss)) return null;
    if (charge.aud !== process.env.GOOGLE_CLIENT_ID) return null;
    if (typeof charge.exp !== "number" || charge.exp * 1000 <= Date.now()) return null;
    // Une adresse non vérifiée peut appartenir à quelqu'un d'autre : elle ne
    // prouve rien.
    if (charge.email_verified !== true) return null;
    if (typeof charge.email !== "string") return null;
    return { email: charge.email.toLowerCase() };
  } catch {
    return null;
  }
}
