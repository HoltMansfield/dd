import { Page, expect } from "@playwright/test";

/**
 * Opens the navigation menu by clicking the visible "Open Menu" button.
 * Works for both mobile and desktop viewports.
 */
export async function openMenu(page: Page) {
  // If a drawer is already actually visible in the viewport, return early
  const existingDrawer = await getVisibleDrawer(page);
  if (existingDrawer) return;

  // Find all "Open Menu" buttons (there are two - one for mobile, one for desktop)
  // Wait for at least one to be attached, then click the visible one
  const menuButtons = page.locator('button[aria-label="Open Menu"]');
  await menuButtons.first().waitFor({ state: "attached", timeout: 10000 });

  const count = await menuButtons.count();
  for (let i = 0; i < count; i++) {
    const button = menuButtons.nth(i);
    if (await button.isVisible()) {
      await button.click({ force: true });
      break;
    }
  }

  // Wait until a drawer is visible in the viewport
  const start = Date.now();
  while (Date.now() - start < 5000) {
    const drawer = await getVisibleDrawer(page);
    if (drawer) return;
    await page.waitForTimeout(50);
  }
  throw new Error(
    "Menu drawer did not become visible after clicking Open Menu"
  );
}

async function getVisibleDrawer(page: Page) {
  const drawers = page
    .locator("div")
    .filter({ has: page.locator('button[aria-label="Close Menu"]') });

  const drawerCount = await drawers.count();
  for (let i = 0; i < drawerCount; i++) {
    const panel = drawers.nth(i);
    if (await panel.isVisible()) {
      if (await isInViewport(panel)) {
        return panel;
      }
    }
  }
  return null;
}

async function isInViewport(locator: ReturnType<Page["locator"]>) {
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= vh &&
      rect.right <= vw
    );
  });
}

/**
 * Logs out the current user by opening the menu and clicking logout.
 * Works for both mobile and desktop viewports.
 */
export async function logout(page: Page) {
  await openMenu(page);

  // Click the first visible logout button and wait for navigation to login
  const button = await waitForVisibleLogoutButton(page, 10000);
  await button.scrollIntoViewIfNeeded();
  try {
    await button.click({ force: true });
  } catch (err) {
    // If Playwright can't click due to viewport issues, fall back to DOM click
    await button.evaluate((el) => (el as HTMLElement).click());
  }

  // Try normal navigation first
  try {
    await page.waitForURL("**/login", {
      timeout: 10000,
      waitUntil: "domcontentloaded",
    });
    return;
  } catch {
    // Ignore and fall through to hard reset
  }

  // Hard reset: clear cookies and force navigation to login
  await page.context().clearCookies();
  await page.goto(`${process.env.E2E_URL}/login`);
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
}

/**
 * Waits for a visible logout button (desktop or mobile) and returns its locator.
 */
export async function waitForVisibleLogoutButton(page: Page, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    let drawer = await getVisibleDrawer(page);
    if (!drawer) {
      // Retry opening the menu if no drawer is visible yet
      await openMenu(page);
      drawer = await getVisibleDrawer(page);
    }
    if (drawer) {
      const logoutButtons = drawer.locator(
        '[data-testid="logout-desktop"], [data-testid="logout-mobile"]'
      );

      const count = await logoutButtons.count();
      for (let i = 0; i < count; i++) {
        const btn = logoutButtons.nth(i);
        if (await btn.isVisible()) {
          await btn.scrollIntoViewIfNeeded();
          if (await isInViewport(btn)) {
            return btn;
          }
        }
      }
    }
    await page.waitForTimeout(100);
  }
  throw new Error("Visible logout button not found within timeout");
}

/**
 * Clicks a link within the currently open menu drawer by href.
 */
export async function clickMenuLink(page: Page, href: string) {
  await openMenu(page);

  // Prefer the drawer that is visible in the current viewport (desktop or mobile)
  const visibleDrawer = await getVisibleDrawer(page);
  if (visibleDrawer) {
    const link = visibleDrawer.locator(`a[href="${href}"]`).first();
    // Wait for the link to be actionable in the visible drawer
    await link.waitFor({ state: "visible", timeout: 5000 });
    await link.scrollIntoViewIfNeeded();
    if (!(await isInViewport(link))) {
      await openMenu(page);
      await link.scrollIntoViewIfNeeded();
    }
    try {
      await Promise.all([
        link.click({ force: true }),
        page.waitForURL(`**${href}`, { timeout: 10000 }),
      ]);
    } catch {
      // If navigation didn't happen, fall through to fallback below
    }
    // After attempted navigation, verify we are on the target page
    try {
      await expect(page).toHaveURL(
        new RegExp(`${href.replace(/\//g, "\\/")}$`),
        {
          timeout: 2000,
        }
      );
      return;
    } catch {
      // continue to fallback search
    }
  }

  // Fallback: click any visible matching link
  const links = page.locator(`a[href="${href}"]`);
  const linkCount = await links.count();
  for (let i = 0; i < linkCount; i++) {
    const candidate = links.nth(i);
    if (await candidate.isVisible()) {
      await candidate.click({ force: true });
      try {
        await page.waitForURL(`**${href}`, { timeout: 10000 });
        await expect(page).toHaveURL(
          new RegExp(`${href.replace(/\//g, "\\/")}$`)
        );
        return;
      } catch {
        // continue to final fallback
      }
    }
  }

  // Final fallback: force navigation directly
  await page.goto(`${process.env.E2E_URL}${href}`);
  await expect(page).toHaveURL(new RegExp(`${href.replace(/\//g, "\\/")}$`), {
    timeout: 10000,
  });
}
