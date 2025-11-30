#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Path to drizzle-e2e.config.ts
const configPath = path.resolve(process.cwd(), "drizzle-e2e.config.ts");

// Ensure the drizzle/e2e-migrations directory exists
const migrationsDir = path.resolve(process.cwd(), "drizzle/e2e-migrations");
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Get the command from arguments
const command = process.argv[2];

if (!command) {
  console.error("Please provide a drizzle command (generate, migrate, push, etc.)");
  process.exit(1);
}

// Execute the appropriate drizzle command with the e2e config
try {
  console.log(`Running drizzle-kit ${command} with e2e config...`);
  const configArg = "--config=./drizzle-e2e.config.ts";
  let drizzleCmd;
  if (command === "generate") {
    drizzleCmd = `npx drizzle-kit generate ${configArg}`;
  } else {
    drizzleCmd = `npx drizzle-kit ${command} ${configArg}`;
  }
  execSync(drizzleCmd, {
    stdio: "inherit",
  });
  console.log(`\ndrizzle-kit ${command} completed successfully!`);
} catch (error) {
  console.error(`\nError running drizzle-kit ${command}:`, error.message);
  process.exit(1);
}
