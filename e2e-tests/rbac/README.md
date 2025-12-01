# RBAC E2E Tests

End-to-end tests for the Role-Based Access Control (RBAC) system.

## Test Coverage

### 1. Document Sharing (`document-sharing.spec.ts`)

- ✅ Owner can share document with viewer permission
- ✅ Owner can share document with editor permission
- ✅ Non-owner cannot share document
- ✅ Cannot share document with self
- ✅ Sharing creates audit log entry
- ✅ Can update existing permission level

### 2. Access Control (`access-control.spec.ts`)

- ✅ Owner has full access to document
- ✅ Viewer can view but not edit or delete
- ✅ Editor can view and edit but not delete
- ✅ Unauthorized user has no access
- ✅ `getUserPermissionLevel` returns correct level
- ✅ `canPerformAction` enforces correct permissions
- ✅ Access denied is logged in audit trail

### 3. Revoke Access (`revoke-access.spec.ts`)

- ✅ Owner can revoke viewer access
- ✅ Owner can revoke editor access
- ✅ Non-owner cannot revoke access
- ✅ Revoking non-existent permission returns error
- ✅ Revoke creates audit log entry
- ✅ Permission is deleted from database after revoke

### 4. Document Queries (`document-queries.spec.ts`)

- ✅ `getDocumentsOwnedByUser` returns only owned documents
- ✅ `getDocumentsSharedWithUser` returns only shared documents
- ✅ `getAllAccessibleDocuments` returns owned and shared documents
- ✅ `getDocumentSharedWith` returns all users with access
- ✅ Shared documents include permission level
- ✅ Expired permissions are not returned
- ✅ Active time-limited permissions are returned
- ✅ User with no documents returns empty arrays

## Test Users

The tests use four predefined test users:

| User             | Email                         | Role                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **owner**        | rbac-owner@example.com        | Document owner (creates docs)    |
| **editor**       | rbac-editor@example.com       | User with editor permission      |
| **viewer**       | rbac-viewer@example.com       | User with viewer permission      |
| **unauthorized** | rbac-unauthorized@example.com | User with no access to documents |

These users are automatically created in the database before tests run.

## Running the Tests

### Run all RBAC tests

```bash
npm run e2e:test:rbac
```

### Run specific test file

```bash
npx playwright test e2e-tests/rbac/document-sharing.spec.ts
```

### Run with UI mode (interactive)

```bash
npx playwright test --ui --project=rbac
```

### Run in headed mode (see browser)

```bash
npx playwright test --headed --project=rbac
```

## Test Architecture

### Fixtures

- **`rbac-users.ts`** - Test user creation and management
- **`rbac-helpers.ts`** - Helper functions for common test operations

### Test Strategy

1. **Database-level testing**: Tests interact directly with the RBAC functions and database
2. **No UI dependencies**: Tests don't require UI components to be built
3. **Isolated test data**: Each test creates and cleans up its own documents
4. **Reusable test users**: Same users across all tests for consistency

### Test Lifecycle

```
beforeAll
  └─ Create test users (owner, editor, viewer, unauthorized)

beforeEach
  └─ Create test document(s) owned by owner

test
  └─ Execute test scenario
  └─ Verify expected behavior
  └─ Check audit logs

afterEach
  └─ Clean up test documents

afterAll (implicit)
  └─ Test users remain for next test suite
```

## Adding New Tests

1. Create a new spec file in `/e2e-tests/rbac/`
2. Import fixtures: `rbac-users.ts` and `rbac-helpers.ts`
3. Follow the existing test structure
4. Use `setupRBACTestUsers()` to get test users
5. Use helper functions for common operations

Example:

```typescript
import { test, expect } from "@playwright/test";
import {
  setupRBACTestUsers,
  RBAC_TEST_USERS,
  TestUser,
} from "../fixtures/rbac-users";
import {
  createTestDocument,
  cleanupTestDocuments,
} from "../fixtures/rbac-helpers";

let testUsers: Record<keyof typeof RBAC_TEST_USERS, TestUser>;

test.describe("My RBAC Feature", () => {
  test.beforeAll(async () => {
    testUsers = await setupRBACTestUsers();
  });

  test("my test case", async () => {
    const docId = await createTestDocument(testUsers.owner.id);

    // Your test logic here

    await cleanupTestDocuments(testUsers.owner.id);
  });
});
```

## Debugging

### View test results

```bash
npx playwright show-report
```

### Debug specific test

```bash
npx playwright test --debug e2e-tests/rbac/document-sharing.spec.ts
```

### Check database state

```bash
npm run studio
```

Then navigate to the `documentPermissions` table to see permissions.

### View audit logs

```bash
npm run audit:stats
```

## CI/CD Integration

The RBAC tests are included in the main E2E test suite:

```bash
npm run test:e2e
```

This runs:

1. Anonymous tests
2. Logged-in tests
3. **RBAC tests** ← New!

## Common Issues

### Test users already exist

If tests fail due to existing users, you can manually clean them up:

```typescript
import { cleanupRBACTestUsers } from "./e2e-tests/fixtures/rbac-users";
await cleanupRBACTestUsers();
```

### Documents not cleaned up

If documents persist between test runs, check the `afterEach` hooks are running.

### Permission checks failing

Verify the migration was run:

```bash
npm run migrate
```

Check the `documentPermissions` table exists in your database.

## Test Metrics

- **Total test cases**: 30+
- **Test files**: 4
- **Coverage**: All RBAC functions
- **Execution time**: ~10-15 seconds
- **Database operations**: Isolated per test

## Related Documentation

- [RBAC Implementation](/src/lib/rbac.ts)
- [Database Schema](/src/db/schema.ts)
- [Audit Logging](/DOCS/SOC2/audit-logging.md)
- [SOC2 Checklist](/DOCS/SOC2/Checklist.md)
