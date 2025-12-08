# AI Agent E2E Testing Workflow

Quick reference for AI coding agents working with E2E tests.

## TL;DR

1. Run tests in watch mode: `npm run test:e2e -- --ui`
2. Make changes → Playwright detects changes → Tests auto-rerun
3. Iterate until tests pass

**Note:** `npm run test:e2e` automatically starts the dev server, builds the app, and sets up the test database. You don't need to start anything manually!

---

## Complete Workflow

### 1. Run E2E Tests in Watch Mode

**Option A: UI Mode (RECOMMENDED - auto-reruns on changes)**

```bash
npm run test:e2e -- --ui
```

- Opens Playwright UI in browser
- Watches for file changes
- Auto-reruns tests when you save changes
- Best for iterative development

**Option B: Watch mode in terminal**

```bash
npm run test:e2e -- --watch
```

- Watches for file changes
- Auto-reruns tests in terminal
- No UI, just output

**Option C: Headed mode (manual rerun)**

```bash
npm run test:e2e -- --headed
```

- Shows browser
- You must manually rerun after changes
- Good for one-off debugging

**Option D: Specific test in UI mode**

```bash
npm run test:e2e -- src/e2e-tests/path/to/test.spec.ts --ui
```

### 2. Make Changes & Watch Tests Auto-Rerun

**The Magic of Watch Mode:**

1. Edit code files (components, pages, actions, tests, etc.)
2. Save the file
3. Playwright detects the change
4. Tests automatically rerun
5. See results immediately

**No need to manually rerun tests!** Watch mode handles it automatically.

### 3. Iterate Until Tests Pass

- Make a change → Save → Watch test rerun → See result
- Fix issues → Save → Watch test rerun → See result
- Repeat until all tests pass

### 4. Clean Up

```bash
# Stop watch mode when done
# Ctrl+C
```

---

## Common Commands

```bash
# Run specific test file
npm run test:e2e -- src/e2e-tests/logged-in/file-upload.spec.ts

# Run tests matching pattern
npm run test:e2e -- -g "upload"

# Debug mode (step through test)
npm run test:e2e -- src/e2e-tests/path/to/test.spec.ts --debug

# Headed mode (see browser)
npm run test:e2e -- --headed

# Watch mode (auto-rerun on changes)
npm run test:e2e -- --watch

# Parallel execution (faster)
npm run test:e2e -- --workers=4
```

---

## Process Management for AI Agents

### Starting Tests

**Using run_command tool with Blocking=false:**

```typescript
// Start tests in watch mode (non-blocking)
// This automatically starts the server, builds the app, and sets up the test DB
run_command({
  CommandLine: "npm run test:e2e -- --ui",
  Cwd: "/path/to/project",
  Blocking: false,
  WaitMsBeforeAsync: 10000, // Wait 10s to see if it starts successfully
});

// Now you can make changes and watch tests auto-rerun
```

### Checking Process Status

```bash
# Check if test server is running
curl http://localhost:3001 -I

# Check for running Playwright processes
ps aux | grep playwright
```

### Stopping Processes

```bash
# Stop watch mode (Ctrl+C or kill process)
pkill -f "playwright"

# Or use process ID from run_command
kill <PID>
```

---

## Test File Locations

```
src/e2e-tests/
├── logged-in/          # Tests requiring authentication
│   ├── file-upload.spec.ts
│   ├── mfa.spec.ts
│   ├── security-settings.spec.ts
│   └── ...
├── logged-out/         # Tests for unauthenticated users
│   ├── login.spec.ts
│   ├── signup.spec.ts
│   └── ...
└── fixtures/           # Shared test helpers
```

---

## Debugging Failed Tests

### 1. Read the error message

```bash
npm run test:e2e -- path/to/test.spec.ts
# Look for: "Error: locator.click: Target closed"
# Or: "Timeout 30000ms exceeded"
```

### 2. Run in headed mode to see what's happening

```bash
npm run test:e2e -- path/to/test.spec.ts --headed
```

### 3. Run in debug mode to step through

```bash
npm run test:e2e -- path/to/test.spec.ts --debug
```

### 4. Check test artifacts

```bash
# Screenshots, videos, traces saved in:
ls test-results/

# View trace file
npx playwright show-trace test-results/path/to/trace.zip
```

### 5. Common issues:

**"net::ERR_CONNECTION_REFUSED"**

- Test server failed to start
- Solution: Check if port 3001 is already in use, or if the build failed

**"Timeout exceeded"**

- Element not found or slow page load
- Solution: Check selector, increase timeout, or wait for specific condition

**"Element not visible"**

- Element exists but not visible yet
- Solution: Add `await page.waitForSelector('[data-testid="element"]', { state: 'visible' })`

---

## Best Practices

### ✅ DO:

```typescript
// Use data-testid for reliable selectors
await page.locator('[data-testid="upload-button"]').click();

// Wait for specific conditions
await page.waitForSelector('[data-testid="success-message"]');

// Use unique test data
const email = `test-${Date.now()}@example.com`;

// Clean up after tests
test.afterEach(async () => {
  await deleteTestUser(email);
});
```

### ❌ DON'T:

```typescript
// Don't use arbitrary waits
await page.waitForTimeout(5000); // BAD

// Don't use fragile selectors
await page.locator(".btn-primary-123").click(); // BAD

// Don't share state between tests
let sharedUser; // BAD
```

---

## Example: Complete AI Agent Workflow with Watch Mode

```bash
# 1. Start tests in UI watch mode
# This automatically starts the server, builds the app, and sets up the test DB
npm run test:e2e -- src/e2e-tests/logged-in/file-upload.spec.ts --ui

# Playwright UI opens in browser, watching for changes

# 2. Read error in Playwright UI
# Example: "Button not found: text=Upload Document"

# 3. Investigate the code
cat src/components/DocumentUpload.tsx
# Find: Button text is "Upload File" not "Upload Document"

# 4. Fix the test
# Edit: src/e2e-tests/logged-in/file-upload.spec.ts
# Change: await page.click('text=Upload Document');
# To:     await page.click('text=Upload File');
# Save the file

# 5. Watch test auto-rerun
# Playwright detects the change and reruns automatically
# No manual rerun needed!

# 6. See it pass in UI
# ✓ Test passes

# 7. Make another change if needed
# Edit code → Save → Test auto-reruns → See result
# Repeat until all tests pass

# 8. Clean up
# Ctrl+C to stop watch mode
```

---

## Quick Reference Table

| Task                    | Command                                                 |
| ----------------------- | ------------------------------------------------------- |
| **Run with UI (watch)** | `npm run test:e2e -- --ui` ⭐ RECOMMENDED               |
| **Run watch mode**      | `npm run test:e2e -- --watch` ⭐ Auto-reruns on changes |
| Run all tests           | `npm run test:e2e`                                      |
| Run specific test       | `npm run test:e2e -- path/to/test.spec.ts`              |
| Run headed              | `npm run test:e2e -- --headed`                          |
| Debug test              | `npm run test:e2e -- path/to/test.spec.ts --debug`      |
| Stop watch mode         | `Ctrl+C`                                                |

---

## Environment Requirements

```bash
# .env.local must have:
NEXT_PUBLIC_APP_ENV=E2E
DB_URL=postgresql://...test-db...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## When to Run Tests

- **During development:** Run specific test file you're working on
- **Before committing:** Run full test suite
- **After major changes:** Run full test suite
- **CI/CD:** Tests run automatically on PR/push

---

**For full documentation, see:** [DOCS/e2e-testing-guide.md](./e2e-testing-guide.md)
