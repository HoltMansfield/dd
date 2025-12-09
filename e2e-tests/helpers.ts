import { Page } from "@playwright/test";

/**
 * Opens the navigation menu by clicking the visible "Open Menu" button.
 * Works for both mobile and desktop viewports.
 */
export async function openMenu(page: Page) {
  // Find all "Open Menu" buttons (there are two - one for mobile, one for desktop)
  // Click the one that's actually visible
  const menuButtons = page.locator('button[aria-label="Open Menu"]');
  const count = await menuButtons.count();

  for (let i = 0; i < count; i++) {
    const button = menuButtons.nth(i);
    if (await button.isVisible()) {
      await button.click();
      break;
    }
  }

  // Wait a bit for the drawer animation
  await page.waitForTimeout(300);
}

/**
 * Logs out the current user by opening the menu and clicking logout.
 * Works for both mobile and desktop viewports.
 */
export async function logout(page: Page) {
  await openMenu(page);

  // Click the logout button (try both mobile and desktop test IDs)
  const logoutButton = page.locator(
    '[data-testid="logout-desktop"], [data-testid="logout-mobile"]'
  );
  await logoutButton.first().click();
}
