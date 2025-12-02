import { test, expect } from "@playwright/test";
import {
  disableMFAForTestUser,
  checkMFAStatus,
} from "../../fixtures/mfa-test-helpers";

// Test user credentials
const TEST_USER = {
  email: "mfa-setup-test@example.com",
  password: "TestPassword123!",
  name: "MFA Setup Test User",
};

let testUserId: string;

test.describe("MFA - Setup and Management", () => {
  test.beforeAll(async () => {
    // Create test user
    const { db } = await import("../../src/db/connect");
    const { users } = await import("../../src/db/schema");
    const bcrypt = await import("bcryptjs");

    const passwordHash = await bcrypt.hash(TEST_USER.password, 10);

    const [user] = await db
      .insert(users)
      .values({
        email: TEST_USER.email,
        name: TEST_USER.name,
        passwordHash,
      })
      .returning({ id: users.id });

    testUserId = user.id;
    console.log(`[MFA Setup Test] Created test user: ${testUserId}`);
  });

  test.afterAll(async () => {
    // Clean up test user
    const { db } = await import("../../src/db/connect");
    const { users } = await import("../../src/db/schema");
    const { eq } = await import("drizzle-orm");

    await db.delete(users).where(eq(users.id, testUserId));
    console.log(`[MFA Setup Test] Deleted test user: ${testUserId}`);
  });

  test.beforeEach(async ({ page }) => {
    // Ensure MFA is disabled and user is logged in
    const { db } = await import("../../../src/db/connect");
    const { users } = await import("../../../src/db/schema");
    const { eq } = await import("drizzle-orm");
    await disableMFAForTestUser(db, users, eq, testUserId);

    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/");
  });

  test("should navigate to security settings", async ({ page }) => {
    console.log("[Test] Navigate to security settings");

    // Click Security link in navbar
    await page.click('a:has-text("Security")');

    // Should be on security settings page
    await expect(page).toHaveURL("/settings/security");
    await expect(page.getByText("Security Settings")).toBeVisible();
    console.log("✓ Navigated to security settings");
  });

  test("should show MFA as disabled initially", async ({ page }) => {
    console.log("[Test] Show MFA disabled status");

    await page.goto("/settings/security");

    // Should show MFA section
    await expect(page.getByText("Two-Factor Authentication")).toBeVisible();

    // Should show disabled status
    await expect(page.getByText("Disabled")).toBeVisible();

    // Should show Enable button
    await expect(
      page.getByRole("button", { name: "Enable MFA" })
    ).toBeVisible();
    console.log("✓ MFA shown as disabled");
  });

  test("should complete MFA setup flow", async ({ page }) => {
    console.log("[Test] Complete MFA setup");

    await page.goto("/settings/security");

    // Click Enable MFA
    await page.click('button:has-text("Enable MFA")');

    // Should show intro step
    await expect(
      page.getByText("Enable Two-Factor Authentication")
    ).toBeVisible();
    console.log("✓ Intro step displayed");

    // Click Get Started
    await page.click('button:has-text("Get Started")');

    // Should show QR code step
    await expect(page.getByText("Scan QR Code")).toBeVisible();
    await expect(page.locator('img[alt="MFA QR Code"]')).toBeVisible();
    console.log("✓ QR code displayed");

    // Click Next
    await page.click('button:has-text("Next: Verify Code")');

    // Should show verification step
    await expect(page.getByText("Verify Setup")).toBeVisible();
    console.log("✓ Verification step displayed");

    // Note: We can't actually scan the QR code in E2E tests,
    // but we can verify the UI flow works correctly
  });

  test("should reject invalid verification code during setup", async ({
    page,
  }) => {
    console.log("[Test] Reject invalid verification code");

    await page.goto("/settings/security");

    // Start MFA setup
    await page.click('button:has-text("Enable MFA")');
    await page.click('button:has-text("Get Started")');
    await page.click('button:has-text("Next: Verify Code")');

    // Enter invalid code
    await page.fill('input[type="text"]', "000000");
    await page.click('button:has-text("Verify & Enable")');

    // Should show error
    await expect(page.getByText(/invalid/i)).toBeVisible();
    console.log("✓ Invalid code rejected during setup");
  });

  test("should allow canceling MFA setup", async ({ page }) => {
    console.log("[Test] Cancel MFA setup");

    await page.goto("/settings/security");

    // Start MFA setup
    await page.click('button:has-text("Enable MFA")');

    // Should show intro
    await expect(
      page.getByText("Enable Two-Factor Authentication")
    ).toBeVisible();

    // Click Cancel
    await page.click('button:has-text("Cancel")');

    // Should return to security settings
    await expect(page.getByText("Security Settings")).toBeVisible();
    await expect(page.getByText("Disabled")).toBeVisible();
    console.log("✓ Setup canceled successfully");
  });

  test("should show MFA as enabled after setup", async ({ page }) => {
    console.log("[Test] Show MFA enabled status");

    // Enable MFA directly in database
    const { enableMFAForTestUser } = await import(
      "../../fixtures/mfa-test-helpers"
    );
    const { db } = await import("../../../src/db/connect");
    const { users } = await import("../../../src/db/schema");
    const { eq } = await import("drizzle-orm");
    await enableMFAForTestUser(db, users, eq, testUserId);

    // Verify in database
    const { db: dbCheck } = await import("../../../src/db/connect");
    const { users: usersCheck } = await import("../../../src/db/schema");
    const { eq: eqCheck } = await import("drizzle-orm");
    const isEnabled = await checkMFAStatus(dbCheck, usersCheck, eqCheck, testUserId);
    expect(isEnabled).toBe(true);

    await page.goto("/settings/security");

    // Should show enabled status
    await expect(page.getByText("Enabled")).toBeVisible();
    await expect(page.getByText("Protected")).toBeVisible();

    // Should show Disable button
    await expect(
      page.getByRole("button", { name: "Disable MFA" })
    ).toBeVisible();
    console.log("✓ MFA shown as enabled");
  });

  test("should disable MFA with password confirmation", async ({ page }) => {
    console.log("[Test] Disable MFA");

    // Enable MFA first
    const { enableMFAForTestUser } = await import(
      "../../fixtures/mfa-test-helpers"
    );
    const { db } = await import("../../../src/db/connect");
    const { users } = await import("../../../src/db/schema");
    const { eq } = await import("drizzle-orm");
    await enableMFAForTestUser(db, users, eq, testUserId);

    await page.goto("/settings/security");

    // Click Disable MFA
    await page.click('button:has-text("Disable MFA")');

    // Should show confirmation modal
    await expect(
      page.getByText("Disable Two-Factor Authentication")
    ).toBeVisible();
    console.log("✓ Confirmation modal displayed");

    // Enter password
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("Disable MFA")');

    // Should return to settings with MFA disabled
    await expect(page.getByText("Disabled")).toBeVisible();
    console.log("✓ MFA disabled successfully");

    // Verify in database
    const { db: dbCheck } = await import("../../../src/db/connect");
    const { users: usersCheck } = await import("../../../src/db/schema");
    const { eq: eqCheck } = await import("drizzle-orm");
    const isEnabled = await checkMFAStatus(dbCheck, usersCheck, eqCheck, testUserId);
    expect(isEnabled).toBe(false);
  });

  test("should reject wrong password when disabling MFA", async ({ page }) => {
    console.log("[Test] Reject wrong password");

    // Enable MFA first
    const { enableMFAForTestUser } = await import(
      "../../fixtures/mfa-test-helpers"
    );
    const { db } = await import("../../../src/db/connect");
    const { users } = await import("../../../src/db/schema");
    const { eq } = await import("drizzle-orm");
    await enableMFAForTestUser(db, users, eq, testUserId);

    await page.goto("/settings/security");

    // Click Disable MFA
    await page.click('button:has-text("Disable MFA")');

    // Enter wrong password
    await page.fill('input[type="password"]', "WrongPassword123!");
    await page.click('button:has-text("Disable MFA")');

    // Should show error
    await expect(page.getByText(/invalid password/i)).toBeVisible();
    console.log("✓ Wrong password rejected");

    // MFA should still be enabled
    const { db: dbCheck } = await import("../../../src/db/connect");
    const { users: usersCheck } = await import("../../../src/db/schema");
    const { eq: eqCheck } = await import("drizzle-orm");
    const isEnabled = await checkMFAStatus(dbCheck, usersCheck, eqCheck, testUserId);
    expect(isEnabled).toBe(true);
  });

  test("should allow canceling MFA disable", async ({ page }) => {
    console.log("[Test] Cancel MFA disable");

    // Enable MFA first
    const { enableMFAForTestUser } = await import(
      "../../fixtures/mfa-test-helpers"
    );
    const { db } = await import("../../../src/db/connect");
    const { users } = await import("../../../src/db/schema");
    const { eq } = await import("drizzle-orm");
    await enableMFAForTestUser(db, users, eq, testUserId);

    await page.goto("/settings/security");

    // Click Disable MFA
    await page.click('button:has-text("Disable MFA")');

    // Should show confirmation modal
    await expect(
      page.getByText("Disable Two-Factor Authentication")
    ).toBeVisible();

    // Click Cancel
    await page.click('button:has-text("Cancel")');

    // Should return to settings with MFA still enabled
    await expect(page.getByText("Enabled")).toBeVisible();
    console.log("✓ Disable canceled successfully");

    // Verify MFA still enabled
    const { db: dbCheck } = await import("../../../src/db/connect");
    const { users: usersCheck } = await import("../../../src/db/schema");
    const { eq: eqCheck } = await import("drizzle-orm");
    const isEnabled = await checkMFAStatus(dbCheck, usersCheck, eqCheck, testUserId);
    expect(isEnabled).toBe(true);
  });

  test("should show environment message in LOCAL mode", async ({ page }) => {
    console.log("[Test] Show LOCAL environment message");

    await page.goto("/settings/security");

    // Should show LOCAL environment message
    await expect(page.getByText(/optional in development mode/i)).toBeVisible();
    console.log("✓ LOCAL environment message displayed");
  });
});
