import { NextResponse, type NextRequest } from "next/server";
import { origineDemandee } from "@/lib/admin-google";
import { SESSION_COOKIE } from "@/lib/admin-session";

export const runtime = "nodejs";

/**
 * Déconnexion. En POST seulement : en GET, n'importe quelle page tierce
 * pourrait vous déconnecter avec une simple balise `<img>`.
 */
export async function POST(request: NextRequest) {
  const origine = origineDemandee(request.headers, request.nextUrl.origin);
  const reponse = NextResponse.redirect(new URL("/admin/connexion?erreur=sortie", origine), 303);
  reponse.cookies.delete(SESSION_COOKIE);
  return reponse;
}
