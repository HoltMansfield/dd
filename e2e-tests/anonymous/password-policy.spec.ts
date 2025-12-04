import { test, expect } from "@playwright/test";

test.describe("Password Policy Enforcement", () => {
  test("should reject password with less than 12 characters", async ({
    page,
  }) => {
    await page.goto(`${process.env.E2E_URL}/register`);

    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', "Short1!");
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(
      page.locator("text=/Password must be at least 12 characters/i")
    ).toBeVisible();
  });

  test("should reject password without uppercase letter", async ({ page }) => {
    await page.goto(`${process.env.E2E_URL}/register`);

    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', "password123!");
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(
      page.locator("text=/at least one uppercase letter/i")
    ).toBeVisible();
  });

  test("should reject password without lowercase letter", async ({ page }) => {
    await page.goto(`${process.env.E2E_URL}/register`);

    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', "PASSWORD123!");
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(
      page.locator("text=/at least one lowercase letter/i")
    ).toBeVisible();
  });

  test("should reject password without number", async ({ page }) => {
    await page.goto(`${process.env.E2E_URL}/register`);

    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', "PasswordOnly!");
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator("text=/at least one number/i")).toBeVisible();
  });

  test("should reject password without special character", async ({ page }) => {
    await page.goto(`${process.env.E2E_URL}/register`);

    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', "Password1234");
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(
      page.locator("text=/at least one special character/i")
    ).toBeVisible();
  });

  test("should accept password meeting all requirements", async ({ page }) => {
    await page.goto(`${process.env.E2E_URL}/register`);

    const uniqueEmail = `test-${Date.now()}@example.com`;
    const strongPassword = "StrongPass123!";

    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', strongPassword);

    // All requirements should be checked
    await expect(page.locator("text=/At least 12 characters/i")).toBeVisible();
    await expect(
      page.locator("text=/At least one uppercase letter/i")
    ).toBeVisible();
    await expect(
      page.locator("text=/At least one lowercase letter/i")
    ).toBeVisible();
    await expect(page.locator("text=/At least one number/i")).toBeVisible();
    await expect(
      page.locator("text=/At least one special character/i")
    ).toBeVisible();

    await page.click('button[type="submit"]');

    // Should redirect to login page on success
    await page.waitForURL("**/login", { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("should show real-time password requirements feedback", async ({
    page,
  }) => {
    await page.goto(`${process.env.E2E_URL}/register`);

    // Initially all requirements should be shown
    await expect(page.locator("text=/Password Requirements/i")).toBeVisible();

    // Type a weak password and verify requirements are shown
    await page.fill('input[name="password"]', "weak");

    // All requirement items should be visible
    await expect(page.locator("text=/At least 12 characters/i")).toBeVisible();
    await expect(
      page.locator("text=/At least one uppercase letter/i")
    ).toBeVisible();
    await expect(
      page.locator("text=/At least one lowercase letter/i")
    ).toBeVisible();
    await expect(page.locator("text=/At least one number/i")).toBeVisible();
    await expect(
      page.locator("text=/At least one special character/i")
    ).toBeVisible();
  });
});
