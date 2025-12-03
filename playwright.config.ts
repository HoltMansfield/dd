import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.e2e" });

export default defineConfig({
  globalSetup: "e2e-tests/global-setup.ts",
  timeout: 60 * 1000,
  use: {
    baseURL: process.env.E2E_URL,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  projects: [
    {
      name: "anonymous",
      testDir: "e2e-tests/anonymous",
      use: { storageState: undefined },
    },
    {
      name: "mfa",
      testDir: "e2e-tests/mfa",
      use: { storageState: undefined }, // MFA tests manage their own auth
    },
    {
      name: "logged-in",
      testDir: "e2e-tests/logged-in",
      use: { storageState: "e2e-tests/storageState.json" },
    },
    {
      name: "rbac",
      testDir: "e2e-tests/rbac",
      use: { storageState: undefined }, // RBAC tests manage their own auth
      fullyParallel: false, // Run RBAC tests serially to avoid shared data conflicts
      workers: 1, // Single worker to prevent parallel file execution
    },
  ],
});
