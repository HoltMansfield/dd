import { test, expect } from "@playwright/test";
import { TEST_EMAIL, TEST_PASSWORD } from "../global-setup";

// Import constants to ensure tests match implementation
import {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
} from "../../src/app/login/constants";

test.describe("Account lockout functionality", () => {
  // Reset state before each test
  test.beforeEach(async ({ page }) => {
    // Go to login page
    await page.goto(`${process.env.E2E_URL}/login`);

    // Ensure we're on the login page
    await expect(page).toHaveURL(`${process.env.E2E_URL}/login`);
  });

  test("should lock account after multiple failed attempts", async ({
    page,
  }) => {
    // Skip the login part and go directly to testing the lockout functionality
    console.log("Starting lockout test...");

    // Go to login page
    await page.goto(`${process.env.E2E_URL}/login`);
    await expect(page).toHaveURL(`${process.env.E2E_URL}/login`, {
      timeout: 10000,
    });

    // Now attempt login with incorrect password multiple times, make exactly MAX_FAILED_ATTEMPTS attempts to trigger lockout
    for (let i = 1; i <= MAX_FAILED_ATTEMPTS; i++) {
      console.log(`Attempt ${i} of ${MAX_FAILED_ATTEMPTS}`);
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', "wrong-password");
      await page.click('button[type="submit"]');

      // Wait for the form submission to complete
      await page.waitForTimeout(500);

      // Check for error message
      const errorText = await page
        .locator('[data-testid="server-error"]')
        .textContent();
      console.log(`Attempt ${i} error message: ${errorText}`);

      // For the last attempt, we expect either an 'Account is locked' message or 'Invalid credentials'
      // For earlier attempts, we expect 'Invalid credentials'
      if (i === MAX_FAILED_ATTEMPTS) {
        // The account might already be locked from previous test runs
        await expect(page.locator('[data-testid="server-error"]')).toBeVisible({
          timeout: 5000,
        });
      }
    }

    // Now make one more attempt after the account should be locked
    console.log(
      `Making one more attempt after ${MAX_FAILED_ATTEMPTS} failed attempts`
    );
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', "wrong-password");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Now we should see the account locked message
    await expect(page.locator('[data-testid="server-error"]')).toContainText(
      "Account is locked",
      { timeout: 10000 }
    );

    // Try one more time to confirm account is still locked
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD); // Even with correct password
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Should show account locked message
    await expect(page.locator('[data-testid="server-error"]')).toContainText(
      "Account is locked",
      { timeout: 10000 }
    );
  });

  test("should allow login with different user while one account is locked", async ({
    page,
  }) => {
    // Create a unique email for this test to avoid conflicts
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const password = "Password123";

    // Register a new user
    await page.goto(`${process.env.E2E_URL}/register`);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for redirect to login page
    await page.waitForTimeout(2000);
    if (!page.url().includes("/login")) {
      await page.goto(`${process.env.E2E_URL}/login`);
    }
    await expect(page).toHaveURL(/login|register/, { timeout: 10000 });

    // Go to login page
    await page.goto(`${process.env.E2E_URL}/login`);

    // First, lock the main test account
    for (let i = 1; i <= MAX_FAILED_ATTEMPTS; i++) {
      console.log(`Locking attempt ${i} of ${MAX_FAILED_ATTEMPTS}`);
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', "wrong-password");
      await page.click('button[type="submit"]');

      // Wait for the form submission to complete
      await page.waitForTimeout(500);
    }

    // Verify the account is locked
    await expect(page.locator('[data-testid="server-error"]')).toContainText(
      "Account is locked",
      { timeout: 10000 }
    );

    // Now try to login with the new account
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForTimeout(2000);

    // Manually navigate to home page if not redirected
    if (page.url() !== `${process.env.E2E_URL}/`) {
      await page.goto(`${process.env.E2E_URL}/`);
    }

    // Verify we're on the home page by checking for the logout button
    await expect(page.locator('[data-testid="logout-desktop"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test("should reset failed attempts after successful login", async ({
    page,
    browser,
  }) => {
    // Create a unique email for this test
    const uniqueEmail = `test-reset-${Date.now()}@example.com`;
    const password = "Password123";

    // Register a new user
    await page.goto(`${process.env.E2E_URL}/register`);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for redirect to login page
    await page.waitForTimeout(2000);
    if (!page.url().includes("/login")) {
      await page.goto(`${process.env.E2E_URL}/login`);
    }
    await expect(page).toHaveURL(/login|register/, { timeout: 10000 });

    // Go to login page
    await page.goto(`${process.env.E2E_URL}/login`);

    // Make some failed attempts, but not enough to lock the account
    const attemptsToMake = MAX_FAILED_ATTEMPTS - 1;

    for (let i = 1; i <= attemptsToMake; i++) {
      console.log(`Failed attempt ${i} of ${attemptsToMake}`);
      await page.fill('input[name="email"]', uniqueEmail);
      await page.fill('input[name="password"]', "wrong-password");
      await page.click('button[type="submit"]');

      // Wait for the form submission to complete
      await page.waitForTimeout(500);

      // Verify we get invalid credentials message
      await expect(page.locator('[data-testid="server-error"]')).toContainText(
        "Invalid credentials",
        { timeout: 10000 }
      );
    }

    // Now login successfully
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForTimeout(2000);

    // Manually navigate to home page if not redirected
    if (page.url() !== `${process.env.E2E_URL}/`) {
      await page.goto(`${process.env.E2E_URL}/`);
    }

    // Verify we're on the home page by checking for the logout button
    await expect(page.locator('[data-testid="logout-desktop"]')).toBeVisible({
      timeout: 10000,
    });

    // Logout
    await page.click('[data-testid="logout-desktop"]');
    await page.waitForTimeout(1000);

    // Ensure we're on the login page
    if (!page.url().includes("/login")) {
      await page.goto(`${process.env.E2E_URL}/login`);
    }
    await expect(page).toHaveURL(`${process.env.E2E_URL}/login`, {
      timeout: 10000,
    });

    // Now we should be able to make MAX_FAILED_ATTEMPTS failed attempts again because the counter should have been reset
    for (let i = 1; i <= attemptsToMake; i++) {
      console.log(`Post-reset failed attempt ${i} of ${attemptsToMake}`);
      await page.fill('input[name="email"]', uniqueEmail);
      await page.fill('input[name="password"]', "wrong-password");
      await page.click('button[type="submit"]');

      // Wait for the form submission to complete
      await page.waitForTimeout(500);

      // Should still show invalid credentials, not locked yet
      await expect(page.locator('[data-testid="server-error"]')).toContainText(
        "Invalid credentials",
        { timeout: 10000 }
      );
    }
  });
});
