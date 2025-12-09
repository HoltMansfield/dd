import { test, expect } from "@playwright/test";

test.describe("Session Timeout", () => {
  test("should redirect to login after session timeout", async ({
    page,
    context,
  }) => {
    // Start from home page (already logged in via storageState)
    await page.goto(`${process.env.E2E_URL}/`);

    // Get the session timestamp cookie
    const cookies = await context.cookies();
    const sessionTimestamp = cookies.find(
      (c) => c.name === "session_timestamp"
    );
    expect(sessionTimestamp).toBeDefined();

    // Set the session timestamp to 31 minutes ago (past the 30-minute timeout)
    const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000;
    await context.addCookies([
      {
        name: "session_timestamp",
        value: thirtyOneMinutesAgo.toString(),
        domain: new URL(process.env.E2E_URL!).hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    // Navigate to a protected page
    await page.goto(`${process.env.E2E_URL}/documents`);

    // Should be redirected to login with timeout parameter
    await page.waitForURL("**/login?timeout=true", { timeout: 10000 });
    expect(page.url()).toContain("/login?timeout=true");

    // Should show timeout message
    await expect(page.getByText("Session Expired")).toBeVisible();
    await expect(
      page.getByText(/session has expired due to inactivity/i)
    ).toBeVisible();
  });

  test("should redirect to login after maximum session duration", async ({
    page,
    context,
  }) => {
    // Start from home page (already logged in via storageState)
    await page.goto(`${process.env.E2E_URL}/`);

    // Set the session created timestamp to 13 hours ago (past the 12-hour max)
    const thirteenHoursAgo = Date.now() - 13 * 60 * 60 * 1000;
    await context.addCookies([
      {
        name: "session_created",
        value: thirteenHoursAgo.toString(),
        domain: new URL(process.env.E2E_URL!).hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    // Also set a recent activity timestamp (to ensure max duration is checked)
    const now = Date.now();
    await context.addCookies([
      {
        name: "session_timestamp",
        value: now.toString(),
        domain: new URL(process.env.E2E_URL!).hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    // Navigate to a protected page
    await page.goto(`${process.env.E2E_URL}/documents`);

    // Should be redirected to login with timeout parameter
    await page.waitForURL("**/login?timeout=true", { timeout: 10000 });
    expect(page.url()).toContain("/login?timeout=true");
  });

  test("should update session timestamp on activity", async ({
    page,
    context,
  }) => {
    // Start from home page (already logged in via storageState)
    await page.goto(`${process.env.E2E_URL}/`);

    // Get initial timestamp
    let cookies = await context.cookies();
    let sessionTimestamp = cookies.find((c) => c.name === "session_timestamp");
    const initialTimestamp = sessionTimestamp?.value;
    expect(initialTimestamp).toBeDefined();

    // Wait a moment
    await page.waitForTimeout(1000);

    // Navigate to another page (this should update the timestamp)
    await page.goto(`${process.env.E2E_URL}/documents`);

    // Get updated timestamp
    cookies = await context.cookies();
    sessionTimestamp = cookies.find((c) => c.name === "session_timestamp");
    const updatedTimestamp = sessionTimestamp?.value;

    // Timestamp should be updated
    expect(updatedTimestamp).toBeDefined();
    expect(parseInt(updatedTimestamp!)).toBeGreaterThan(
      parseInt(initialTimestamp!)
    );
  });

  test("should allow session extension via API", async ({ page }) => {
    // Start from home page (already logged in via storageState)
    await page.goto(`${process.env.E2E_URL}/`);

    // Call the extend-session API
    const response = await page.request.post(
      `${process.env.E2E_URL}/api/extend-session`
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.timestamp).toBeDefined();
  });

  test("should preserve session across page navigations", async ({
    page,
    context,
  }) => {
    // Start from home page (already logged in via storageState)
    await page.goto(`${process.env.E2E_URL}/`);

    // Navigate to multiple pages
    await page.goto(`${process.env.E2E_URL}/documents`);
    await page.goto(`${process.env.E2E_URL}/settings/security`);
    await page.goto(`${process.env.E2E_URL}/`);

    // Should still be authenticated
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === "session_user");
    expect(sessionCookie).toBeDefined();

    // Should not be redirected to login
    expect(page.url()).not.toContain("/login");
  });
});
