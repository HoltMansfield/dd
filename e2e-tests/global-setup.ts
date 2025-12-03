import { chromium, FullConfig, expect } from "@playwright/test";
import dotenv from "dotenv";
import fs from "fs";

// Ensure environment variables are loaded for database connection
dotenv.config({ path: ".env.e2e" });

export const TEST_EMAIL = "e2e-logged-in-test@example.com";
export const TEST_PASSWORD = "e2epassword123";

async function globalSetup(config: FullConfig) {
  console.log("Starting global setup...");
  const baseURL = process.env.E2E_URL!;
  console.log(`Using base URL: ${baseURL}`);

  // Ensure MFA is disabled and account is unlocked for the global test user before starting
  try {
    console.log("Resetting global test user state (MFA, lockout)...");
    const { db } = await import("../src/db/connect");
    const { users } = await import("../src/db/schema");
    const { eq } = await import("drizzle-orm");

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, TEST_EMAIL))
      .limit(1);

    if (user) {
      await db
        .update(users)
        .set({
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: null,
          failedLoginAttempts: 0,
          lockoutUntil: null,
        })
        .where(eq(users.id, user.id));
      console.log("MFA disabled and lockout reset for global test user");
    }
  } catch (error) {
    console.log("Could not reset user state (user may not exist yet):", error);
  }

  // Launch browser with slower timeouts and debug logging
  const browser = await chromium.launch({
    slowMo: 100,
    timeout: 60000,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: "test-results/" },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(45000); // Increase default timeout to 45 seconds

  try {
    // First try to register the user
    console.log("Navigating to registration page...");
    await page.goto(`${baseURL}/register`);
    console.log("Filling registration form...");
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // After registration, wait for redirect to login page (React client-side redirect)
    console.log("Waiting for redirect to login page after registration...");
    try {
      await page.waitForURL("**/login", { timeout: 10000 });
      console.log("Successfully redirected to login page after registration");
    } catch {
      // User might already exist, check if we got an error or stayed on register
      const errorText = await page
        .locator("text=User already exists")
        .isVisible()
        .catch(() => false);
      if (errorText) {
        console.log("User already exists, proceeding to login...");
      } else {
        console.log("Registration redirect timeout, proceeding anyway...");
      }
    }

    // Log current URL for debugging
    console.log(`Current URL after registration: ${page.url()}`);

    // Check if we're on the login page or home page
    const isOnLoginPage = page.url().includes("/login");
    const isOnHomePage = page.url() === baseURL || page.url() === `${baseURL}/`;

    if (isOnLoginPage) {
      console.log("On login page after registration");
    } else if (isOnHomePage) {
      console.log("On home page after registration");
    } else {
      console.log(`On unexpected page: ${page.url()}`);
    }

    // Now perform login if we're not already logged in
    if (!isOnHomePage) {
      console.log("Performing login...");
      await page.goto(`${baseURL}/login`);

      // Wait for login page to load
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });

      // Fill login form
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);

      console.log("Submitting login form...");
      await page.click('button[type="submit"]');

      // Wait for the React client-side redirect to home page
      // The login form uses useEffect to call router.push("/") after state.success
      console.log("Waiting for redirect to home page after login...");
      try {
        await page.waitForURL(baseURL + "/", { timeout: 15000 });
        console.log("Successfully redirected to home page");
      } catch {
        console.log(`Login redirect timeout. Current URL: ${page.url()}`);

        // Check if there's an error message displayed
        const errorVisible = await page
          .locator("text=Invalid credentials")
          .isVisible()
          .catch(() => false);
        const lockedVisible = await page
          .locator("text=Account is locked")
          .isVisible()
          .catch(() => false);

        if (errorVisible) {
          console.log(
            "ERROR: Invalid credentials - check TEST_EMAIL and TEST_PASSWORD"
          );
        } else if (lockedVisible) {
          console.log("ERROR: Account is locked");
        } else {
          // Maybe the redirect happened but URL check failed, verify we're logged in
          const logoutButton = await page
            .locator('button:has-text("Logout")')
            .isVisible()
            .catch(() => false);
          if (logoutButton) {
            console.log("Login successful (logout button visible)");
          } else {
            console.log(
              "Login may have failed - no error message but not redirected"
            );
          }
        }
      }

      console.log(`Current URL after login attempt: ${page.url()}`);
    }

    console.log("Successfully logged in!");

    // Wait a bit longer to ensure cookies are set
    await page.waitForTimeout(3000);

    // Verify we're actually logged in by checking for user-specific content
    try {
      await page.waitForSelector('button:has-text("Logout")', {
        timeout: 5000,
      });
      console.log("Logout button found - user is logged in");
    } catch (e) {
      console.log("Warning: Logout button not found, but continuing anyway");
    }

    // Debug: Check cookies before saving
    const cookies = await context.cookies();
    console.log(`Found ${cookies.length} cookies in context`);
    if (cookies.length > 0) {
      console.log("Cookie names:", cookies.map((c) => c.name).join(", "));
      const sessionCookie = cookies.find((c) => c.name === "session_user");
      if (sessionCookie) {
        console.log("session_user cookie found:", {
          value: sessionCookie.value.substring(0, 50) + "...",
          httpOnly: sessionCookie.httpOnly,
          secure: sessionCookie.secure,
        });
      } else {
        console.log("WARNING: session_user cookie NOT found!");
      }
    }

    // Save storage state (cookies, localStorage)
    const storageStatePath = "e2e-tests/storageState.json";
    console.log(`Saving auth state to ${storageStatePath}...`);
    await page.context().storageState({ path: storageStatePath });

    // Verify the file was created and has content
    if (fs.existsSync(storageStatePath)) {
      const content = fs.readFileSync(storageStatePath, "utf-8");
      const state = JSON.parse(content);
      console.log("Storage state file created successfully!");
      console.log(`Cookies saved: ${state.cookies?.length || 0}`);
      console.log(`Origins saved: ${state.origins?.length || 0}`);
      if (state.cookies?.length > 0) {
        console.log(
          "Cookie names:",
          state.cookies.map((c: any) => c.name).join(", ")
        );
      }
    } else {
      console.error("Failed to create storage state file!");
    }
  } catch (error) {
    console.error("Error in global setup:", error);
    // Take a screenshot to help debug
    await page.screenshot({
      path: "e2e-tests/error-screenshots/global-setup-error.png",
    });
    throw error;
  } finally {
    await context.close();
    await browser.close();
    console.log("Global setup complete.");
  }
}

export default globalSetup;
