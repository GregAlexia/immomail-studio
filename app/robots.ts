import type { MetadataRoute } from "next";

/**
 * Seule la page de vente cherche à être trouvée. La démonstration n'est pas
 * refusée ici mais marquée `noindex` dans son gabarit : un robot à qui l'on
 * interdit l'exploration ne lit plus la balise, et une adresse déjà connue
 * resterait alors indexée sans titre.
 *
 * `/admin` et `/api` sont refusés : rien à y lire, et la console a déjà son
 * propre `noindex`.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
