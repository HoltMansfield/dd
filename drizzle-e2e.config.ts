import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: 'postgresql://test:test@localhost:5433/testdb',
  },
} satisfies Config;