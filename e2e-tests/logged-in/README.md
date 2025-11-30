# Logged-In E2E Tests

These tests run with an authenticated user session.

## File Upload Tests

The `file-upload.spec.ts` test suite covers:

- ✅ Uploading PDF files
- ✅ Displaying uploaded files in the list
- ✅ Downloading files
- ✅ Deleting files
- ✅ File size validation
- ✅ File type validation
- ✅ Empty state handling

### Test Page

The tests use `/e2e/file-upload` which is only accessible when `NEXT_PUBLIC_APP_ENV=E2E`.

### Test Fixtures

- `e2e-tests/fixtures/test-document.pdf` - Small valid PDF for upload tests

## Running Tests

```bash
# Run all logged-in tests
npm run test:e2e -- --project=logged-in

# Run only file upload tests
npm run test:e2e -- --project=logged-in file-upload

# Run in UI mode for debugging
npm run test:e2e -- --ui --project=logged-in
```

## Prerequisites

1. E2E database must be running (`npm run e2e:db:start`)
2. Dev server must be running on port 3001 with E2E env
3. Supabase environment variables must be set in `.env.local`
