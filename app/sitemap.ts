import type { MetadataRoute } from "next";
import { CHEMIN_EN, CHEMIN_FR } from "@/app/presentation/contenu";

/**
 * Les deux pages de vente, et elles seules : le reste du domaine est la
 * démonstration, qui ne doit pas entrer dans l'index. Les alternatives de
 * langue reprennent celles que déclarent les pages elles-mêmes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";
  const langues = { fr: `${base}${CHEMIN_FR}`, en: `${base}${CHEMIN_EN}` };
  return [
    { url: `${base}${CHEMIN_FR}`, alternates: { languages: langues } },
    { url: `${base}${CHEMIN_EN}`, alternates: { languages: langues } },
  ];
}
