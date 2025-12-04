import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.e2e" });

export default defineConfig({
  globalSetup: "e2e-tests/global-setup.ts",
  timeout: 60 * 1000,
  reporter: process.env.CI ? "blob" : "html",
  workers: process.env.CI ? 1 : undefined, // Use all available workers locally, 1 in CI
  fullyParallel: true, // Run tests in parallel by default
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
      fullyParallel: false, // Run MFA tests serially to avoid auth conflicts
      workers: 1, // Single worker to prevent parallel execution
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
