# AI Agent E2E Testing

## Command

```bash
npm run test:e2e -- --headed
```

**What this does:**

- Starts database, builds app, starts server (~30 seconds)
- Runs tests with browser visible
- **Outputs full error details to terminal** (error message, stack trace, file/line)
- Exits when done

## Workflow

1. **Run tests** - `npm run test:e2e -- --headed`
2. **Read terminal output** - See which tests failed and why (error message, stack trace)
3. **Fix code** - Edit file, save
4. **Rerun** - Run command again (~5 seconds, no rebuild needed)
5. **Repeat** - Until tests pass

## For AI Agents

```typescript
run_command({
  CommandLine: "npm run test:e2e -- --headed",
  Cwd: "/path/to/project",
  Blocking: true, // Wait for tests to complete
});
```

**Key:** Terminal output shows full error details. You can read exactly why tests failed from the command output.
