# MFA Enforcement for Document Access - SOC2 Compliance

## Overview

This document details the implementation of mandatory Multi-Factor Authentication (MFA) for accessing sensitive financial documents in QA and Production environments, meeting SOC2 Type II requirements for access control to sensitive data.

## Business Context

All documents in the system are equally sensitive financial documents about companies. To meet SOC2 compliance requirements and protect this sensitive data, MFA is required before users can access any documents in QA and Production environments.

## Implementation

### Environment-Based Enforcement

**Production & QA Environments:**

- MFA is **required** to access document routes (`/documents`)
- Users without MFA are automatically redirected to MFA setup
- Cannot cancel MFA setup when required
- Automatically redirected back to original destination after setup

**Development & E2E Environments:**

- MFA is **optional** for developer convenience
- Users can access documents without MFA
- MFA can still be enabled voluntarily

### Configuration

**File:** `src/lib/mfa-config.ts`

```typescript
export function shouldEnforceMFAForDocuments(): boolean {
  const env = process.env.NEXT_PUBLIC_APP_ENV;
  return env === "PRODUCTION" || env === "QA";
}
```

### Middleware Protection

**File:** `src/middleware.ts`

The middleware checks:

1. If the user is accessing a document route
2. If MFA enforcement is enabled for the current environment
3. If the user has MFA enabled (from session cookie)
4. Redirects to MFA setup if required

```typescript
const mfaRequiredPaths = ["/documents"];

if (isMFARequiredPath && shouldEnforceMFAForDocuments()) {
  const sessionData = JSON.parse(sessionCookie.value);
  const userHasMFA = sessionData.mfaEnabled === true;

  if (!userHasMFA) {
    // Redirect to MFA setup with return URL
    const mfaSetupUrl = new URL("/settings/security", request.url);
    mfaSetupUrl.searchParams.set("mfa_required", "true");
    mfaSetupUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(mfaSetupUrl);
  }
}
```

### Session Cookie Enhancement

The session cookie now includes `mfaEnabled` status:

```typescript
{
  email: "user@example.com",
  id: "user-uuid",
  mfaEnabled: true  // Added for middleware access
}
```

This allows the middleware to check MFA status without database queries, ensuring fast request processing.

### User Experience Flow

#### For Users Without MFA (QA/PROD):

1. User logs in successfully
2. User attempts to access `/documents`
3. Middleware detects missing MFA
4. User is redirected to `/settings/security?mfa_required=true&redirect=/documents`
5. MFA setup modal opens automatically
6. Warning banner explains MFA is required
7. User completes MFA setup
8. User is automatically redirected to `/documents`

#### For Users With MFA:

1. User logs in successfully
2. User completes MFA verification (if enabled)
3. User can access `/documents` immediately
4. No additional prompts or redirects

#### For Users in Development:

1. User logs in successfully
2. User can access `/documents` immediately
3. MFA is optional and can be enabled in settings

### Security Features

**Middleware Enforcement:**

- Server-side validation (cannot be bypassed by client)
- Runs on every request to protected routes
- Fast check using session cookie data

**Session Cookie Updates:**

- Cookie updated immediately when MFA is enabled/disabled
- Ensures middleware always has current MFA status
- No race conditions or stale data

**User Cannot Bypass:**

- Cannot cancel MFA setup when required
- Cannot access documents without MFA in QA/PROD
- Redirect preserves original destination

**Audit Trail:**

- All MFA enable/disable actions are logged
- Failed MFA setup attempts are logged
- Provides compliance audit trail

## Testing

### E2E Tests

**File:** `e2e-tests/mfa/mfa-enforcement.spec.ts`

Tests cover:

- ✅ Redirect to MFA setup when accessing documents without MFA (QA/PROD)
- ✅ Allow document access without MFA in development
- ✅ Show correct enforcement message per environment
- ✅ Redirect to original destination after MFA setup
- ✅ Auto-open MFA setup when redirected

### Manual Testing

**QA/PROD Environment:**

1. Create user without MFA
2. Login
3. Navigate to `/documents`
4. Verify redirect to MFA setup
5. Complete MFA setup
6. Verify redirect back to documents

**Development Environment:**

1. Create user without MFA
2. Login
3. Navigate to `/documents`
4. Verify immediate access (no redirect)

## Files Modified

### Core Implementation

- `src/lib/mfa-config.ts` - Environment-based MFA enforcement config
- `src/middleware.ts` - Middleware MFA checking and redirection
- `src/app/login/actions.ts` - Include mfaEnabled in session cookie
- `src/app/login/verify/actions.ts` - Include mfaEnabled after MFA login
- `src/actions/mfa.ts` - Update session cookie when MFA enabled/disabled

### User Interface

- `src/app/settings/security/page.tsx` - Handle MFA required parameters
- `src/app/settings/security/SecuritySettings.tsx` - MFA required banner and auto-open

### Testing & Documentation

- `e2e-tests/mfa/mfa-enforcement.spec.ts` - E2E tests
- `DOCS/SOC2/mfa-enforcement.md` - This document
- `DOCS/SOC2/checklist.md` - Updated compliance checklist

## SOC2 Compliance

### Requirements Met

✅ **CC6.1 - Logical and Physical Access Controls**

- MFA required for access to sensitive documents
- Environment-appropriate enforcement
- Cannot be bypassed

✅ **CC6.2 - Authentication**

- Multi-factor authentication implemented
- TOTP-based (RFC 6238 compliant)
- Backup codes for recovery

✅ **CC6.3 - Authorization**

- Access to documents requires MFA in production
- Middleware enforces authorization
- Session-based validation

✅ **CC7.2 - System Monitoring**

- All MFA actions are logged
- Failed attempts are tracked
- Audit trail for compliance

### Audit Evidence

For SOC2 audits, provide:

1. This documentation
2. Code references (middleware, config)
3. E2E test results
4. Audit logs showing MFA enforcement
5. Environment configuration

## Environment Variables

**Required:**

- `NEXT_PUBLIC_APP_ENV` - Must be set to "PRODUCTION" or "QA" for enforcement

**Values:**

- `PRODUCTION` - MFA required for documents
- `QA` - MFA required for documents
- `DEVELOPMENT` - MFA optional
- `E2E` - MFA optional (for testing)

## Maintenance

### Adding New Protected Routes

To require MFA for additional routes:

```typescript
// In src/middleware.ts
const mfaRequiredPaths = [
  "/documents",
  "/financial-reports", // Add new route
  "/sensitive-data", // Add new route
];
```

### Changing Enforcement Logic

To modify when MFA is required:

```typescript
// In src/lib/mfa-config.ts
export function shouldEnforceMFAForDocuments(): boolean {
  const env = process.env.NEXT_PUBLIC_APP_ENV;
  // Modify logic here
  return env === "PRODUCTION" || env === "QA";
}
```

### Troubleshooting

**Issue:** User stuck in redirect loop

- **Cause:** Session cookie not updating after MFA setup
- **Fix:** Check `completeMFASetup` updates session cookie

**Issue:** MFA not enforced in production

- **Cause:** `NEXT_PUBLIC_APP_ENV` not set correctly
- **Fix:** Verify environment variable is "PRODUCTION"

**Issue:** Cannot access documents after enabling MFA

- **Cause:** Session cookie not refreshed
- **Fix:** User should logout and login again

## Security Considerations

**Session Cookie Security:**

- HttpOnly flag prevents XSS access
- Secure flag enforces HTTPS in production
- SameSite=Lax prevents CSRF attacks
- 7-day expiration with activity timeout

**MFA Secret Storage:**

- Secrets encrypted in database
- Never exposed to client
- Backup codes hashed (bcrypt)

**Middleware Performance:**

- Fast cookie-based check (no database query)
- Runs on every request efficiently
- Minimal latency impact

## Future Enhancements

Potential improvements:

- [ ] Grace period for new users (e.g., 7 days to enable MFA)
- [ ] Admin override capability for emergency access
- [ ] MFA enforcement for specific user roles only
- [ ] SMS/Email backup MFA methods
- [ ] Hardware security key support (WebAuthn)

## References

- [OWASP MFA Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
- [NIST SP 800-63B - Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [RFC 6238 - TOTP Specification](https://datatracker.ietf.org/doc/html/rfc6238)
- [SOC2 Trust Service Criteria](https://www.aicpa.org/resources/landing/trust-services-criteria)

## Change Log

**December 6, 2025** - Initial implementation

- Environment-based MFA enforcement
- Middleware protection for document routes
- Session cookie enhancement
- E2E tests
- Documentation

---

**Last Updated:** December 6, 2025
**Next Review:** March 6, 2026 (Quarterly)
**Owner:** Engineering Team
**Compliance:** SOC2 Type II
