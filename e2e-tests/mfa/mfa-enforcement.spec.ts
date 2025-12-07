import { test, expect } from "@playwright/test";
import { db } from "../../src/db/connect";
import { users } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

test.describe("MFA Enforcement - E2E Environment", () => {
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

  test("should allow document access without MFA in E2E environment", async ({
    page,
  }) => {
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

  test("should show MFA optional message in E2E environment", async ({
    page,
  }) => {
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
});
