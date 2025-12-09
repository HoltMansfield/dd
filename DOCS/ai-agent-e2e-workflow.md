1. **Run tests ONCE** - `npm run test:e2e:headed` (keep this process running throughout the entire workflow)
2. **Read terminal output** - See which tests failed and why (error message, stack trace)
3. **Fix code** - Edit file, save
4. **Wait for auto-rerun** - Playwright watches for file changes and reruns tests automatically (~5 seconds, no rebuild needed)
5. **Repeat steps 2-4** - Until tests pass

**IMPORTANT**: Do NOT run the test command multiple times. The initial run takes several minutes (database setup, build, etc.). After that, file changes trigger automatic reruns in under a minute. Keep the test process running and only read the terminal output.
