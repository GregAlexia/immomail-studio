import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Racine explicite : un lockfile existe dans le dossier parent.
  turbopack: { root },
  // exceljs : paquet Node lourd, externalisé du bundle serveur.
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
