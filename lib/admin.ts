import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Mode présentateur : protège les actions destructives de la démo publique
// (réinitialisation, avancement de l'horloge, import Excel).
//
// - Sans variable DEMO_ADMIN_PASSWORD : protection désactivée, tout le monde
//   peut tout faire (comportement historique — rien ne casse tant que la
//   variable n'est pas définie sur Vercel).
// - Avec la variable : ces actions exigent le déverrouillage préalable dans
//   le menu Paramétrage. Le cookie stocke le SHA-256 du mot de passe (jamais
//   le mot de passe lui-même), httpOnly.

export const PRESENTER_COOKIE = "presenter_token";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

const safeEqual = (a: string, b: string): boolean => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

export function presenterProtectionEnabled(): boolean {
  return Boolean(process.env.DEMO_ADMIN_PASSWORD);
}

export function expectedPresenterToken(): string {
  return sha256(process.env.DEMO_ADMIN_PASSWORD ?? "");
}

export function passwordMatches(candidate: string): boolean {
  const pwd = process.env.DEMO_ADMIN_PASSWORD;
  if (!pwd) return true;
  return safeEqual(sha256(candidate), sha256(pwd));
}

export async function isPresenter(): Promise<boolean> {
  if (!presenterProtectionEnabled()) return true;
  const token = (await cookies()).get(PRESENTER_COOKIE)?.value ?? "";
  return safeEqual(token, expectedPresenterToken());
}
