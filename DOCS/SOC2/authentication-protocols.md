# Authentication Protocols - SOC2 Compliance Documentation

## Overview

This document details the secure authentication protocols implemented in the application to meet SOC2 compliance requirements for access control and data security.

## Implemented Security Protocols

### 1. Password Authentication (bcrypt)

**Protocol:** bcrypt password hashing algorithm
**Standard:** Industry-standard adaptive hash function based on Blowfish cipher
**Implementation:** `bcryptjs` library with salt rounds of 10

**Security Features:**

- Adaptive hashing (computationally expensive to prevent brute force)
- Automatic salt generation
- One-way hashing (passwords cannot be reversed)
- Protection against rainbow table attacks

**Code Reference:**

- Registration: `src/app/register/actions.ts`
- Login validation: `src/app/login/actions.ts`
- MFA verification: `src/actions/mfa.ts`

**Compliance:**

- ✅ Meets OWASP password storage guidelines
- ✅ Satisfies NIST SP 800-63B requirements
- ✅ Industry-standard cryptographic protocol

### 2. Multi-Factor Authentication (TOTP - RFC 6238)

**Protocol:** Time-based One-Time Password (TOTP)
**Standard:** RFC 6238 - TOTP: Time-Based One-Time Password Algorithm
**Implementation:** `otplib` library with 30-second time windows

**Security Features:**

- Time-synchronized one-time passwords
- 6-digit codes with 30-second validity
- Encrypted secret storage in database
- Backup codes for account recovery
- QR code provisioning for authenticator apps

**Code Reference:**

- MFA setup: `src/actions/mfa.ts`
- MFA verification: `src/app/login/verify/actions.ts`
- Database schema: `src/db/schema.ts` (mfaEnabled, mfaSecret, mfaBackupCodes)

**Compliance:**

- ✅ IETF RFC 6238 compliant
- ✅ Recognized secure authentication protocol
- ✅ Meets SOC2 multi-factor authentication requirements
- ✅ Compatible with Google Authenticator, Authy, 1Password, etc.

### 3. Secure Session Management

**Protocol:** Secure HTTP cookie-based sessions
**Standards:**

- OWASP Session Management Cheat Sheet
- RFC 6265 (HTTP State Management Mechanism)

**Security Features:**

- HttpOnly cookies (prevents XSS attacks)
- Secure flag (HTTPS-only in production)
- SameSite=Lax (CSRF protection)
- Automatic session timeouts (30 min inactivity, 12 hr max)
- Activity-based session extension
- Server-side session validation

**Code Reference:**

- Session configuration: `src/lib/session-config.ts`
- Middleware validation: `src/middleware.ts`
- Login actions: `src/app/login/actions.ts`
- Session management: `src/actions/auth.ts`

**Compliance:**

- ✅ Follows OWASP secure session management guidelines
- ✅ Implements automatic timeout controls
- ✅ Prevents session fixation and hijacking
- ✅ Meets SOC2 session security requirements

### 4. Account Lockout Protection

**Protocol:** Adaptive account lockout after failed authentication attempts
**Standard:** OWASP Authentication guidelines

**Security Features:**

- Maximum 5 failed login attempts
- 15-minute lockout period
- Automatic reset on successful login
- Protection against brute force attacks
- Audit logging of failed attempts

**Code Reference:**

- Implementation: `src/app/login/actions.ts`
- Constants: `src/app/login/constants.ts`
- Database tracking: `src/db/schema.ts` (failedLoginAttempts, lockoutUntil)

**Compliance:**

- ✅ Prevents automated attacks
- ✅ Meets SOC2 access control requirements
- ✅ Industry best practice

### 5. Transport Layer Security (TLS)

**Protocol:** TLS 1.2+ (HTTPS)
**Standard:** RFC 8446 (TLS 1.3), RFC 5246 (TLS 1.2)

**Security Features:**

- All data encrypted in transit
- Certificate-based authentication
- Protection against man-in-the-middle attacks
- Enforced in production environment

**Compliance:**

- ✅ Meets SOC2 encryption in transit requirements
- ✅ Industry standard for secure communications
- ✅ PCI DSS compliant

## Password Policy

**Implementation:** `src/lib/password-validation.ts`, `src/app/register/schema.ts`

**Requirements:**

- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Real-time validation feedback

**Compliance:**

- ✅ Exceeds NIST SP 800-63B minimum requirements (8 characters)
- ✅ Meets SOC2 strong password policy requirements
- ✅ Industry best practice

## Audit Logging

**Implementation:** `src/actions/audit.ts`

**Logged Events:**

- All authentication attempts (success and failure)
- MFA setup and disable events
- Session creation and termination
- Account lockout events
- Password changes

**Compliance:**

- ✅ Meets SOC2 audit trail requirements
- ✅ Enables security incident investigation
- ✅ Supports compliance reporting

## Security Headers

**Implementation:** `next.config.mjs`

**Headers:**

- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy

**Compliance:**

- ✅ OWASP secure headers recommendations
- ✅ Protection against common web vulnerabilities

## Summary

The application implements multiple industry-standard secure authentication protocols:

1. **bcrypt** - Secure password hashing
2. **TOTP (RFC 6238)** - Multi-factor authentication
3. **Secure HTTP cookies (RFC 6265)** - Session management
4. **TLS 1.2+** - Transport encryption
5. **Account lockout** - Brute force protection

These protocols collectively provide defense-in-depth security and meet or exceed SOC2 Type II requirements for:

- Access control
- Authentication and authorization
- Data protection
- Audit and accountability

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST SP 800-63B - Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [RFC 6238 - TOTP Specification](https://datatracker.ietf.org/doc/html/rfc6238)
- [RFC 6265 - HTTP State Management](https://datatracker.ietf.org/doc/html/rfc6265)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

## Maintenance

This document should be reviewed and updated:

- When authentication mechanisms are modified
- During annual SOC2 audits
- When new security standards are adopted
- After security incidents or vulnerabilities

**Last Updated:** December 6, 2025
**Next Review:** December 6, 2026
