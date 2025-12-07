# MFA Enforcement Manual Testing Plan

## Overview

This document provides manual test procedures for MFA enforcement features that can only be tested in QA and PRODUCTION environments. These tests were removed from the automated E2E suite because they require environment-specific behavior that doesn't apply in the E2E testing environment.

## Prerequisites

- Access to QA or PRODUCTION environment
- Test user account without MFA enabled
- Test user credentials
- Authenticator app (Google Authenticator, Authy, etc.)

---

## Test 1: Redirect to MFA Setup When Accessing Documents

**Environment:** QA or PRODUCTION only

**Objective:** Verify that users without MFA are redirected to security settings when trying to access documents.

### Steps:

1. **Create/Use Test User Without MFA**

   - Email: `test-mfa-enforcement@example.com`
   - Ensure `mfaEnabled` is `false` in database

2. **Login**

   - Navigate to `/login`
   - Enter email and password
   - Click "Login"
   - ✅ Should successfully login and redirect to home page

3. **Attempt Document Access**

   - Navigate to `/documents`
   - ✅ Should be redirected to `/settings/security?mfa_required=true`

4. **Verify MFA Required Banner**
   - ✅ Should see banner: "Multi-Factor Authentication Required"
   - ✅ Should see message: "You must enable MFA to access documents"
   - ✅ MFA setup dialog should auto-open

### Expected Results:

- User cannot access `/documents` without MFA
- User is redirected to security settings
- Clear messaging about MFA requirement
- MFA setup is automatically opened

### Cleanup:

- Delete test user or disable MFA for next test run

---

## Test 2: MFA Required Message in QA/PROD

**Environment:** QA or PRODUCTION only

**Objective:** Verify that the security settings page shows the correct MFA enforcement message.

### Steps:

1. **Login as User Without MFA**

   - Use test account without MFA enabled
   - Login successfully

2. **Navigate to Security Settings**

   - Go to `/settings/security`

3. **Verify Message**
   - ✅ Should see: "Multi-factor authentication is required to access documents"
   - ❌ Should NOT see: "Multi-factor authentication is optional"

### Expected Results:

- Message clearly indicates MFA is required (not optional)
- Message is visible without needing to interact with the page

---

## Test 3: Redirect to Original Destination After MFA Setup

**Environment:** QA or PRODUCTION only

**Objective:** Verify that after completing MFA setup, users are redirected back to the page they originally tried to access.

### Steps:

1. **Create Fresh Test User**

   - Create new user without MFA
   - Email: `test-mfa-redirect-{timestamp}@example.com`

2. **Login**

   - Login with new user credentials
   - ✅ Should successfully login

3. **Attempt to Access Documents**

   - Navigate to `/documents`
   - ✅ Should be redirected to `/settings/security?mfa_required=true`
   - ✅ MFA setup dialog should auto-open

4. **Complete MFA Setup**

   - Click "Set up two-factor authentication"
   - Scan QR code with authenticator app
   - Enter verification code
   - Save backup codes
   - Click "Enable MFA"
   - ✅ MFA should be successfully enabled

5. **Verify Redirect**
   - ✅ Should be redirected back to `/documents`
   - ✅ Should have access to documents page
   - ✅ Should NOT be redirected to security settings again

### Expected Results:

- User is seamlessly redirected to original destination
- No additional steps required after MFA setup
- Documents page is accessible

### Cleanup:

- Delete test user after test completion

---

## Test 4: MFA Enforcement Applies to All Document Routes

**Environment:** QA or PRODUCTION only

**Objective:** Verify that MFA enforcement applies to all document-related routes.

### Steps:

1. **Login as User Without MFA**

   - Use test account without MFA enabled

2. **Test Each Document Route**

   - Try to access `/documents`
     - ✅ Should redirect to security settings
   - Try to access `/documents/{documentId}`
     - ✅ Should redirect to security settings
   - Try to access document API endpoints
     - ✅ Should return 403 or redirect

3. **Enable MFA**

   - Complete MFA setup

4. **Retry Document Routes**
   - Access `/documents`
     - ✅ Should work without redirect
   - Access `/documents/{documentId}`
     - ✅ Should work without redirect

### Expected Results:

- All document routes are protected by MFA enforcement
- After enabling MFA, all routes become accessible

---

## Test 5: MFA Cannot Be Bypassed

**Environment:** QA or PRODUCTION only

**Objective:** Verify that users cannot bypass MFA enforcement through various methods.

### Steps:

1. **Login as User Without MFA**

2. **Attempt Direct URL Access**

   - Try accessing `/documents` directly via URL
   - ✅ Should redirect to security settings

3. **Attempt API Access**

   - Try calling document API endpoints directly
   - ✅ Should return 403 or appropriate error

4. **Check Session Cookie**

   - Inspect session cookie
   - ✅ Should have `mfaEnabled: false`

5. **Attempt Cookie Manipulation** (Security Test)
   - Try modifying session cookie to set `mfaEnabled: true`
   - ✅ Should fail (cookie is httpOnly and signed)
   - ✅ Middleware should still enforce MFA check

### Expected Results:

- No way to bypass MFA enforcement
- All access vectors are protected
- Cookie manipulation is prevented

---

## Test 6: MFA Enforcement Does Not Apply in Development

**Environment:** Development/Local only

**Objective:** Verify that MFA enforcement is disabled in development environment.

### Steps:

1. **Set Environment**

   - Ensure `NEXT_PUBLIC_APP_ENV` is NOT set to "QA" or "PRODUCTION"

2. **Login as User Without MFA**

   - Login with any user account

3. **Access Documents**

   - Navigate to `/documents`
   - ✅ Should access documents WITHOUT redirect
   - ✅ Should NOT be forced to enable MFA

4. **Check Security Settings**
   - Go to `/settings/security`
   - ✅ Should see: "Multi-factor authentication is optional"

### Expected Results:

- MFA is optional in development
- No enforcement or redirects
- Clear messaging about optional status

---

## Session Extension Without Authentication

**Objective:** Verify that unauthenticated requests cannot extend sessions.

**Note:** This test was removed from the logged-in E2E suite because it requires testing from an unauthenticated context.

### Steps:

1. **Open Incognito/Private Browser Window**

   - Do NOT login
   - Ensure no session cookies exist

2. **Attempt Session Extension**

   - Make POST request to `/api/extend-session`
   - Use browser DevTools or curl:
     ```bash
     curl -X POST https://your-app.com/api/extend-session
     ```

3. **Verify Response**

   - ✅ Should return 401 Unauthorized
   - ✅ Response body should contain: `{"error": "No active session"}`

4. **Verify No Session Created**
   - Check browser cookies
   - ✅ Should have no `session_user` cookie

### Expected Results:

- Unauthenticated requests cannot extend sessions
- Proper 401 error returned
- No session cookies created

### Alternative Test Method:

```javascript
// Using browser DevTools Console (while NOT logged in)
fetch("/api/extend-session", { method: "POST" })
  .then((r) => r.json())
  .then(console.log);
// Expected: {error: "No active session"}
```

---

## Test Execution Checklist

### Before Testing:

- [ ] Confirm environment (QA/PROD for MFA tests)
- [ ] Create test user accounts
- [ ] Have authenticator app ready
- [ ] Document current environment settings

### During Testing:

- [ ] Take screenshots of key steps
- [ ] Note any unexpected behavior
- [ ] Record actual vs expected results
- [ ] Document any errors or issues

### After Testing:

- [ ] Clean up test users
- [ ] Reset any modified data
- [ ] Document test results
- [ ] Report any bugs found

---

## Test Results Template

```markdown
## Test Run: [Date]

**Environment:** QA / PRODUCTION
**Tester:** [Name]
**Build/Version:** [Version]

### Test 1: Redirect to MFA Setup

- Status: ✅ Pass / ❌ Fail
- Notes:

### Test 2: MFA Required Message

- Status: ✅ Pass / ❌ Fail
- Notes:

### Test 3: Redirect After Setup

- Status: ✅ Pass / ❌ Fail
- Notes:

### Test 4: All Routes Protected

- Status: ✅ Pass / ❌ Fail
- Notes:

### Test 5: Cannot Bypass

- Status: ✅ Pass / ❌ Fail
- Notes:

### Test 6: Dev Environment

- Status: ✅ Pass / ❌ Fail
- Notes:

### Session Extension Test

- Status: ✅ Pass / ❌ Fail
- Notes:

### Issues Found:

1.
2.

### Overall Result: ✅ Pass / ❌ Fail
```

---

## Troubleshooting

### Issue: MFA not enforced in QA

**Solution:** Check `NEXT_PUBLIC_APP_ENV` is set to "QA" or "PRODUCTION"

### Issue: Redirect loop

**Solution:** Clear cookies and cache, ensure middleware is running correctly

### Issue: MFA setup fails

**Solution:** Verify TOTP secret generation, check server logs

### Issue: Cannot access documents after enabling MFA

**Solution:** Verify session cookie has `mfaEnabled: true`, try logging out and back in

---

## Related Documentation

- [MFA Enforcement Implementation](../SOC2/mfa-enforcement.md)
- [SOC2 Checklist](../SOC2/checklist.md)
- [Authentication Logging](../SOC2/authentication-logging.md)

---

**Last Updated:** December 7, 2025  
**Next Review:** Quarterly (March 2026)  
**Owner:** QA Team
