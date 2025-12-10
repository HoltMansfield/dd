For faster iteration in the future, you could consider:

A script that just rebuilds and runs tests (skip db start/stop if already running)
Using Playwright's --grep to run specific test files during development
Keeping the e2e database running between test runs