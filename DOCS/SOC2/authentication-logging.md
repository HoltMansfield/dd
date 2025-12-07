# Authentication Audit Logging - SOC2 Compliance

## Overview

This document details the implementation of comprehensive authentication audit logging for SOC2 Type II compliance. All authentication attempts (successful and failed) are logged with detailed metadata for security monitoring and compliance auditing.

## Business Context

SOC2 requires organizations to log all authentication attempts to:

- Detect and respond to security incidents
- Monitor for brute force attacks
- Provide audit trails for compliance
- Support forensic investigations
- Track user access patterns

## Implementation

### Logged Authentication Events

**Login Attempts:**

- `login_attempt` - Password validated, MFA pending
- `login_success` - Successful authentication (with or without MFA)
- `login_failed` - Failed authentication (wrong password, user not found, account locked)

**Account Security:**

- `account_locked` - Account locked due to excessive failed attempts
- `session_expired` - Session expired (inactivity or max duration)
- `logout` - User-initiated logout

**MFA Events:**

- `mfa_verification` - MFA token verification (already implemented)
- `mfa_setup_initiated` - User started MFA setup (already implemented)
- `mfa_enabled` - MFA successfully enabled (already implemented)
- `mfa_disabled` - MFA disabled (already implemented)

### Audit Log Structure

Each audit log entry includes:

```typescript
{
  id: string;              // Unique log ID
  userId: string;          // User ID ("unknown" for non-existent users)
  action: AuditAction;     // Type of authentication event
  timestamp: Date;         // When the event occurred
  success: boolean;        // Whether the action succeeded
  errorMessage?: string;   // Error details if failed
  ipAddress: string;       // Client IP address
  userAgent: string;       // Client user agent
  metadata: JSON;          // Additional context (email, reason, etc.)
}
```

### Login Flow Logging

#### Successful Login (No MFA)

```typescript
// User enters correct credentials
await createAuditLog({
  userId: user.id,
  action: "login_success",
  success: true,
  metadata: {
    email: user.email,
    mfaRequired: false,
  },
});
```

#### Successful Login (With MFA)

```typescript
// Step 1: Password validated
await createAuditLog({
  userId: user.id,
  action: "login_attempt",
  success: true,
  metadata: {
    email: user.email,
    mfaRequired: true,
  },
});

// Step 2: MFA completed (in verify action)
await createAuditLog({
  userId: user.id,
  action: "login_success",
  success: true,
  metadata: {
    email: user.email,
    mfaRequired: true,
    mfaCompleted: true,
  },
});
```

#### Failed Login - Wrong Password

```typescript
await createAuditLog({
  userId: user.id,
  action: "login_failed",
  success: false,
  errorMessage: "Invalid password",
  metadata: {
    email: user.email,
    failedAttempts: currentFailedAttempts,
  },
});
```

#### Failed Login - User Not Found

```typescript
await createAuditLog({
  userId: "unknown",
  action: "login_failed",
  success: false,
  errorMessage: "User not found",
  metadata: { email: attemptedEmail },
});
```

#### Account Lockout

```typescript
await createAuditLog({
  userId: user.id,
  action: "account_locked",
  success: true,
  metadata: {
    email: user.email,
    failedAttempts: MAX_FAILED_ATTEMPTS,
    lockoutUntil: lockoutDate.toISOString(),
  },
});
```

#### Logout

```typescript
await createAuditLog({
  userId: user.id,
  action: "logout",
  success: true,
  metadata: {
    email: user.email,
  },
});
```

#### Session Expiration

```typescript
// Logged via server action when login page detects timeout parameter
// (Middleware runs in Edge Runtime and cannot access database)
await createAuditLog({
  userId: sessionData.id,
  action: "session_expired",
  success: true,
  metadata: {
    reason: "Session expired (detected on login page)",
    email: sessionData.email,
  },
});
```

### Files Modified

**Core Implementation:**

- `src/db/schema.ts` - Added authentication audit action types
- `src/app/login/actions.ts` - Login attempt logging
- `src/app/login/verify/actions.ts` - MFA completion logging
- `src/actions/auth.ts` - Logout logging
- `src/app/login/SessionExpirationLogger.tsx` - Session expiration logging
- `src/app/login/page.tsx` - Triggers session expiration logging on timeout
- `src/middleware.ts` - Redirects to login with timeout parameter

**Testing & Documentation:**

- `e2e-tests/auth/auth-logging.spec.ts` - E2E tests
- `DOCS/SOC2/authentication-logging.md` - This document
- `DOCS/SOC2/checklist.md` - Updated compliance checklist

### Metadata Examples

**Successful Login:**

```json
{
  "email": "user@example.com",
  "mfaRequired": false
}
```

**Failed Login:**

```json
{
  "email": "user@example.com",
  "failedAttempts": 3
}
```

**Account Lockout:**

```json
{
  "email": "user@example.com",
  "failedAttempts": 5,
  "lockoutUntil": "2025-12-07T16:30:00.000Z"
}
```

**Session Expiration:**

```json
{
  "email": "user@example.com",
  "reason": "Session expired due to inactivity"
}
```

## Security Features

**Comprehensive Coverage:**

- All authentication attempts logged (success and failure)
- No authentication event goes unrecorded
- Includes context for forensic analysis

**Tamper-Resistant:**

- Logs stored in database with timestamps
- Archival system with SHA-256 checksums
- Cannot be deleted by regular users

**Privacy-Conscious:**

- Passwords never logged
- Only email addresses and metadata logged
- IP addresses captured for security monitoring

**Performance:**

- Async logging doesn't block authentication
- Fire-and-forget in middleware
- Minimal impact on user experience

## Monitoring & Alerting

### Key Metrics to Monitor

**Failed Login Attempts:**

```sql
SELECT COUNT(*)
FROM audit_logs
WHERE action = 'login_failed'
  AND timestamp > NOW() - INTERVAL '1 hour';
```

**Account Lockouts:**

```sql
SELECT userId, metadata
FROM audit_logs
WHERE action = 'account_locked'
  AND timestamp > NOW() - INTERVAL '24 hours';
```

**Session Expirations:**

```sql
SELECT COUNT(*),
       JSON_EXTRACT(metadata, '$.reason') as reason
FROM audit_logs
WHERE action = 'session_expired'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY reason;
```

**Login Success Rate:**

```sql
SELECT
  SUM(CASE WHEN action = 'login_success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN action = 'login_failed' THEN 1 ELSE 0 END) as failed,
  ROUND(100.0 * SUM(CASE WHEN action = 'login_success' THEN 1 ELSE 0 END) /
    (SUM(CASE WHEN action = 'login_success' THEN 1 ELSE 0 END) +
     SUM(CASE WHEN action = 'login_failed' THEN 1 ELSE 0 END)), 2) as success_rate
FROM audit_logs
WHERE action IN ('login_success', 'login_failed')
  AND timestamp > NOW() - INTERVAL '24 hours';
```

### Alerting Recommendations

**High Priority:**

- More than 10 failed login attempts for same user in 5 minutes
- More than 3 account lockouts in 1 hour
- Login from unusual IP address or location
- Login outside business hours for sensitive accounts

**Medium Priority:**

- Unusual number of session expirations
- Failed login attempts from same IP for multiple users
- Successful login after multiple failed attempts

**Low Priority:**

- Normal session expirations
- Single failed login attempts
- Regular logout patterns

## SOC2 Compliance

### Requirements Met

✅ **CC6.1 - Logical and Physical Access Controls**

- All authentication attempts logged
- Failed attempts tracked and monitored
- Account lockouts logged

✅ **CC6.2 - Authentication**

- Login success and failure logged
- MFA events logged
- Session management logged

✅ **CC7.2 - System Monitoring**

- Comprehensive audit trail
- Timestamp and IP tracking
- Metadata for investigation

✅ **CC7.3 - Response to Incidents**

- Failed login detection
- Account lockout tracking
- Forensic data available

### Audit Evidence

For SOC2 audits, provide:

1. This documentation
2. Sample audit logs showing authentication events
3. E2E test results demonstrating logging
4. Retention policy (logs kept for 7 years)
5. Archive integrity verification (SHA-256 checksums)

## Testing

### E2E Tests

**File:** `e2e-tests/auth/auth-logging.spec.ts`

Tests cover:

- ✅ Successful login logging
- ✅ Failed login logging (wrong password)
- ✅ Failed login logging (non-existent user)
- ✅ Account lockout logging
- ✅ Logout logging
- ✅ IP address and user agent capture
- ✅ Chronological event ordering

### Manual Testing

**Test Successful Login:**

1. Login with valid credentials
2. Query audit logs for `login_success`
3. Verify email, timestamp, IP address

**Test Failed Login:**

1. Login with invalid password
2. Query audit logs for `login_failed`
3. Verify error message and failed attempt count

**Test Account Lockout:**

1. Fail login 5 times
2. Query audit logs for `account_locked`
3. Verify lockout timestamp

**Test Session Expiration:**

1. Login and wait for session timeout
2. Query audit logs for `session_expired`
3. Verify expiration reason

## Retention & Archival

**Active Logs:**

- Kept in `audit_logs` table
- Queryable for real-time monitoring
- Retained for 1 year before archival

**Archived Logs:**

- Moved to `audit_log_archives` table
- Compressed as JSON
- SHA-256 checksum for integrity
- Retained for 7 years total

**Archival Process:**

```typescript
// Run monthly or quarterly
await archiveOldAuditLogs(365); // Archive logs older than 1 year
```

## Privacy Considerations

**PII in Logs:**

- Email addresses logged (required for security)
- IP addresses logged (required for security)
- No passwords or tokens logged
- Metadata sanitized

**GDPR Compliance:**

- Users can request their audit logs
- Logs can be anonymized on user deletion
- Retention period justified by security needs

**Access Control:**

- Only admins can view audit logs
- Logs cannot be modified or deleted
- API endpoints require authentication

## Troubleshooting

**Issue:** Logs not appearing

- **Cause:** Audit logging failed silently
- **Fix:** Check console logs for errors, verify database connection

**Issue:** Missing IP address

- **Cause:** Headers not available (test environment)
- **Fix:** Normal in tests, uses "test-environment" placeholder

**Issue:** Duplicate logs

- **Cause:** Multiple login attempts in quick succession
- **Fix:** This is expected behavior, each attempt is logged

**Issue:** Session expiration not logged

- **Cause:** Middleware logging is fire-and-forget
- **Fix:** Check console for errors, may fail silently

## Future Enhancements

Potential improvements:

- [ ] Real-time alerting for suspicious activity
- [ ] Geolocation tracking for login attempts
- [ ] Device fingerprinting
- [ ] Anomaly detection (unusual login times/locations)
- [ ] Dashboard for security monitoring
- [ ] Export logs for SIEM integration

## References

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [NIST SP 800-92 - Guide to Computer Security Log Management](https://csrc.nist.gov/publications/detail/sp/800-92/final)
- [SOC2 Trust Service Criteria](https://www.aicpa.org/resources/landing/trust-services-criteria)
- [GDPR Article 32 - Security of Processing](https://gdpr-info.eu/art-32-gdpr/)

## Change Log

**December 7, 2025** - Initial implementation

- Comprehensive authentication logging
- Login success/failure tracking
- Account lockout logging
- Session expiration logging
- Logout logging
- E2E tests
- Documentation

---

**Last Updated:** December 7, 2025
**Next Review:** March 7, 2026 (Quarterly)
**Owner:** Engineering Team
**Compliance:** SOC2 Type II
