import { NextResponse, type NextRequest } from "next/server";
import { echangerCode, origineDemandee } from "@/lib/admin-google";
import {
  DUREE_SESSION,
  ETAT_COOKIE,
  SESSION_COOKIE,
  adresseAutorisee,
  creerJeton,
  egal,
} from "@/lib/admin-session";

export const runtime = "nodejs";

/** Retour de Google : on vérifie, on échange, on ouvre la session. */
export async function GET(request: NextRequest) {
  const origine = origineDemandee(request.headers, request.nextUrl.origin);
  const echec = (motif: string) =>
    NextResponse.redirect(new URL(`/admin/connexion?erreur=${motif}`, origine));

  const code = request.nextUrl.searchParams.get("code");
  const etatRecu = request.nextUrl.searchParams.get("state");
  const etatAttendu = request.cookies.get(ETAT_COOKIE)?.value;

  // Sans cette comparaison, un tiers pourrait déclencher la connexion depuis sa
  // propre page et faire ouvrir une session à son compte dans votre navigateur.
  if (!code || !etatRecu || !etatAttendu || !egal(etatRecu, etatAttendu)) return echec("etat");

  const profil = await echangerCode(origine, code);
  if (!profil) return echec("google");
  if (profil.email !== adresseAutorisee()) return echec("adresse");

  const reponse = NextResponse.redirect(new URL("/admin", origine));
  reponse.cookies.set(SESSION_COOKIE, creerJeton(profil.email), {
    httpOnly: true,
    secure: origine.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_SESSION,
  });
  reponse.cookies.delete(ETAT_COOKIE);
  return reponse;
}
