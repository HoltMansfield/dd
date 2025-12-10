import { test, expect } from "@playwright/test";
import {
  generateTestTOTPCode,
  enableMFAForTestUser,
  disableMFAForTestUser,
  checkMFAStatus,
  getBackupCodesCount,
} from "../fixtures/mfa-test-helpers";
import { logout } from "../helpers";

// Test user credentials
const TEST_USER = {
  email: "mfa-test@example.com",
  password: "TestPassword123!",
  name: "MFA Test User",
};

let testUserId: string;
const TEST_SECRET = "JBSWY3DPEHPK3PXP"; // Known test secret
const TEST_BACKUP_CODES = ["TESTCOD1", "TESTCOD2", "TESTCOD3"]; // 8 characters each

test.describe("MFA - Login Flow", () => {
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
    console.log(`[MFA Test] Created test user: ${testUserId}`);
  });

  test.afterAll(async () => {
    // Clean up test user
    const { db } = await import("../../src/db/connect");
    const { users } = await import("../../src/db/schema");
    const { eq } = await import("drizzle-orm");

    await db.delete(users).where(eq(users.id, testUserId));
    console.log(`[MFA Test] Deleted test user: ${testUserId}`);
  });

  test.beforeEach(async () => {
    // Ensure MFA is disabled before each test
    const { db } = await import("../../src/db/connect");
    const { users } = await import("../../src/db/schema");
    const { eq } = await import("drizzle-orm");
    await disableMFAForTestUser(db, users, eq, testUserId);
  });

  test("should login normally without MFA", async ({ page }) => {
    console.log("[Test] Login without MFA");

    await page.goto("/login");

    // Fill login form
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Should redirect to home page
    await expect(page).toHaveURL("/");
    console.log("Logged in without MFA");
  });

  test("should redirect to MFA verification when MFA enabled", async ({
    page,
  }) => {
    console.log("[Test] Login with MFA - redirect to verification");

    // Enable MFA for test user
    const { db } = await import("../../src/db/connect");
    const { users } = await import("../../src/db/schema");
    const { eq } = await import("drizzle-orm");
    await enableMFAForTestUser(
      db,
      users,
      eq,
      testUserId,
      TEST_SECRET,
      TEST_BACKUP_CODES
    );

    await page.goto("/login");

    // Fill login form
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for the client-side redirect to MFA verification page
    await page.waitForURL(/\/login\/verify/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login\/verify/);
    console.log("Redirected to MFA verification");

    // Should show MFA verification UI
    await expect(page.getByText("Two-Factor Authentication")).toBeVisible();
    console.log("MFA verification page displayed");
  });

  test("should login successfully with valid TOTP code", async ({ page }) => {
    console.log("[Test] Login with valid TOTP code");

    // Enable MFA for test user
    const { db } = await import("../../src/db/connect");
    const { users } = await import("../../src/db/schema");
    const { eq } = await import("drizzle-orm");
    await enableMFAForTestUser(
      db,
      users,
      eq,
      testUserId,
      TEST_SECRET,
      TEST_BACKUP_CODES
    );

    await page.goto("/login");

    // Login
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for MFA page
    await page.waitForURL(/\/login\/verify/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login\/verify/);

    // Generate valid TOTP code
    const validCode = generateTestTOTPCode(TEST_SECRET);
    console.log(`Generated TOTP code: ${validCode}`);

    // Enter code
    await page.fill('input[type="text"]', validCode);
    await page.click('button:has-text("Verify")');

    // Should be logged in and redirected to home
    await expect(page).toHaveURL("/");
    console.log("Successfully logged in with TOTP code");
  });

  test("should reject invalid TOTP code", async ({ page }) => {
    console.log("[Test] Reject invalid TOTP code");

    // Enable MFA for test user
    const { db } = await import("../../src/db/connect");
    const { users } = await import("../../src/db/schema");
    const { eq } = await import("drizzle-orm");
    await enableMFAForTestUser(
      db,
      users,
      eq,
      testUserId,
      TEST_SECRET,
      TEST_BACKUP_CODES
    );

    await page.goto("/login");

    // Login
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for MFA page
    await page.waitForURL(/\/login\/verify/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login\/verify/);

    // Enter invalid code
    await page.fill('input[type="text"]', "000000");
    await page.click('button:has-text("Verify")');

    // Should show error
    await expect(page.getByText(/invalid/i)).toBeVisible();
    console.log("Invalid code rejected");

    // Should still be on verification page
    await expect(page).toHaveURL(/\/login\/verify/);
  });

  test("should login with backup code", async ({ page }) => {
    console.log("[Test] Login with backup code");

    // Enable MFA for test user
    const { db } = await import("../../src/db/connect");
    const { users } = await import("../../src/db/schema");
    const { eq } = await import("drizzle-orm");
    await enableMFAForTestUser(
      db,
      users,
      eq,
      testUserId,
      TEST_SECRET,
      TEST_BACKUP_CODES
    );

    await page.goto("/login");

    // Login
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for MFA page
    await page.waitForURL(/\/login\/verify/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login\/verify/);

    // Switch to backup code
    await page.click("text=Use backup code instead");

    // Enter backup code
    await page.fill('input[type="text"]', TEST_BACKUP_CODES[0]);
    await page.click('button:has-text("Verify")');

    // Should be logged in
    await expect(page).toHaveURL("/");
    console.log("Successfully logged in with backup code");
  });

  test("should invalidate used backup code", async ({ page }) => {
    console.log("[Test] Invalidate used backup code");

    // Enable MFA for test user
    const { db } = await import("../../src/db/connect");
    const { users } = await import("../../src/db/schema");
    const { eq } = await import("drizzle-orm");
    await enableMFAForTestUser(
      db,
      users,
      eq,
      testUserId,
      TEST_SECRET,
      TEST_BACKUP_CODES
    );

    // Check initial backup codes count
    const { db: db1 } = await import("../../src/db/connect");
    const { users: users1 } = await import("../../src/db/schema");
    const { eq: eq1 } = await import("drizzle-orm");
    const initialCount = await getBackupCodesCount(
      db1,
      users1,
      eq1,
      testUserId
    );
    expect(initialCount).toBe(3);
    console.log(`Initial backup codes: ${initialCount}`);

    await page.goto("/login");

    // Login with backup code
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/login\/verify/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login\/verify/);
    await page.click("text=Use backup code instead");
    await page.fill('input[type="text"]', TEST_BACKUP_CODES[0]);
    await page.click('button:has-text("Verify")');
    await expect(page).toHaveURL("/");

    // Check backup codes count after use
    const { db: db2 } = await import("../../src/db/connect");
    const { users: users2 } = await import("../../src/db/schema");
    const { eq: eq2 } = await import("drizzle-orm");
    const afterCount = await getBackupCodesCount(db2, users2, eq2, testUserId);
    expect(afterCount).toBe(2);
    console.log(`Backup codes after use: ${afterCount}`);

    // Logout using helper
    await logout(page);
    await page.waitForURL("/login", { timeout: 10000 });
    await expect(page).toHaveURL("/login");

    // Try to use same backup code again
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/login\/verify/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login\/verify/);
    await page.click("text=Use backup code instead");
    await page.fill('input[type="text"]', TEST_BACKUP_CODES[0]);
    await page.click('button:has-text("Verify")');

    // Should show error
    await expect(page.getByText(/invalid/i)).toBeVisible();
    console.log("Used backup code rejected");
  });

  test("should allow skipping MFA in non-PRODUCTION environment", async ({
    page,
  }) => {
    console.log("[Test] Skip MFA in non-PRODUCTION environment");

    // Enable MFA for test user
    const { db } = await import("../../src/db/connect");
    const { users } = await import("../../src/db/schema");
    const { eq } = await import("drizzle-orm");
    await enableMFAForTestUser(
      db,
      users,
      eq,
      testUserId,
      TEST_SECRET,
      TEST_BACKUP_CODES
    );

    await page.goto("/login");

    // Login
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for MFA page
    await page.waitForURL(/\/login\/verify/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login\/verify/);

    // Should see skip button in non-PRODUCTION environment
    const skipButton = page.locator("text=Skip for now");
    await expect(skipButton).toBeVisible();
    console.log("Skip button visible in non-PRODUCTION environment");

    // Click skip
    await skipButton.click();

    // Should be logged in
    await expect(page).toHaveURL("/");
    console.log("Successfully skipped MFA verification");
  });

  test("should handle expired MFA session", async ({ page }) => {
    console.log("[Test] Handle expired MFA session");

    // Enable MFA for test user
    const { db } = await import("../../src/db/connect");
    const { users } = await import("../../src/db/schema");
    const { eq } = await import("drizzle-orm");
    await enableMFAForTestUser(
      db,
      users,
      eq,
      testUserId,
      TEST_SECRET,
      TEST_BACKUP_CODES
    );

    await page.goto("/login");

    // Login
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for MFA page
    await page.waitForURL(/\/login\/verify/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login\/verify/);

    // Try to access verification page directly without userId
    await page.goto("/login/verify");

    // Should redirect back to login
    await expect(page).toHaveURL("/login");
    console.log("✓ Redirected to login without valid session");
  });
});
