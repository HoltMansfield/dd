# AI Agent E2E Testing Workflow

Quick reference for AI coding agents working with E2E tests.

## TL;DR

1. Start dev server: `npm run dev` (background process)
2. Run tests: `npm run test:e2e -- --headed` (separate process)
3. Make changes, tests auto-rerun
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

### 3. Run E2E Tests

**Option A: Run specific test (recommended for focused work)**

```bash
npm run test:e2e -- src/e2e-tests/path/to/test.spec.ts --headed
```

**Option B: Run all tests**

```bash
npm run test:e2e -- --headed
```

**Option C: Run with UI (best for debugging)**

```bash
npm run test:e2e -- --ui
```

### 4. Make Changes

- Edit code files (components, pages, actions, etc.)
- Dev server auto-rebuilds
- Re-run tests to verify changes

### 5. Iterate

```bash
# After making changes, re-run the test
npm run test:e2e -- src/e2e-tests/path/to/test.spec.ts

# Or if using --ui or --watch, tests auto-rerun
```

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

## Example: Complete AI Agent Workflow

```bash
# 1. Check if server is running
curl http://localhost:3000 -I

# 2. Start dev server (if needed)
npm run dev &
sleep 5

# 3. Run failing test to see error
npm run test:e2e -- src/e2e-tests/logged-in/file-upload.spec.ts --headed

# 4. Read error output
# Example: "Button not found: text=Upload Document"

# 5. Investigate the code
cat src/components/DocumentUpload.tsx
# Find: Button text is "Upload File" not "Upload Document"

# 6. Fix the test
# Edit: src/e2e-tests/logged-in/file-upload.spec.ts
# Change selector to match actual button text

# 7. Re-run test
npm run test:e2e -- src/e2e-tests/logged-in/file-upload.spec.ts

# 8. Verify it passes
# ✓ Test passes

# 9. Run full suite to check for regressions
npm run test:e2e

# 10. Clean up
pkill -f "next dev"
```

---

## Quick Reference Table

| Task              | Command                                            |
| ----------------- | -------------------------------------------------- |
| Start dev server  | `npm run dev`                                      |
| Run all tests     | `npm run test:e2e`                                 |
| Run specific test | `npm run test:e2e -- path/to/test.spec.ts`         |
| Run with UI       | `npm run test:e2e -- --ui`                         |
| Run headed        | `npm run test:e2e -- --headed`                     |
| Debug test        | `npm run test:e2e -- path/to/test.spec.ts --debug` |
| Watch mode        | `npm run test:e2e -- --watch`                      |
| Check server      | `curl http://localhost:3000 -I`                    |
| Kill server       | `pkill -f "next dev"`                              |

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
