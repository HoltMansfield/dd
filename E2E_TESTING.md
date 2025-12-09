# E2E Testing with Live Reload

## Overview

This project now supports live reload e2e testing, allowing you to run tests against a Next.js dev server that automatically reloads when you make code changes.

## Quick Start

### Running Tests with Live Reload

```bash
# Start the e2e database, run migrations, start dev server, and run tests in watch mode
npm run e2e:watch
```

This command will:

1. Start the e2e PostgreSQL database (if not already running)
2. Run database migrations
3. Start the Next.js dev server on port 3001
4. Run Playwright tests in watch mode

When you make changes to your code, the dev server will automatically reload, and you can re-run specific tests or all tests using Playwright's watch mode interface.

### Manual Setup (Step by Step)

If you prefer more control, you can run each step manually:

```bash
# 1. Start the e2e database
npm run start:e2e-db

# 2. Run database migrations (first time only)
npm run db:create-schema

# 3. Start the dev server (in one terminal)
npm run e2e:dev

# 4. Run tests in watch mode (in another terminal)
npm run e2e:test:watch
```

## Available Test Commands

- `npm run e2e:test` - Run all tests once (requires dev server running)
- `npm run e2e:test:watch` - Run tests in watch mode with live reload
- `npm run e2e:test:ui` - Open Playwright UI for interactive testing
- `npm run e2e:test:headed` - Run tests in headed mode (see browser)
- `npm run e2e:watch` - Full setup: database + dev server + tests in watch mode

## Test Structure

Tests are organized in the `e2e-tests/` directory:

- `anonymous/` - Tests for unauthenticated users
- `logged-in/` - Tests for authenticated users
- `mfa/` - Multi-factor authentication tests
- `rbac/` - Role-based access control tests
- `fixtures/` - Test data and helper functions
- `helpers.ts` - Shared test utilities

## Test Helpers

### `openMenu(page)`

Opens the navigation menu by clicking the visible "Open Menu" button. Works for both mobile and desktop viewports.

```typescript
import { openMenu } from "../helpers";

await openMenu(page);
await page.locator('a[href="/settings/security"]').click();
```

### `logout(page)`

Logs out the current user by opening the menu and clicking logout.

```typescript
import { logout } from "../helpers";

await logout(page);
```

## Common Issues and Solutions

### Port Already in Use

If you see `EADDRINUSE: address already in use :::3001`:

```bash
# Kill the process using port 3001
lsof -ti:3001 | xargs kill -9

# Then restart the dev server
npm run e2e:dev
```

### Tests Timing Out

If tests are timing out, it's usually because:

1. The dev server isn't running
2. The database isn't running
3. A client-side redirect is taking longer than expected

Most redirect waits have been increased to 10 seconds to account for dev server compilation times.

### Menu Button Not Found

The tests now use a helper function that finds the visible menu button (either mobile or desktop) automatically. If you're writing new tests that need to open the menu, use the `openMenu()` helper instead of directly clicking the button.

## Test Fixes Applied

### 1. Menu Button Visibility

- **Issue**: Tests were trying to click a hidden mobile menu button on desktop viewports
- **Fix**: Created `openMenu()` helper that finds and clicks the visible button

### 2. MFA Redirect Timing

- **Issue**: Tests expected immediate redirects but client-side navigation takes time
- **Fix**: Added `waitForURL()` before assertions to wait for client-side redirects

### 3. Login Redirect Timing

- **Issue**: Similar to MFA, login redirects weren't completing before assertions
- **Fix**: Increased timeouts from 5s to 10s and added explicit waits

## Development Workflow

1. Start the live reload environment:

   ```bash
   npm run e2e:watch
   ```

2. Make changes to your code

3. The dev server will automatically reload

4. In the Playwright watch interface, press:

   - `a` to run all tests
   - `f` to run only failed tests
   - `q` to quit

5. Fix any failing tests and repeat

## Environment Variables

E2E tests use `.env.e2e` for configuration:

- `E2E_URL` - Base URL for tests (default: http://localhost:3001)
- Database connection settings for the e2e PostgreSQL instance

## Database Management

```bash
# Start e2e database
npm run start:e2e-db

# Stop e2e database
npm run stop:e2e-db

# Run migrations
npm run e2e:migrate

# Generate new migration
npm run e2e:generate
```

The e2e database runs in a Docker container on port 5433 (to avoid conflicts with your local dev database).
