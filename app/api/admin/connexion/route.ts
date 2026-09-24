import { NextResponse, type NextRequest } from "next/server";
import { identifiantsPresents, origineDemandee, urlAutorisation } from "@/lib/admin-google";
import { DUREE_ETAT, ETAT_COOKIE, secretPresent, valeurAleatoire } from "@/lib/admin-session";

export const runtime = "nodejs";

/** Départ du dialogue OAuth : on pose l'anti-rejeu, puis on envoie chez Google. */
export async function GET(request: NextRequest) {
  if (!identifiantsPresents() || !secretPresent()) {
    return NextResponse.redirect(new URL("/admin/connexion?erreur=configuration", request.url));
  }

  const origine = origineDemandee(request.headers, request.nextUrl.origin);
  const etat = valeurAleatoire();
  const reponse = NextResponse.redirect(urlAutorisation(origine, etat));

  // `sameSite: lax` et non `strict` : le retour depuis Google est une navigation
  // de premier niveau venue d'un autre site, et un cookie `strict` ne serait pas
  // renvoyé — le dialogue échouerait systématiquement à la dernière étape.
  reponse.cookies.set(ETAT_COOKIE, etat, {
    httpOnly: true,
    secure: origine.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_ETAT,
  });
  return reponse;
}
