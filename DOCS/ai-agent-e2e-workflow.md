# AI Agent E2E Testing Workflow

## The Process

Run tests with UI mode to see detailed failure information:

```bash
npm run test:e2e -- --ui
```

**What happens:**

- Starts database, builds app, starts server (takes ~30 seconds first time)
- Opens Playwright UI in browser showing all test results
- When you save a file, tests automatically rerun (no rebuild needed)
- You see detailed error messages, screenshots, and traces for failures

**Why UI mode:**

- Shows exactly why tests failed (error messages, stack traces, screenshots)
- Auto-reruns on file changes without rebuilding
- Visual feedback on test status
- Can click into failed tests to see details

## Step-by-Step

### 1. Start Tests

```bash
npm run test:e2e -- --ui
```

Wait ~30 seconds. Playwright UI opens in browser.

### 2. Read the Failure

In Playwright UI, click on the failed test. You'll see:

- **Error message** - What went wrong
- **Stack trace** - Where it failed
- **Screenshot** - Visual state when it failed
- **Test code** - The exact line that failed

### 3. Fix the Code

Edit the file (component, test, whatever needs fixing).
Save the file.

### 4. Watch It Rerun

Playwright detects the change and reruns automatically.
No rebuild. Takes ~2-5 seconds.

### 5. Repeat

Keep making changes and saving until tests pass.

### 6. Stop

```bash
Ctrl+C
```

## For AI Agents

### Running the Command

Use `run_command` with non-blocking mode:

```typescript
run_command({
  CommandLine: "npm run test:e2e -- --ui",
  Cwd: "/path/to/project",
  Blocking: false,
  WaitMsBeforeAsync: 30000, // Wait 30s for initial build
});
```

### Reading Test Failures

The Playwright UI shows:

1. Which tests failed (red X)
2. Click failed test → See error message
3. Click "Errors" tab → See stack trace
4. Click "Attachments" → See screenshot of failure

**This is the key:** You can see exactly why it failed without guessing.

### Making Changes

1. Read the error in Playwright UI
2. Edit the code file
3. Save
4. Test reruns automatically (~2-5 seconds)
5. Check if it passed

No need to stop and restart. No rebuild.
