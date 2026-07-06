import type { Config } from "drizzle-kit";

// `npm run db:push` pour synchroniser le schéma vers Postgres (Supabase).
export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
