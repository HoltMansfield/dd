import { test, expect } from "@playwright/test";
import { openMenu, logout } from "../helpers";
import { db } from "../../src/db/connect";
import { users, auditLogs } from "../../src/db/schema";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

test.describe("Authentication Audit Logging", () => {
  let testUserId: string;
  let testUserEmail: string;
  const testPassword = "TestPassword123!";

  test.beforeAll(async () => {
    // Create a test user
    testUserId = uuidv4();
    testUserEmail = `auth-logging-${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash(testPassword, 10);

    await db.insert(users).values({
      id: testUserId,
      email: testUserEmail,
      passwordHash,
      mfaEnabled: false,
    });

    console.log(`[Auth Logging Test] Created test user: ${testUserEmail}`);
  });

  test.afterAll(async () => {
    // Clean up test user and audit logs
    await db.delete(auditLogs).where(eq(auditLogs.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
    console.log(`[Auth Logging Test] Deleted test user: ${testUserId}`);
  });

  test("should log successful login attempt", async ({ page }) => {
    // Login
    await page.goto(`${process.env.E2E_URL}/login`);
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for successful login
    await page.waitForURL("**/", { timeout: 5000 });

    // Check audit log
    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.userId, testUserId),
          eq(auditLogs.action, "login_success")
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(1);

    expect(logs.length).toBe(1);
    expect(logs[0].success).toBe(1);
    expect(logs[0].metadata).toContain(testUserEmail);
    expect(logs[0].metadata).toContain("mfaRequired");
  });

  test("should log failed login attempt with wrong password", async ({
    page,
  }) => {
    // Attempt login with wrong password
    await page.goto(`${process.env.E2E_URL}/login`);
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', "WrongPassword123!");
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.getByText(/Invalid credentials/i)).toBeVisible();

    // Check audit log
    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.userId, testUserId),
          eq(auditLogs.action, "login_failed")
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(1);

    expect(logs.length).toBe(1);
    expect(logs[0].success).toBe(0);
    expect(logs[0].errorMessage).toBe("Invalid password");
    expect(logs[0].metadata).toContain(testUserEmail);
    expect(logs[0].metadata).toContain("failedAttempts");
  });

  test("should log failed login attempt for non-existent user", async ({
    page,
  }) => {
    const fakeEmail = `nonexistent-${Date.now()}@example.com`;

    // Attempt login with non-existent user
    await page.goto(`${process.env.E2E_URL}/login`);
    await page.fill('input[name="email"]', fakeEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.getByText(/Invalid credentials/i)).toBeVisible();

    // Check audit log
    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.userId, "unknown"),
          eq(auditLogs.action, "login_failed")
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(1);

    expect(logs.length).toBe(1);
    expect(logs[0].success).toBe(0);
    expect(logs[0].errorMessage).toBe("User not found");
    expect(logs[0].metadata).toContain(fakeEmail);
  });

  test("should log account lockout after multiple failed attempts", async ({
    page,
  }) => {
    // Create a fresh user for this test
    const lockoutUserId = uuidv4();
    const lockoutUserEmail = `lockout-test-${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash(testPassword, 10);

    await db.insert(users).values({
      id: lockoutUserId,
      email: lockoutUserEmail,
      passwordHash,
      mfaEnabled: false,
    });

    try {
      // Attempt login 5 times with wrong password to trigger lockout
      for (let i = 0; i < 5; i++) {
        await page.goto(`${process.env.E2E_URL}/login`);
        await page.fill('input[name="email"]', lockoutUserEmail);
        await page.fill('input[name="password"]', "WrongPassword!");
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
      }

      // Check for account lockout log
      const lockoutLogs = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.userId, lockoutUserId),
            eq(auditLogs.action, "account_locked")
          )
        )
        .orderBy(desc(auditLogs.timestamp))
        .limit(1);

      expect(lockoutLogs.length).toBe(1);
      expect(lockoutLogs[0].success).toBe(1);
      expect(lockoutLogs[0].metadata).toContain("failedAttempts");
      expect(lockoutLogs[0].metadata).toContain("lockoutUntil");

      // Verify subsequent login attempt is logged as locked
      await page.goto(`${process.env.E2E_URL}/login`);
      await page.fill('input[name="email"]', lockoutUserEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');

      const lockedAttemptLogs = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.userId, lockoutUserId),
            eq(auditLogs.action, "login_failed")
          )
        )
        .orderBy(desc(auditLogs.timestamp))
        .limit(1);

      expect(lockedAttemptLogs.length).toBe(1);
      expect(lockedAttemptLogs[0].errorMessage).toBe("Account locked");
    } finally {
      // Clean up
      await db.delete(auditLogs).where(eq(auditLogs.userId, lockoutUserId));
      await db.delete(users).where(eq(users.id, lockoutUserId));
    }
  });

  test("should log logout action", async ({ page }) => {
    // Login first
    await page.goto(`${process.env.E2E_URL}/login`);
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/", { timeout: 5000 });

    // Logout
    await logout(page);

    // Wait for redirect to login
    await page.waitForURL("**/login", { timeout: 5000 });

    // Check audit log
    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.userId, testUserId), eq(auditLogs.action, "logout"))
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(1);

    expect(logs.length).toBe(1);
    expect(logs[0].success).toBe(1);
    expect(logs[0].metadata).toContain(testUserEmail);
  });

  test("should include IP address and user agent in audit logs", async ({
    page,
  }) => {
    // Login
    await page.goto(`${process.env.E2E_URL}/login`);
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/", { timeout: 5000 });

    // Check audit log has IP and user agent
    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.userId, testUserId),
          eq(auditLogs.action, "login_success")
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(1);

    expect(logs.length).toBe(1);
    expect(logs[0].ipAddress).toBeTruthy();
    expect(logs[0].ipAddress).not.toBe("unknown");
    expect(logs[0].userAgent).toBeTruthy();
    expect(logs[0].userAgent).not.toBe("unknown");
  });

  test("should log all authentication events in chronological order", async ({
    page,
  }) => {
    // Perform a sequence of authentication actions
    // 1. Failed login
    await page.goto(`${process.env.E2E_URL}/login`);
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', "WrongPassword!");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // 2. Successful login
    await page.goto(`${process.env.E2E_URL}/login`);
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/", { timeout: 5000 });

    // 3. Logout
    await logout(page);
    await page.waitForURL("**/login", { timeout: 5000 });

    // Get all logs for this user
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, testUserId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(10);

    // Should have at least 3 logs (failed, success, logout)
    expect(logs.length).toBeGreaterThanOrEqual(3);

    // Verify the sequence (most recent first)
    const actions = logs.map((log) => log.action);
    expect(actions).toContain("login_failed");
    expect(actions).toContain("login_success");
    expect(actions).toContain("logout");
  });
});
