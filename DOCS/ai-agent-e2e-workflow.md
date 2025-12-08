# AI Agent E2E Testing Workflow

Quick reference for AI coding agents working with E2E tests.

## TL;DR

1. Start dev server: `npm run dev` (background process, runs on port 3001)
2. Run tests in watch mode: `npm run test:e2e -- --ui` (separate process)
3. Make changes → Playwright detects changes → Tests auto-rerun
4. Iterate until tests pass

---

## Complete Workflow

### 1. Check Prerequisites

```bash
# Check if dev server is already running
curl http://localhost:3000 -I

# If connection refused, server is not running
```

### 2. Start Dev Server (if needed)

```bash
# Start as background/async process
npm run dev

# Wait 3-5 seconds for server to be ready
# Verify: curl http://localhost:3000 -I should return 200
```

**Important:** Keep this process running throughout development!

### 3. Run E2E Tests in Watch Mode

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

### 4. Make Changes & Watch Tests Auto-Rerun

**The Magic of Watch Mode:**

1. Edit code files (components, pages, actions, tests, etc.)
2. Save the file
3. Playwright detects the change
4. Tests automatically rerun
5. See results immediately

**No need to manually rerun tests!** Watch mode handles it automatically.

### 5. Iterate Until Tests Pass

- Make a change → Save → Watch test rerun → See result
- Fix issues → Save → Watch test rerun → See result
- Repeat until all tests pass ✅

### 6. Verify & Clean Up

```bash
# Run full test suite before committing
npm run test:e2e

# Stop processes when done
# Ctrl+C in both terminals
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

### Starting Background Processes

**Using run_command tool with Blocking=false:**

```typescript
// Terminal 1: Start dev server (non-blocking)
run_command({
  CommandLine: "npm run dev",
  Cwd: "/path/to/project",
  Blocking: false,
  WaitMsBeforeAsync: 5000, // Wait 5s to see if it starts successfully
});

// Wait for server to be ready
// Then...

// Terminal 2: Run tests (non-blocking if you want to make changes)
run_command({
  CommandLine: "npm run test:e2e -- --headed",
  Cwd: "/path/to/project",
  Blocking: false,
});
```

### Checking Process Status

```bash
# Check if dev server is running
curl http://localhost:3000 -I

# Check for running Node processes
ps aux | grep "next dev"

# Check for running Playwright processes
ps aux | grep playwright
```

### Stopping Processes

```bash
# Kill dev server
pkill -f "next dev"

# Kill Playwright tests
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

- Dev server not running
- Solution: Start `npm run dev`

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
# 1. Check if server is running
curl http://localhost:3001 -I

# 2. Start dev server (if needed)
npm run dev &
sleep 5

# 3. Start tests in UI watch mode
npm run test:e2e -- src/e2e-tests/logged-in/file-upload.spec.ts --ui &

# Now both processes are running:
# - Terminal 1: Dev server (port 3001)
# - Terminal 2: Playwright UI (watching for changes)

# 4. Read error in Playwright UI
# Example: "Button not found: text=Upload Document"

# 5. Investigate the code
cat src/components/DocumentUpload.tsx
# Find: Button text is "Upload File" not "Upload Document"

# 6. Fix the test
# Edit: src/e2e-tests/logged-in/file-upload.spec.ts
# Change: await page.click('text=Upload Document');
# To:     await page.click('text=Upload File');
# Save the file

# 7. Watch test auto-rerun
# Playwright detects the change and reruns automatically
# No manual rerun needed!

# 8. See it pass in UI
# ✓ Test passes

# 9. Make another change if needed
# Edit code → Save → Test auto-reruns → See result
# Repeat until all tests pass

# 10. Run full suite before committing
npm run test:e2e

# 11. Clean up
pkill -f "next dev"
pkill -f "playwright"
```

---

## Quick Reference Table

| Task                    | Command                                                 |
| ----------------------- | ------------------------------------------------------- |
| Start dev server        | `npm run dev`                                           |
| Run all tests           | `npm run test:e2e`                                      |
| Run specific test       | `npm run test:e2e -- path/to/test.spec.ts`              |
| **Run with UI (watch)** | `npm run test:e2e -- --ui` ⭐ RECOMMENDED               |
| **Run watch mode**      | `npm run test:e2e -- --watch` ⭐ Auto-reruns on changes |
| Run headed              | `npm run test:e2e -- --headed`                          |
| Debug test              | `npm run test:e2e -- path/to/test.spec.ts --debug`      |
| Check server            | `curl http://localhost:3001 -I`                         |
| Kill server             | `pkill -f "next dev"`                                   |
| Kill Playwright         | `pkill -f "playwright"`                                 |

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
