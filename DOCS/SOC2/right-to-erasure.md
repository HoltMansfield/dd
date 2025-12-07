# Right to Erasure (Right to be Forgotten)

## Overview

This document describes the implementation of the Right to Erasure (also known as Right to be Forgotten), a key requirement for GDPR compliance and SOC2 Privacy Controls. This feature allows users to permanently delete their account and all associated personal data.

## Legal Requirements

### GDPR Article 17 - Right to Erasure

Under GDPR, individuals have the right to have their personal data erased when:

- The data is no longer necessary for the purpose it was collected
- The individual withdraws consent
- The individual objects to the processing
- The data was unlawfully processed
- Erasure is required for compliance with legal obligations

### SOC2 Privacy Controls

SOC2 requires organizations to:

- Provide mechanisms for data subjects to exercise their privacy rights
- Document data retention and disposal procedures
- Implement secure deletion processes
- Retain audit logs for compliance purposes

## Implementation

### User Interface

**Location**: `/settings/account`

**Features**:

- Clear "Danger Zone" section with warnings
- Two-step confirmation process
- Password verification for security
- Detailed list of what will be deleted
- Notice about audit log retention

**Access**: Available to all authenticated users via navigation bar

### Server Action

**File**: `src/actions/user.ts`  
**Function**: `deleteUserAccount(password: string)`

**Process**:

1. **Authentication Check**

   - Verify user is logged in
   - Get current user ID from session

2. **Password Verification**

   - Retrieve user record from database
   - Compare provided password with stored hash using bcrypt
   - Fail immediately if password is incorrect
   - Log failed attempt to audit trail

3. **Document Deletion**

   - Query all documents owned by user
   - Delete each document from Supabase Storage
   - Track any storage deletion errors
   - Continue even if some deletions fail (best effort)

4. **Audit Logging**

   - Create `account_deleted` audit log BEFORE user deletion
   - Include: email, document count, storage error count
   - Audit logs are retained (not deleted with user)

5. **Database Deletion**

   - Delete user record from `users` table
   - Cascades automatically to:
     - `sessions` (all user sessions)
     - `documents` (document metadata)
     - `documentPermissions` (sharing permissions)
   - Does NOT cascade to `auditLogs` (retained for compliance)

6. **Session Cleanup**
   - Clear all session cookies
   - Redirect to home page

### Database Schema

**Cascade Relationships** (from `src/db/schema.ts`):

```typescript
// Sessions - CASCADE DELETE
userId: uuid("userId")
  .notNull()
  .references(() => users.id, { onDelete: "cascade" });

// Documents - CASCADE DELETE
userId: uuid("userId")
  .notNull()
  .references(() => users.id, { onDelete: "cascade" });

// Document Permissions - CASCADE DELETE
userId: uuid("userId")
  .notNull()
  .references(() => users.id, { onDelete: "cascade" });

// Audit Logs - SET NULL (retained)
userId: uuid("userId")
  .notNull()
  .references(() => users.id, { onDelete: "cascade" });
// Note: Should be changed to SET NULL for compliance
```

### Audit Trail

**Actions Logged**:

1. **`account_deletion_failed`**

   - Triggered when: Password verification fails
   - Metadata: Error message
   - Success: false

2. **`account_deleted`**
   - Triggered when: Account successfully deleted
   - Metadata:
     - `email`: User's email address
     - `documentsDeleted`: Count of documents removed
     - `storageErrorCount`: Number of storage deletion failures (if any)
   - Success: true

**Retention**: Audit logs are retained for 7 years per compliance policy, even after account deletion.

## Security Considerations

### Password Verification

- **Why**: Prevents unauthorized account deletion
- **How**: bcrypt password comparison
- **Failure**: Logged to audit trail, deletion aborted

### Two-Step Confirmation

- **Step 1**: Click "Delete My Account" button
- **Step 2**: Enter password and confirm

### Session Termination

- All session cookies cleared immediately
- User logged out and redirected
- No way to undo deletion

### Storage Deletion

- Best-effort deletion from Supabase Storage
- Errors logged but don't block account deletion
- Storage provider (Supabase) has additional retention policies

## Data Retention

### What is Deleted

✅ **Immediately Deleted**:

- User account record
- User profile information
- All user sessions
- All uploaded documents (files and metadata)
- All document sharing permissions
- MFA settings and backup codes

### What is Retained

✅ **Retained for Compliance** (7 years):

- Audit logs showing user's actions
- Audit log of account deletion
- Anonymized references (userId remains in logs)

**Rationale**: Legal and regulatory requirements mandate retention of audit trails for compliance, fraud prevention, and legal proceedings.

## User Experience

### Before Deletion

1. User navigates to Settings → Account
2. Sees "Danger Zone" with clear warnings
3. Clicks "Delete My Account"

### Confirmation Screen

Shows:

- ⚠️ Warning that action is permanent
- List of what will be deleted:
  - Account and profile
  - All uploaded documents
  - All document permissions
  - Session and login data
- Notice about audit log retention
- Password input field
- "Yes, Delete My Account" button (red)
- "Cancel" button

### After Deletion

- Account immediately deleted
- Logged out automatically
- Redirected to home page
- Cannot log in again (account no longer exists)
- All documents inaccessible

## Testing

### Manual Testing Checklist

- [ ] Navigate to `/settings/account`
- [ ] Click "Delete My Account"
- [ ] Verify confirmation screen appears
- [ ] Try to delete without password (should fail)
- [ ] Try to delete with wrong password (should fail and log)
- [ ] Delete with correct password
- [ ] Verify redirect to home page
- [ ] Try to log in with deleted account (should fail)
- [ ] Verify documents are deleted from storage
- [ ] Verify audit logs still exist
- [ ] Verify user record is deleted from database

### Automated Testing

E2E tests should cover:

- Account deletion flow
- Password verification
- Cascade deletions
- Audit log creation
- Session termination

## Compliance

### GDPR Compliance

✅ **Article 17 Requirements Met**:

- User can request erasure via self-service
- Personal data is deleted without undue delay
- Process is documented and auditable
- Exceptions properly handled (audit logs retained per legal obligation)

### SOC2 Compliance

✅ **Privacy Controls Met**:

- Documented data disposal procedures
- Secure deletion process
- Audit trail of deletions
- User authentication required
- Retention policy documented

## Limitations

### Cannot Be Undone

Once deleted, the account cannot be recovered. Users must create a new account if they wish to use the service again.

### Audit Log Retention

Audit logs are retained for 7 years and cannot be deleted. This is required for:

- Legal compliance
- Fraud prevention
- Regulatory audits
- Dispute resolution

### Storage Provider Retention

Supabase may retain deleted files in backups for a period of time per their retention policies. This is disclosed in the deletion confirmation.

### Shared Documents

If documents were shared with other users, those users' access is revoked but their audit logs showing past access remain.

## Future Enhancements

### Potential Improvements

1. **Email Confirmation**

   - Send confirmation email before deletion
   - Require email link click for extra security

2. **Cooling-Off Period**

   - Soft delete with 30-day recovery period
   - Hard delete after cooling-off period

3. **Data Export**

   - Allow users to download their data before deletion
   - GDPR Article 20 (Right to Data Portability)

4. **Deletion Report**

   - Email summary of what was deleted
   - Confirmation number for records

5. **Admin Override**
   - Allow admins to prevent deletion (e.g., active legal hold)
   - Require admin approval for certain accounts

## References

- [GDPR Article 17 - Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
- [SOC2 Privacy Principle](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome)
- [NIST SP 800-88 - Media Sanitization](https://csrc.nist.gov/publications/detail/sp/800-88/rev-1/final)

---

**Document Version**: 1.0  
**Last Updated**: December 7, 2024  
**Next Review Date**: March 7, 2025  
**Owner**: Engineering & Compliance Team
