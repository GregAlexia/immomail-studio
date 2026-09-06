import { NextResponse, type NextRequest } from "next/server";
import { ETIQUETTE_VALIDE, NOM_COOKIE, PROFIL_COOKIE } from "@/lib/demo-profil";

const UN_AN = 60 * 60 * 24 * 365;

/**
 * Mémorise le profil de démonstration porté par l'URL (`?p=lyon`, `?p=keo`).
 *
 * Fichier `proxy.ts` et non `middleware.ts` : Next 16 a déprécié cette seconde
 * convention et la renomme ainsi (le build émet un avertissement explicite).
 *
 * Deux raisons de traiter le paramètre ici plutôt que dans un composant :
 *
 * - un layout ne reçoit pas `searchParams` dans l'App Router, et c'est le
 *   layout qui choisit l'agence affichée ;
 * - le faire côté client ouvrirait la démonstration sur la mauvaise agence
 *   avant de basculer sous les yeux du prospect.
 *
 * Le cookie sert aussi à la persistance : une fois le commercial passé sur une
 * autre page, le `?p=` a disparu de l'URL. `setAgency` l'efface, pour qu'un
 * choix manuel dans le sélecteur reprenne la main.
 *
 * La correspondance étiquette → agence n'est PAS faite ici : le proxy tourne
 * sur l'edge, sans accès à Postgres. Les deux seules choses importées de
 * `lib/demo-profil` sont une constante et une expression régulière, figées à
 * la compilation — aucun état partagé, ce que la documentation déconseille.
 */
export function proxy(request: NextRequest) {
  const reponse = NextResponse.next();

  const profil = request.nextUrl.searchParams.get("p");
  if (profil && ETIQUETTE_VALIDE.test(profil)) {
    reponse.cookies.set(PROFIL_COOKIE, profil, { path: "/", maxAge: UN_AN, sameSite: "lax" });
  }

  // `?n=cabinet-durand` renomme l'agence à l'écran, sans toucher aux données :
  // le prospect voit son propre nom sur un jeu de démonstration partagé.
  const nom = request.nextUrl.searchParams.get("n");
  if (nom && ETIQUETTE_VALIDE.test(nom)) {
    reponse.cookies.set(NOM_COOKIE, nom, { path: "/", maxAge: UN_AN, sameSite: "lax" });
  }

  return reponse;
}

export const config = {
  // Les routes d'API et les fichiers statiques n'affichent aucune agence.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
