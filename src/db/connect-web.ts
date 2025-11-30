import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

let db: NodePgDatabase<typeof schema> | null = null;

if (process.env.NEXT_PUBLIC_APP_ENV !== "E2E") {
  const pool = new Pool({ connectionString: process.env.DB_URL });
  db = drizzle(pool, { schema });
}

export default db;
