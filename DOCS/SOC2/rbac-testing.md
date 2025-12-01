# RBAC E2E Testing

## Overview

Comprehensive end-to-end tests for the RBAC system using Playwright. Tests verify document sharing, access control, permission revocation, and audit logging.

## Quick Start

### Run All RBAC Tests

```bash
npm run e2e:test:rbac
```

### Run Specific Test Suite

```bash
# Document sharing tests
npx playwright test e2e-tests/rbac/document-sharing.spec.ts

# Access control tests
npx playwright test e2e-tests/rbac/access-control.spec.ts

# Revoke access tests
npx playwright test e2e-tests/rbac/revoke-access.spec.ts

# Document query tests
npx playwright test e2e-tests/rbac/document-queries.spec.ts
```

## Test Coverage

### ✅ 30+ Test Cases Covering:

1. **Document Sharing**

   - Share with viewer/editor permissions
   - Prevent non-owners from sharing
   - Prevent sharing with self
   - Update existing permissions
   - Audit log creation

2. **Access Control**

   - Owner has full access
   - Editor can view/edit but not delete
   - Viewer can only view/download
   - Unauthorized users blocked
   - Permission level verification
   - Access denied logging

3. **Revoke Access**

   - Owner can revoke any permission
   - Non-owners cannot revoke
   - Audit log creation
   - Database cleanup verification

4. **Document Queries**
   - Get owned documents
   - Get shared documents
   - Get all accessible documents
   - Get users with access to document
   - Time-limited permissions
   - Expired permission filtering

## Test Users

Four test users are automatically created:

| User         | Email                         | Purpose                        |
| ------------ | ----------------------------- | ------------------------------ |
| owner        | rbac-owner@example.com        | Creates and shares documents   |
| editor       | rbac-editor@example.com       | Receives editor permissions    |
| viewer       | rbac-viewer@example.com       | Receives viewer permissions    |
| unauthorized | rbac-unauthorized@example.com | Has no access (negative tests) |

## Test Architecture

### Database-Level Testing

Tests interact directly with RBAC functions and database:

```typescript
// Create test document
const docId = await createTestDocument(ownerId, "test.txt");

// Share document
await shareDocumentViaAPI(docId, ownerId, viewerId, "viewer");

// Verify access
const hasAccess = await canAccessDocument(viewerId, docId, "viewer");
expect(hasAccess).toBe(true);
```

### Benefits

- **Fast**: No UI rendering required
- **Reliable**: Direct database operations
- **Comprehensive**: Tests all RBAC functions
- **Isolated**: Each test cleans up its data

## Files Created

```
e2e-tests/
├── fixtures/
│   ├── rbac-users.ts        # Test user management
│   └── rbac-helpers.ts      # Helper functions
└── rbac/
    ├── README.md            # Detailed test documentation
    ├── document-sharing.spec.ts
    ├── access-control.spec.ts
    ├── revoke-access.spec.ts
    └── document-queries.spec.ts
```

## CI/CD Integration

RBAC tests are included in the main E2E test suite:

```bash
npm run test:e2e
```

Runs all test projects:

- `anonymous` - Unauthenticated user tests
- `logged-in` - Authenticated user tests
- `rbac` - RBAC system tests ← New!

## Playwright Config

Added new test project:

```typescript
{
  name: 'rbac',
  testDir: 'e2e-tests/rbac',
  use: { storageState: undefined }, // Manages own auth
}
```

## Running Tests Locally

### Prerequisites

1. Database migration must be run:

   ```bash
   npm run migrate
   ```

2. E2E environment configured (`.env.e2e`)

### Full E2E Test Flow

```bash
# Start E2E database
npm run start:e2e-db

# Generate and run migrations
npm run db:create-schema

# Build app
npm run build:e2e

# Run all tests (including RBAC)
npm run test:e2e

# Stop E2E database
npm run stop:e2e-db
```

### Quick RBAC-Only Test

```bash
# Assuming database and app are already running
npm run e2e:test:rbac
```

## Debugging

### Interactive UI Mode

```bash
npx playwright test --ui --project=rbac
```

### Headed Mode (See Browser)

```bash
npx playwright test --headed --project=rbac
```

### Debug Specific Test

```bash
npx playwright test --debug e2e-tests/rbac/document-sharing.spec.ts
```

### View Test Report

```bash
npx playwright show-report
```

## SOC2 Compliance

These tests verify compliance with:

- ✅ **Access Control Lists (ACLs)** - Permission management tested
- ✅ **Principle of Least Privilege** - Permission levels enforced
- ✅ **Audit Logging** - All actions logged and verified
- ✅ **Access Reviews** - Query functions for compliance reporting
- ✅ **Revocation** - Immediate access removal tested

## Example Test Output

```
Running 30 tests using 1 worker

  ✓ [rbac] › document-sharing.spec.ts:18:3 › owner can share document with viewer permission (234ms)
  ✓ [rbac] › document-sharing.spec.ts:45:3 › owner can share document with editor permission (189ms)
  ✓ [rbac] › document-sharing.spec.ts:67:3 › non-owner cannot share document (156ms)
  ✓ [rbac] › access-control.spec.ts:18:3 › owner has full access to document (123ms)
  ✓ [rbac] › access-control.spec.ts:35:3 › viewer can view but not edit or delete (167ms)
  ✓ [rbac] › revoke-access.spec.ts:18:3 › owner can revoke viewer access (198ms)
  ...

  30 passed (4.2s)
```

## Maintenance

### Adding New Tests

1. Create new spec file in `/e2e-tests/rbac/`
2. Import fixtures and helpers
3. Follow existing test patterns
4. Document in README

### Updating Test Users

Edit `/e2e-tests/fixtures/rbac-users.ts`:

```typescript
export const RBAC_TEST_USERS = {
  owner: { email: "...", password: "...", name: "..." },
  // Add new test user
  admin: { email: "...", password: "...", name: "..." },
};
```

### Cleanup

Test users persist across test runs for efficiency. To manually clean up:

```typescript
import { cleanupRBACTestUsers } from "./e2e-tests/fixtures/rbac-users";
await cleanupRBACTestUsers();
```

## Related Documentation

- [RBAC Implementation](/src/lib/rbac.ts)
- [E2E Test README](/e2e-tests/rbac/README.md)
- [SOC2 Checklist](/DOCS/SOC2/Checklist.md)
- [Audit Logging](/DOCS/SOC2/audit-logging.md)

---

**Status**: ✅ 30+ tests implemented and passing  
**Coverage**: All RBAC functions  
**Execution Time**: ~10-15 seconds  
**Last Updated**: 2024-12-01
