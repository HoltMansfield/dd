import { test, expect } from "@playwright/test";
import { TEST_EMAIL, TEST_PASSWORD } from "../global-setup";

test("secure page redirects to login when not authenticated", async ({
  page,
}) => {
  // Try to access secure page without being logged in
  await page.goto(`${process.env.E2E_URL}/secure-page`);

  // Should redirect to login with redirect parameter
  // Check that we're on the login page with the redirect parameter
  expect(page.url()).toContain(`${process.env.E2E_URL}/login`);
  expect(page.url()).toContain("redirect=%2Fsecure-page");
});

test("register, login, and logout flow", async ({ page }) => {
  // Generate a unique email for this test
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const password = "Password123!"; // Meets 12+ char requirement

  // Go to registration page
  await page.goto(`${process.env.E2E_URL}/register`);

  // Fill out registration form with unique credentials
  await page.fill('input[name="email"]', uniqueEmail);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to login page
  await page.waitForTimeout(2000);

  // Ensure we're on the login page
  if (!page.url().includes("/login")) {
    await page.goto(`${process.env.E2E_URL}/login`);
  }

  // Login with the newly created account
  await page.fill('input[name="email"]', uniqueEmail);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  await page.waitForTimeout(2000);

  // Manually navigate to home page if not redirected
  await page.goto(`${process.env.E2E_URL}/`);

  // Confirm logged-in state via navbar burger and logout
  const menuTrigger = page.getByTestId("nav-user-menu-trigger");
  await expect(menuTrigger).toBeVisible({ timeout: 10000 });
  await menuTrigger.click();
  await page.getByTestId("logout-desktop").click();

  // Wait for redirect to login page
  await page.waitForURL("**/login", { timeout: 10000 });
  expect(page.url()).toContain("/login");
});
