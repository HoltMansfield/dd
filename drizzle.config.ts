import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: process.env.MIGRATIONS_PATH,
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_URL ?? '',
  },
} satisfies Config;
