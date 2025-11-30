// e2e-tests/global-setup.ts
import { WebSocket } from 'ws';
import { execSync } from 'child_process';
import fs from 'fs';
import { Client } from '@neondatabase/serverless';

let fetchPromise: Promise<typeof fetch> | null = null;
async function polyfillGlobals() {
  if (typeof globalThis.WebSocket === 'undefined') {
    globalThis.WebSocket = WebSocket as any;
  }
  if (typeof globalThis.fetch === 'undefined') {
    if (!fetchPromise) {
      fetchPromise = import('node-fetch').then(mod => mod.default as unknown as typeof fetch);
    }
    (global as any).fetch = (await fetchPromise) as unknown as typeof globalThis.fetch;
  }
}

const dbSetup = async () => {
  await polyfillGlobals();
  // Clean Neon Postgres database before E2E migrations
  const dbUrl = process.env.DB_URL;
  if (dbUrl && dbUrl.startsWith('postgresql://')) {
    console.log(`[global-setup] Connecting to Neon Postgres for clean slate...`);
    const client = new Client(dbUrl);
    await client.connect();
    try {
      // Drop all tables in the public schema
      await client.query(`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
          END LOOP;
        END $$;
      `);
      console.log(`[global-setup] Dropped all tables in Neon Postgres database.`);
    } finally {
      await client.end();
    }
  }

  // Remove e2e-migrations directory for a clean slate
  const migrationsPath = process.env.MIGRATIONS_PATH || './drizzle/e2e-migrations';
  if (fs.existsSync(migrationsPath)) {
    console.log(`[global-setup] Removing existing migrations at ${migrationsPath}`);
    fs.rmSync(migrationsPath, { recursive: true, force: true });
  }

  // Regenerate migrations
  console.log(`[global-setup] Generating fresh migrations in ${migrationsPath}`);
  execSync('npx drizzle-kit generate --config=drizzle-e2e.config.ts', { stdio: 'inherit' });

  // Run Drizzle migrations
  console.log(`[global-setup] Pushing migrations to database`);
  execSync('npx drizzle-kit push --config=drizzle-e2e.config.ts', { stdio: 'inherit' });
};

dbSetup();