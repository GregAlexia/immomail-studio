import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Config ESLint « flat » (ESLint 9) basée sur les presets natifs de
// eslint-config-next v16 — pas de FlatCompat : les presets sont déjà plats.
const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      // Générateur n8n : scripts Node autonomes avec du code embarqué dans
      // des chaînes — hors périmètre du lint applicatif.
      "n8n-workflows/**",
      "docs/**",
      "next-env.d.ts",
    ],
  },
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Contenu français : apostrophes et guillemets typographiques dans le
      // JSX partout — l'échappement systématique nuirait à la lisibilité.
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
