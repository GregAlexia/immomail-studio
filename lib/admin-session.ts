import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Session de la console d'administration.
 *
 * Un cookie signé, pas une table de sessions : il n'y a **qu'un seul compte**
 * autorisé, et une table apporterait ici un état à purger sans rien sécuriser
 * de plus. Le jeton porte l'adresse et sa date d'expiration, signés en
 * HMAC-SHA256 : impossible d'en forger un sans le secret.
 *
 * L'adresse autorisée est relue **à chaque vérification**, jamais figée dans le
 * jeton seul : retirer une adresse de la variable d'environnement ferme
 * immédiatement les sessions en cours, au lieu de les laisser courir jusqu'à
 * expiration.
 */

export const SESSION_COOKIE = "admin_session";

/** Anti-CSRF du dialogue OAuth : posé avant l'aller, vérifié au retour. */
export const ETAT_COOKIE = "admin_etat";

export const DUREE_SESSION = 60 * 60 * 12; // 12 h
export const DUREE_ETAT = 60 * 10; // 10 min

/**
 * La seule adresse qui entre. Réglable par variable d'environnement pour ne pas
 * avoir à redéployer si elle change, mais la valeur par défaut est celle du
 * propriétaire — la console n'est jamais ouverte par accident.
 */
export function adresseAutorisee(): string {
  return (process.env.ADMIN_EMAIL ?? "cojagregory@gmail.com").trim().toLowerCase();
}

function secret(): string {
  const valeur = process.env.ADMIN_SESSION_SECRET;
  if (!valeur || valeur.length < 24) {
    throw new Error(
      "ADMIN_SESSION_SECRET manquant ou trop court (24 caractères minimum). " +
        "Générez-en un au hasard et ajoutez-le aux variables d'environnement Vercel."
    );
  }
  return valeur;
}

export function secretPresent(): boolean {
  const valeur = process.env.ADMIN_SESSION_SECRET;
  return Boolean(valeur && valeur.length >= 24);
}

function signer(charge: string): string {
  return createHmac("sha256", secret()).update(charge).digest("base64url");
}

/** Comparaison à temps constant, y compris sur des longueurs différentes. */
export function egal(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function valeurAleatoire(): string {
  return randomBytes(24).toString("base64url");
}

export function creerJeton(email: string): string {
  const charge = Buffer.from(
    JSON.stringify({ e: email.toLowerCase(), x: Math.floor(Date.now() / 1000) + DUREE_SESSION })
  ).toString("base64url");
  return `${charge}.${signer(charge)}`;
}

/** Renvoie l'adresse portée par un jeton valide, `null` sinon. */
export function lireJeton(jeton: string | undefined | null): string | null {
  if (!jeton) return null;
  const separateur = jeton.lastIndexOf(".");
  if (separateur <= 0) return null;
  const charge = jeton.slice(0, separateur);
  const signature = jeton.slice(separateur + 1);
  if (!egal(signature, signer(charge))) return null;

  try {
    const { e, x } = JSON.parse(Buffer.from(charge, "base64url").toString("utf8")) as {
      e?: unknown;
      x?: unknown;
    };
    if (typeof e !== "string" || typeof x !== "number") return null;
    if (x * 1000 <= Date.now()) return null;
    // L'adresse est reconfrontée à la liste : un jeton signé hier pour une
    // adresse qu'on a depuis retirée ne doit plus ouvrir la porte.
    if (e !== adresseAutorisee()) return null;
    return e;
  } catch {
    return null;
  }
}

/** L'adresse connectée sur cette requête, ou `null`. */
export async function sessionAdmin(): Promise<string | null> {
  if (!secretPresent()) return null;
  return lireJeton((await cookies()).get(SESSION_COOKIE)?.value);
}

/**
 * Barrière des Server Actions. Une action d'écriture ne doit jamais se contenter
 * de la protection du layout : l'action est appelable directement par POST, sans
 * passer par la page qui l'affiche.
 */
export async function exigerAdmin(): Promise<string> {
  const email = await sessionAdmin();
  if (!email) throw new Error("Accès refusé : cette action demande une session d'administration.");
  return email;
}
