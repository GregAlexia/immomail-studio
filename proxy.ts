import { NextResponse, type NextRequest } from "next/server";
import {
  CHEMIN_COMMERCIAL,
  COMMERCIAL_COOKIE,
  ETIQUETTE_VALIDE,
  NOM_COOKIE,
  PROFIL_COOKIE,
  PROFIL_PAR_DEFAUT,
} from "@/lib/demo-profil";

const UN_AN = 60 * 60 * 24 * 365;

/**
 * Traduit l'URL d'un lien de démonstration en cookies, avant le rendu.
 *
 * Fichier `proxy.ts` et non `middleware.ts` : Next 16 a déprécié cette seconde
 * convention et la renomme ainsi (le build émet un avertissement explicite).
 *
 * Deux raisons de traiter les paramètres ici plutôt que dans un composant :
 *
 * - un layout ne reçoit pas `searchParams` dans l'App Router, et c'est le
 *   layout qui choisit l'agence affichée ;
 * - le faire côté client ouvrirait la démonstration sur la mauvaise agence
 *   avant de basculer sous les yeux du prospect.
 *
 * Les cookies assurent aussi la persistance : dès la première navigation,
 * l'URL du lien a disparu. `setAgency` les efface, pour qu'un choix manuel
 * dans le sélecteur reprenne la main.
 *
 * La correspondance étiquette → agence n'est PAS faite ici : le proxy tourne
 * sur l'edge, sans accès à Postgres. Les seules choses importées de
 * `lib/demo-profil` sont des constantes et des expressions régulières, figées
 * à la compilation — aucun état partagé, ce que la documentation déconseille.
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const profil = valide(searchParams.get("p"));
  const nom = valide(searchParams.get("n"));

  // --- Lien nominatif par chemin : /c/phil -----------------------------------
  // On réécrit vers l'accueil **sans** changer l'URL affichée. La page vue est
  // donc comptée sous `/c/phil`, ce qui est la seule façon de distinguer les
  // commerciaux sur le plan Hobby : les propriétés des événements
  // personnalisés y sont hors d'atteinte, les pages non.
  const parChemin = CHEMIN_COMMERCIAL.exec(pathname);
  if (parChemin) {
    const reponse = NextResponse.rewrite(new URL("/", request.url));
    poser(reponse, COMMERCIAL_COOKIE, parChemin[1]);
    poser(reponse, PROFIL_COOKIE, profil ?? PROFIL_PAR_DEFAUT);
    // Sans `&n=`, on efface le nom du prospect précédent. Un lien de commercial
    // ouvre une démonstration neuve : sans cet effacement, le nom posé pour un
    // rendez-vous resterait affiché au suivant, et le commercial montrerait à
    // un prospect le nom d'un autre.
    if (nom) poser(reponse, NOM_COOKIE, nom);
    else reponse.cookies.delete(NOM_COOKIE);
    return reponse;
  }

  // --- Liens à paramètres : /?p=keo&c=phil&n=cabinet-durand ------------------
  const reponse = NextResponse.next();
  if (profil) poser(reponse, PROFIL_COOKIE, profil);
  if (nom) poser(reponse, NOM_COOKIE, nom);
  const commercial = valide(searchParams.get("c"));
  if (commercial) poser(reponse, COMMERCIAL_COOKIE, commercial);
  return reponse;
}

function valide(brut: string | null): string | null {
  return brut && ETIQUETTE_VALIDE.test(brut) ? brut : null;
}

function poser(reponse: NextResponse, nom: string, valeur: string): void {
  reponse.cookies.set(nom, valeur, { path: "/", maxAge: UN_AN, sameSite: "lax" });
}

export const config = {
  // Les routes d'API et les fichiers statiques n'affichent aucune agence.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
