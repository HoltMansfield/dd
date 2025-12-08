# AI Agent E2E Testing

## Command

```bash
npm run test:e2e -- --ui
```

Wait 30 seconds. Playwright UI opens in browser.

## Workflow

1. **Read failure** - Click failed test in UI → See error message, stack trace, screenshot
2. **Fix code** - Edit file, save
3. **Watch rerun** - Test reruns automatically in ~5 seconds (no rebuild)
4. **Repeat** - Until tests pass

## For AI Agents

```typescript
run_command({
  CommandLine: "npm run test:e2e -- --ui",
  Cwd: "/path/to/project",
  Blocking: false,
  WaitMsBeforeAsync: 30000,
});
```

**Key:** Playwright UI shows exactly why tests failed (error, stack trace, screenshot). You can see the failure details without guessing.
