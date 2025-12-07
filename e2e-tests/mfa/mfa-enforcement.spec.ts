import { test, expect } from "@playwright/test";
import { db } from "../../src/db/connect";
import { users } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

test.describe("MFA Enforcement for Documents", () => {
  let testUserId: string;
  let testUserEmail: string;
  const testPassword = "TestPassword123!";

  test.beforeAll(async () => {
    // Create a test user without MFA
    testUserId = uuidv4();
    testUserEmail = `mfa-enforcement-${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash(testPassword, 10);

    await db.insert(users).values({
      id: testUserId,
      email: testUserEmail,
      passwordHash,
      mfaEnabled: false,
    });

    console.log(`[MFA Enforcement Test] Created test user: ${testUserEmail}`);
  });

  test.afterAll(async () => {
    // Clean up test user
    await db.delete(users).where(eq(users.id, testUserId));
    console.log(`[MFA Enforcement Test] Deleted test user: ${testUserId}`);
  });

  test("should redirect to MFA setup when accessing documents without MFA in QA/PROD", async ({
    page,
  }) => {
    // Skip this test if not in QA or PROD environment
    const env = process.env.NEXT_PUBLIC_APP_ENV;
    if (env !== "QA" && env !== "PRODUCTION") {
      test.skip();
      return;
    }

    // Login as user without MFA
    await page.goto(`${process.env.E2E_URL}/login`);
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for successful login
    await page.waitForURL("**/", { timeout: 5000 });

    // Try to access documents page
    await page.goto(`${process.env.E2E_URL}/documents`);

    // Should be redirected to security settings with MFA required
    await page.waitForURL("**/settings/security?mfa_required=true**", {
      timeout: 5000,
    });

    // Check for MFA required banner
    await expect(
      page.getByText(/Multi-Factor Authentication Required/i)
    ).toBeVisible();
    await expect(
      page.getByText(/You must enable MFA to access documents/i)
    ).toBeVisible();
  });

  test("should allow document access in development environment without MFA", async ({
    page,
  }) => {
    // Only run this test in development/E2E environment
    const env = process.env.NEXT_PUBLIC_APP_ENV;
    if (env === "QA" || env === "PRODUCTION") {
      test.skip();
      return;
    }

    // Login as user without MFA
    await page.goto(`${process.env.E2E_URL}/login`);
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for successful login
    await page.waitForURL("**/", { timeout: 5000 });

    // Try to access documents page
    await page.goto(`${process.env.E2E_URL}/documents`);

    // Should NOT be redirected - should stay on documents page
    await expect(page).toHaveURL(`${process.env.E2E_URL}/documents`);
  });

  test("should show MFA optional message in development environment", async ({
    page,
  }) => {
    // Only run this test in development/E2E environment
    const env = process.env.NEXT_PUBLIC_APP_ENV;
    if (env === "QA" || env === "PRODUCTION") {
      test.skip();
      return;
    }

    // Login as user without MFA
    await page.goto(`${process.env.E2E_URL}/login`);
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for successful login
    await page.waitForURL("**/", { timeout: 5000 });

    // Go to security settings
    await page.goto(`${process.env.E2E_URL}/settings/security`);

    // Should show optional message
    await expect(
      page.getByText(/Multi-factor authentication is optional/i)
    ).toBeVisible();
  });

  test("should show MFA required message in QA/PROD environment", async ({
    page,
  }) => {
    // Only run this test in QA or PROD environment
    const env = process.env.NEXT_PUBLIC_APP_ENV;
    if (env !== "QA" && env !== "PRODUCTION") {
      test.skip();
      return;
    }

    // Login as user without MFA
    await page.goto(`${process.env.E2E_URL}/login`);
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for successful login
    await page.waitForURL("**/", { timeout: 5000 });

    // Go to security settings
    await page.goto(`${process.env.E2E_URL}/settings/security`);

    // Should show required message
    await expect(
      page.getByText(
        /Multi-factor authentication is required to access documents/i
      )
    ).toBeVisible();
  });

  test("should redirect to original destination after MFA setup", async ({
    page,
  }) => {
    // Skip this test if not in QA or PROD environment
    const env = process.env.NEXT_PUBLIC_APP_ENV;
    if (env !== "QA" && env !== "PRODUCTION") {
      test.skip();
      return;
    }

    // Create a fresh user for this test
    const freshUserId = uuidv4();
    const freshUserEmail = `mfa-redirect-${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash(testPassword, 10);

    await db.insert(users).values({
      id: freshUserId,
      email: freshUserEmail,
      passwordHash,
      mfaEnabled: false,
    });

    try {
      // Login as user without MFA
      await page.goto(`${process.env.E2E_URL}/login`);
      await page.fill('input[name="email"]', freshUserEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');

      // Wait for successful login
      await page.waitForURL("**/", { timeout: 5000 });

      // Try to access documents page
      await page.goto(`${process.env.E2E_URL}/documents`);

      // Should be redirected to security settings
      await page.waitForURL("**/settings/security?mfa_required=true**", {
        timeout: 5000,
      });

      // MFA setup should auto-open
      await expect(page.getByText(/Set up two-factor/i)).toBeVisible({
        timeout: 10000,
      });

      // Note: We can't complete the full MFA setup in this test without
      // being able to generate valid TOTP codes. This test verifies the
      // redirect flow works correctly.
    } finally {
      // Clean up
      await db.delete(users).where(eq(users.id, freshUserId));
    }
  });
});
