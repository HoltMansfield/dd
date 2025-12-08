# E2E Testing Guide for Development

This guide explains how to run E2E tests during active development, particularly useful for AI coding agents making incremental changes.

## Overview

The optimal workflow for E2E test development involves:

1. Running `npm run test:e2e -- --ui` (automatically starts server, builds app, sets up test DB)
2. Making incremental changes → Playwright detects changes → Tests auto-rerun
3. See results in real-time without manual reruns

## Prerequisites

- Node.js and npm installed
- Dependencies installed (`npm install`)
- Docker installed (for E2E test database)
- Environment variables configured in `.env.e2e`

## Workflow

### Run E2E Tests in Watch Mode

**RECOMMENDED: UI Mode with Watch**

```bash
npm run test:e2e -- --ui
```

**What this does:**

- Starts E2E database (Docker PostgreSQL)
- Creates database schema (migrations)
- Builds the Next.js app
- Starts server on port 3001
- Opens Playwright UI in your browser
- **Watches for file changes** (code, tests, components, etc.)
- **Automatically reruns tests** when you save changes
- Shows test results in real-time
- Allows you to debug individual tests
- **No manual rerun needed!**
- Cleans up database when you stop (Ctrl+C)

**Alternative: Watch mode in terminal (no UI)**

```bash
npm run test:e2e -- --watch
```

- Same auto-rerun behavior
- Output in terminal instead of browser UI

**Alternative: Headed mode (manual rerun)**

```bash
npm run test:e2e -- --headed
```

- Shows browser but doesn't watch for changes
- You must manually rerun after each change
- Good for one-off debugging

**Alternative: Run specific test file in watch mode**

```bash
npm run test:e2e -- src/e2e-tests/logged-in/file-upload.spec.ts --ui
```

- Focuses on one test file
- Still watches for changes and auto-reruns

---

## For AI Agents: Step-by-Step Instructions

### Start Tests

1. **Run tests in watch mode:**

   ```bash
   npm run test:e2e -- --ui
   ```

   - This automatically starts everything (database, server, tests)
   - Run as a background/async process
   - Wait 10-15 seconds for everything to start
   - Playwright UI will open in browser

### Making Changes

1. **Edit code files** (components, pages, server actions, tests, etc.)
2. **Save the file**
3. **Playwright detects the change and automatically reruns tests**
4. **See results immediately in Playwright UI**
5. **Repeat until tests pass**

**No manual rerun needed!** Watch mode handles it automatically.

### Stopping Process

```bash
# Stop watch mode (stops everything: tests, server, database)
Ctrl+C
```

---

## Common Test Commands

### Run all E2E tests (headless)

```bash
npm run test:e2e
```

### Run all E2E tests (headed - see browser)

```bash
npm run test:e2e -- --headed
```

### Run specific test file

```bash
npm run test:e2e -- src/e2e-tests/logged-in/file-upload.spec.ts
```

### Run tests matching a pattern

```bash
npm run test:e2e -- -g "upload"
```

### Run tests in debug mode

```bash
npm run test:e2e -- --debug
```

### Run tests with Playwright UI

```bash
npm run test:e2e -- --ui
```

### Run tests in parallel (faster)

```bash
npm run test:e2e -- --workers=4
```

### Run tests in watch mode (auto-rerun on changes)

```bash
npm run test:e2e -- --watch
```

---

## Test Structure

E2E tests are located in:

```
src/e2e-tests/
├── logged-in/          # Tests requiring authentication
│   ├── file-upload.spec.ts
│   ├── mfa.spec.ts
│   └── ...
├── logged-out/         # Tests for unauthenticated users
│   ├── login.spec.ts
│   ├── signup.spec.ts
│   └── ...
└── fixtures/           # Shared test fixtures and helpers
    └── ...
```

---

## Environment Variables for E2E Tests

E2E tests use `.env.e2e` with E2E-specific configuration:

```bash
# .env.e2e (for E2E testing)
E2E_URL=http://localhost:3001
DB_URL=postgresql://test:test@localhost:5433/testdb-dd
NEXT_PUBLIC_APP_ENV=E2E
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Important:**

- `NEXT_PUBLIC_APP_ENV=E2E` disables certain features (like Sentry) during tests
- E2E database runs in Docker on port 5433 (separate from dev database)
- Tests will create/delete test users automatically
- Server runs on port 3001 (separate from dev server on 3000)

---

## Debugging Failed Tests

### 1. Run test in headed mode

```bash
npm run test:e2e -- src/e2e-tests/path/to/test.spec.ts --headed
```

Watch the browser to see what's happening.

### 2. Run test in debug mode

```bash
npm run test:e2e -- src/e2e-tests/path/to/test.spec.ts --debug
```

Opens Playwright Inspector for step-by-step debugging.

### 3. Add console.log statements

```typescript
test("my test", async ({ page }) => {
  console.log("Current URL:", page.url());
  // ... rest of test
});
```

### 4. Take screenshots on failure

```typescript
test("my test", async ({ page }) => {
  try {
    // ... test code
  } catch (error) {
    await page.screenshot({ path: "failure.png" });
    throw error;
  }
});
```

### 5. Check test artifacts

Failed tests automatically save:

- Screenshots: `test-results/*/test-failed-1.png`
- Videos: `test-results/*/video.webm`
- Traces: `test-results/*/trace.zip`

View trace:

```bash
npx playwright show-trace test-results/path/to/trace.zip
```

---

## Common Issues & Solutions

### Issue: "Error: page.goto: net::ERR_CONNECTION_REFUSED"

**Cause:** Test server failed to start

**Possible reasons:**

- Port 3001 is already in use
- Build failed
- Docker database failed to start

**Solution:**

```bash
# Check if port 3001 is in use
lsof -i :3001

# Check if Docker is running
docker ps

# Try running tests again
npm run test:e2e
```

---

### Issue: "Timeout 30000ms exceeded"

**Cause:** Element not found or page not loading

**Solutions:**

1. Increase timeout:

   ```typescript
   await page.waitForSelector("button", { timeout: 60000 });
   ```

2. Check if element exists:

   ```typescript
   const button = await page.locator("button").count();
   console.log("Button count:", button);
   ```

3. Wait for network idle:
   ```typescript
   await page.goto("/", { waitUntil: "networkidle" });
   ```

---

### Issue: "Database is locked" or "Unique constraint violation"

**Cause:** Test data conflicts or parallel test execution issues

**Solutions:**

1. Use unique test data:

   ```typescript
   const email = `test-${Date.now()}@example.com`;
   ```

2. Clean up after tests:

   ```typescript
   test.afterEach(async () => {
     // Delete test user
     await deleteTestUser(email);
   });
   ```

3. Run tests serially (slower but safer):
   ```bash
   npm run test:e2e -- --workers=1
   ```

---

### Issue: Tests pass locally but fail in CI

**Possible causes:**

1. **Timing issues** - CI is slower, needs longer timeouts
2. **Environment differences** - Missing env vars in CI
3. **Database state** - CI database not properly seeded
4. **Parallel execution** - Tests interfere with each other

**Solutions:**

1. Add CI-specific timeouts in `playwright.config.ts`
2. Verify all env vars are set in GitHub Secrets
3. Ensure database migrations run before tests
4. Use test isolation (unique data per test)

---

## Best Practices for Test Development

### ✅ DO:

- **Use data-testid attributes** for reliable selectors

  ```typescript
  await page.locator('[data-testid="upload-button"]').click();
  ```

- **Wait for specific conditions** instead of arbitrary delays

  ```typescript
  await page.waitForSelector('[data-testid="success-message"]');
  // NOT: await page.waitForTimeout(2000);
  ```

- **Use unique test data** to avoid conflicts

  ```typescript
  const email = `test-${Date.now()}@example.com`;
  ```

- **Clean up after tests** to avoid side effects

  ```typescript
  test.afterEach(async () => {
    await cleanup();
  });
  ```

- **Test user flows, not implementation details**

  ```typescript
  // Good: Test what user sees/does
  await page.click("text=Upload Document");
  await expect(page.locator("text=Upload successful")).toBeVisible();

  // Bad: Test internal state
  // await expect(uploadFunction).toHaveBeenCalled();
  ```

### ❌ DON'T:

- **Don't use arbitrary waits**

  ```typescript
  await page.waitForTimeout(5000); // BAD
  ```

- **Don't rely on CSS classes or IDs that might change**

  ```typescript
  await page.locator(".btn-primary-123").click(); // BAD
  ```

- **Don't share state between tests**

  ```typescript
  let sharedUser; // BAD - tests should be isolated
  ```

- **Don't test external APIs directly** (mock them instead)

- **Don't make tests too granular** (test user flows, not every function)

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Pull requests
- Pushes to main
- Manual workflow dispatch

**Workflow file:** `.github/workflows/e2e-tests.yml`

**Sharding:** Tests are split across 8 parallel jobs for speed

**View results:** GitHub Actions → E2E Tests workflow

---

## Performance Tips

### Run tests faster locally:

1. **Use headed mode only when debugging**

   ```bash
   # Fast (headless)
   npm run test:e2e

   # Slow (headed)
   npm run test:e2e -- --headed
   ```

2. **Run specific tests instead of full suite**

   ```bash
   npm run test:e2e -- src/e2e-tests/logged-in/file-upload.spec.ts
   ```

3. **Use parallel workers**

   ```bash
   npm run test:e2e -- --workers=4
   ```

4. **Skip slow tests during development**

   ```typescript
   test.skip("slow test", async ({ page }) => {
     // This test won't run
   });
   ```

5. **Use test.only for focused testing**
   ```typescript
   test.only("test I am working on", async ({ page }) => {
     // Only this test will run
   });
   ```

---

## AI Agent Workflow Example

Here's a complete example of how an AI agent should work with E2E tests:

### Scenario: Fix a failing file upload test

```bash
# Step 1: Check if dev server is running
curl http://localhost:3000 -I

# Step 2: If not running, start it (background process)
npm run dev &
sleep 5  # Wait for server to start

# Step 3: Run the specific failing test to see the error
npm run test:e2e -- src/e2e-tests/logged-in/file-upload.spec.ts --headed

# Step 4: Analyze the error output
# Example error: "Button not found: Upload Document"

# Step 5: Check the component code
cat src/components/DocumentUpload.tsx

# Step 6: Identify the issue
# Issue: Button text changed from "Upload Document" to "Upload File"

# Step 7: Fix the test
# Edit src/e2e-tests/logged-in/file-upload.spec.ts
# Change: await page.click('text=Upload Document');
# To:     await page.click('text=Upload File');

# Step 8: Re-run the test
npm run test:e2e -- src/e2e-tests/logged-in/file-upload.spec.ts

# Step 9: Verify it passes
# ✓ file upload test passes

# Step 10: Run full test suite to ensure no regressions
npm run test:e2e

# Step 11: Clean up
# Stop dev server if you started it
pkill -f "next dev"
```

---

## Quick Reference

| Task                    | Command                                            |
| ----------------------- | -------------------------------------------------- |
| Start dev server        | `npm run dev`                                      |
| Run all E2E tests       | `npm run test:e2e`                                 |
| Run tests with UI       | `npm run test:e2e -- --ui`                         |
| Run tests headed        | `npm run test:e2e -- --headed`                     |
| Run specific test       | `npm run test:e2e -- path/to/test.spec.ts`         |
| Debug test              | `npm run test:e2e -- path/to/test.spec.ts --debug` |
| Run tests in watch mode | `npm run test:e2e -- --watch`                      |
| Run tests in parallel   | `npm run test:e2e -- --workers=4`                  |
| View test trace         | `npx playwright show-trace path/to/trace.zip`      |

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Debugging Guide](https://playwright.dev/docs/debug)
- [Next.js Testing Documentation](https://nextjs.org/docs/testing)

---

**Last Updated:** December 7, 2024  
**Maintained By:** Engineering Team
