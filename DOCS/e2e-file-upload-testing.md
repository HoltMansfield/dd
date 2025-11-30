# E2E File Upload Testing

## Overview

E2E tests for the Supabase file storage integration, restricted to E2E environment only.

## Test Page

**URL**: `/e2e/file-upload`

**Access**: Only available when `NEXT_PUBLIC_APP_ENV=E2E`

**Features**:

- Full file upload UI
- Document list display
- Upload, download, and delete functionality
- Identical to production `/documents` page but E2E-restricted

## Middleware Protection

The middleware blocks access to all `/e2e/*` routes unless the environment variable is set:

```typescript
// src/middleware.ts
if (pathname.startsWith("/e2e")) {
  if (process.env.NEXT_PUBLIC_APP_ENV !== "E2E") {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
```

## Test Suite

**Location**: `e2e-tests/logged-in/file-upload.spec.ts`

**Tests**:

1. ✅ Upload PDF file successfully
2. ✅ Display uploaded files in list
3. ✅ Download files
4. ✅ Delete files
5. ✅ Reject files that are too large (>50MB)
6. ✅ Reject invalid file types
7. ✅ Show empty state when no documents

## Running Tests

### Start E2E Environment

```bash
# 1. Start E2E database
npm run e2e:db:start

# 2. Run migrations
npm run e2e:migrate

# 3. Start dev server with E2E env
NEXT_PUBLIC_APP_ENV=E2E npm run dev -- -p 3001
```

### Run Tests

```bash
# Run all logged-in tests (including file upload)
npm run test:e2e -- --project=logged-in

# Run only file upload tests
npm run test:e2e -- --project=logged-in file-upload

# Run in UI mode for debugging
npm run test:e2e -- --ui --project=logged-in
```

## Test Fixtures

**Location**: `e2e-tests/fixtures/`

- `test-document.pdf` - Small valid PDF (< 1KB) for upload tests

## Environment Variables

### Required in `.env.local` (for Supabase)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Required in `.env.e2e` (for E2E tests)

```bash
E2E_URL=http://localhost:3001
DB_URL=postgresql://test:test@localhost:5433/testdb-dd
NEXT_PUBLIC_APP_ENV=E2E  # Critical for /e2e route access
```

## Test Data Attributes

Components include `data-testid` attributes for reliable testing:

- `data-testid="documents-list"` - Documents list container
- `data-testid="document-item"` - Individual document items

## Security

The E2E routes are **completely blocked** in production and development environments. They only work when:

1. `NEXT_PUBLIC_APP_ENV=E2E` is set
2. The middleware allows the request through

This prevents accidental exposure of test utilities in production.

## Troubleshooting

### "Page not found" when accessing /e2e/file-upload

**Cause**: `NEXT_PUBLIC_APP_ENV` is not set to `E2E`

**Solution**: Start dev server with the environment variable:

```bash
NEXT_PUBLIC_APP_ENV=E2E npm run dev -- -p 3001
```

### Tests fail with "Document uploaded successfully!" not visible

**Cause**: Supabase credentials not configured or bucket doesn't exist

**Solution**:

1. Verify Supabase environment variables in `.env.local`
2. Create `documents` bucket in Supabase Storage (private)
3. Verify service role key has storage permissions

### File upload times out

**Cause**: Network issues or Supabase Storage not accessible

**Solution**:

1. Check Supabase project status
2. Verify network connectivity
3. Check Supabase Storage bucket exists and is accessible
