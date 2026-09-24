import { NextResponse, type NextRequest } from "next/server";
import { enregistrerVue } from "@/lib/db/audience";
import { COMMERCIAL_COOKIE, ETIQUETTE_VALIDE, PROFIL_COOKIE } from "@/lib/demo-profil";
import { lieuDeLaRequete } from "@/lib/geo";

export const runtime = "nodejs";

// Le chemin vient du navigateur : il finit dans un tableau d'administration, et
// sert de clé de regroupement. Une borne stricte évite qu'un visiteur ne remplisse
// le journal de milliers de chemins forgés.
const CHEMIN_VALIDE = /^\/[\w\-/.]{0,120}$/;

function etiquette(brut: string | undefined): string | null {
  return brut && ETIQUETTE_VALIDE.test(brut) ? brut : null;
}

/** Le domaine du référent suffit ; l'URL entière trahirait une recherche. */
function referent(brut: string | null): string | null {
  if (!brut) return null;
  try {
    const hote = new URL(brut).hostname;
    return hote.length <= 120 ? hote : null;
  } catch {
    return null;
  }
}

/**
 * Enregistre une page ouverte.
 *
 * Rend toujours 204, même en cas d'échec : la mesure d'audience est un
 * accessoire, elle ne doit jamais faire apparaître une erreur chez le visiteur
 * ni ralentir la page.
 */
export async function POST(request: NextRequest) {
  try {
    const { chemin, referent: venuDe } = (await request.json()) as {
      chemin?: unknown;
      referent?: unknown;
    };
    if (typeof chemin !== "string" || !CHEMIN_VALIDE.test(chemin)) {
      return new NextResponse(null, { status: 204 });
    }
    // La console ne se compte pas elle-même : sans cela, consulter les
    // statistiques les gonflerait.
    if (chemin.startsWith("/admin")) return new NextResponse(null, { status: 204 });

    await enregistrerVue({
      chemin,
      commercial: etiquette(request.cookies.get(COMMERCIAL_COOKIE)?.value),
      profil: etiquette(request.cookies.get(PROFIL_COOKIE)?.value),
      referent: referent(typeof venuDe === "string" ? venuDe : null),
      lieu: lieuDeLaRequete(request.headers),
    });
  } catch {
    // Base indisponible, corps illisible : on perd une ligne de statistique,
    // rien d'autre.
  }
  return new NextResponse(null, { status: 204 });
}
