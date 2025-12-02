# MFA (Multi-Factor Authentication) Implementation

## Overview

This document describes the TOTP (Time-based One-Time Password) implementation for multi-factor authentication in the document storage system.

## Implementation Details

### Technology Stack

- **TOTP Library**: `otplib` - Industry-standard TOTP implementation
- **QR Code Generation**: `qrcode` - For generating authenticator app setup QR codes
- **Authenticator Apps**: Compatible with Google Authenticator, Authy, Microsoft Authenticator, 1Password, etc.

### Database Schema

Added three new fields to the `users` table:

```typescript
mfaEnabled: boolean("mfaEnabled").default(false);
mfaSecret: text("mfaSecret"); // Encrypted TOTP secret
mfaBackupCodes: text("mfaBackupCodes"); // JSON array of hashed backup codes
```

**Migration**: `drizzle/migrations/0007_mighty_night_nurse.sql`

### Core Features

#### 1. TOTP Setup

- Generate unique secret for each user
- Create QR code for easy authenticator app setup
- Verify initial setup with test code
- Generate 10 backup codes for account recovery

#### 2. Login Verification

- Verify 6-digit TOTP codes
- 30-second time window with ±1 step tolerance for clock drift
- Backup code support (single-use)

#### 3. Security Features

- Backup codes are hashed (SHA-256) before storage
- Used backup codes are automatically removed
- All MFA events are audit logged
- Password required to disable MFA

### API Functions

#### MFA Library (`src/lib/mfa.ts`)

```typescript
// Setup
generateTOTPSecret(): string
generateQRCode(email, secret, issuer): Promise<string>
generateBackupCodes(count): string[]

// Verification
verifyTOTP(token, secret): boolean
verifyBackupCode(userId, code): Promise<boolean>

// Management
enableMFA(userId, secret, backupCodes): Promise<void>
disableMFA(userId): Promise<void>
isMFAEnabled(userId): Promise<boolean>
getUserTOTPSecret(userId): Promise<string | null>
```

#### Server Actions (`src/actions/mfa.ts`)

```typescript
// User-facing actions
initializeMFASetup(): Promise<{secret, qrCode}>
completeMFASetup(secret, token): Promise<{backupCodes}>
verifyMFAToken(userId, token): Promise<{success}>
verifyMFABackupCode(userId, code): Promise<{success}>
disableMFAAction(password): Promise<{success}>
checkMFAStatus(): Promise<{enabled}>
```

### Audit Logging

All MFA operations are logged with the following action types:

- `mfa_setup_initiated` - User started MFA setup
- `mfa_setup_failed` - Setup verification failed
- `mfa_enabled` - MFA successfully enabled
- `mfa_disabled` - MFA disabled by user
- `mfa_verification` - Login MFA verification attempt
- `mfa_backup_code_used` - Backup code used for login
- `mfa_disable_failed` - Failed attempt to disable MFA

## User Flow

### Enabling MFA

1. User navigates to security settings
2. Clicks "Enable MFA"
3. System generates secret and QR code
4. User scans QR code with authenticator app
5. User enters verification code from app
6. System validates code and enables MFA
7. User receives 10 backup codes to save

### Login with MFA

1. User enters email and password
2. If MFA enabled, system prompts for verification code
3. User enters 6-digit code from authenticator app
4. System verifies code and grants access
5. Alternative: User can use backup code if needed

### Disabling MFA

1. User navigates to security settings
2. Clicks "Disable MFA"
3. System prompts for password confirmation
4. User enters password
5. System disables MFA and removes secret/backup codes

## Security Considerations

### Strengths

✅ **No External Dependencies**: Completely self-contained, no SMS provider needed
✅ **Industry Standard**: TOTP is RFC 6238 compliant
✅ **Offline Support**: Works without internet connection
✅ **Phishing Resistant**: Time-based codes can't be reused
✅ **Backup Codes**: Account recovery without support intervention
✅ **Audit Trail**: Complete logging of all MFA events

### Best Practices Implemented

- Secrets are never displayed after initial setup
- Backup codes are hashed before storage
- Used backup codes are immediately invalidated
- Password required to disable MFA
- Clock drift tolerance (±30 seconds)
- Comprehensive audit logging

### Recommendations

1. **Enforce MFA for Admins**: Require MFA for users with elevated privileges
2. **MFA Reminder**: Prompt users to enable MFA periodically
3. **Recovery Process**: Document backup code storage recommendations
4. **Rate Limiting**: Add rate limiting to MFA verification endpoints
5. **Session Management**: Consider shorter session timeouts for non-MFA users

## SOC2 Compliance Benefits

This implementation addresses multiple SOC2 requirements:

### Security Controls (CC6.1)

- ✅ Multi-factor authentication for user access
- ✅ Strong authentication mechanisms
- ✅ Protection against unauthorized access

### Access Control (CC6.2)

- ✅ Enhanced identity verification
- ✅ Reduced risk of credential compromise
- ✅ Audit trail for authentication events

### Monitoring (CC7.2)

- ✅ Logging of all MFA events
- ✅ Failed authentication tracking
- ✅ Backup code usage monitoring

## Testing

### Manual Testing Checklist

- [ ] Enable MFA with Google Authenticator
- [ ] Verify login with TOTP code
- [ ] Test backup code login
- [ ] Verify backup code is invalidated after use
- [ ] Test MFA disable with password
- [ ] Verify audit logs are created
- [ ] Test clock drift tolerance
- [ ] Test invalid code rejection

### E2E Test Coverage (TODO)

Future E2E tests should cover:

- MFA setup flow
- Login with MFA
- Backup code usage
- MFA disable flow
- Audit log verification

## Next Steps

### Phase 1: UI Implementation (Current)

- [ ] Create MFA setup page/modal
- [ ] Add MFA verification to login flow
- [ ] Create security settings page
- [ ] Display backup codes securely
- [ ] Add "Use backup code" option

### Phase 2: Enhancements

- [ ] Add MFA enforcement for admin users
- [ ] Implement rate limiting on verification endpoints
- [ ] Add MFA reminder notifications
- [ ] Create recovery flow documentation
- [ ] Add E2E tests for MFA flows

### Phase 3: Advanced Features

- [ ] WebAuthn/FIDO2 support (hardware keys)
- [ ] SMS backup option (via Twilio)
- [ ] Email backup option (via Resend)
- [ ] Trusted device management
- [ ] Remember device for 30 days option

## Cost Analysis

### Current Implementation (TOTP)

- **Cost**: $0/month
- **Scalability**: Unlimited users
- **Reliability**: 100% (no external dependencies)

### Future Options

- **SMS (Twilio)**: ~$0.0079/verification
- **Email (Resend)**: Free tier: 3,000/month
- **WebAuthn**: $0 (browser-based)

## References

- [RFC 6238 - TOTP Specification](https://tools.ietf.org/html/rfc6238)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [otplib Documentation](https://github.com/yeojz/otplib)
- [SOC2 Trust Service Criteria](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report.html)

---

**Document Version**: 1.0  
**Created**: December 1, 2024  
**Author**: Development Team  
**Status**: Implementation in Progress
