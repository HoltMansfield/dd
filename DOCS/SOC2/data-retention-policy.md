# Data Retention Policy

## Overview

This document defines the data retention policies for SOC2 compliance. It specifies what data is retained, for how long, and how it is managed throughout its lifecycle.

## Policy Summary

| Data Type          | Retention Period                | Storage Location               | Deletion Policy                             |
| ------------------ | ------------------------------- | ------------------------------ | ------------------------------------------- |
| **User Documents** | User-controlled                 | Supabase Storage + Neon DB     | Hard delete on user request                 |
| **Audit Logs**     | 7 years                         | Neon DB (hot) → Archive (cold) | Never delete (unless legally required)      |
| **User Accounts**  | Active + 90 days after deletion | Neon DB                        | Soft delete, then hard delete after 90 days |
| **Session Data**   | 30 days                         | Neon DB                        | Auto-expire and delete                      |

## Detailed Policies

### 1. User Documents

**Retention Period**: User-controlled (no minimum or maximum)

**Policy**:

- Users have full control over their documents
- When a user deletes a document, it is **permanently deleted** immediately
- No soft delete or recovery period
- Complies with GDPR "right to erasure"

**What Gets Deleted**:

- ✅ File binary data from Supabase Storage
- ✅ Document metadata from `documents` table
- ❌ Audit log entry (retained for compliance)

**Implementation**:

```typescript
// Hard delete - file and metadata removed immediately
await supabaseAdmin.storage.from(bucket).remove([path]);
await db.delete(documents).where(eq(documents.id, documentId));
```

### 2. Audit Logs

**Retention Period**: 7 years (SOC2 requirement)

**Policy**:

- Audit logs are **immutable** and **never deleted**
- Logs older than 1 year are archived to cold storage
- Logs contain metadata only, never file contents
- Required for compliance audits and security investigations

**Lifecycle**:

1. **0-1 year**: Hot storage (Neon DB) - fast access for recent activity
2. **1-7 years**: Cold storage (archived) - slower access, lower cost
3. **7+ years**: Optional deletion or continued archival

**What Gets Retained**:

- User ID who performed the action
- Document ID (even if document is deleted)
- Action type (upload, download, delete, view)
- Timestamp
- IP address and user agent
- Success/failure status
- File metadata (name, size, type) - NOT file contents

**Implementation**:

```typescript
// Audit logs are never deleted
// Archive old logs to reduce database size
await archiveOldAuditLogs(365); // Archive logs older than 1 year
```

### 3. User Accounts

**Retention Period**: Active + 90 days after deletion request

**Policy**:

- When a user requests account deletion, account is soft-deleted
- 90-day grace period allows for recovery if requested
- After 90 days, account and all associated data is hard-deleted
- Audit logs are retained even after account deletion

**Soft Delete Period (0-90 days)**:

- Account marked as deleted
- User cannot log in
- Data is not accessible
- Can be recovered if user requests

**Hard Delete (After 90 days)**:

- All user data permanently deleted
- Documents deleted from storage
- Metadata removed from database
- Audit logs retained (anonymized if required)

### 4. Session Data

**Retention Period**: 30 days

**Policy**:

- Sessions expire after 30 days of inactivity
- Expired sessions are automatically deleted
- Active sessions are renewed on each use

## Archival Process

### Audit Log Archival

**Frequency**: Monthly (automated)

**Process**:

1. Identify audit logs older than 1 year
2. Export to JSON format
3. Compress and store in cold storage (S3 Glacier or similar)
4. Mark as archived in database (or move to archive table)
5. Verify archive integrity
6. Remove from hot storage

**Archive Format**:

```json
{
  "archiveDate": "2024-12-01",
  "recordCount": 15000,
  "dateRange": {
    "start": "2023-01-01",
    "end": "2023-12-31"
  },
  "logs": [
    {
      "id": "uuid",
      "userId": "uuid",
      "action": "upload",
      "timestamp": "2023-06-15T10:30:00Z",
      "metadata": {...}
    }
  ]
}
```

## Legal Holds

**Policy**: In case of litigation or investigation, a legal hold may be placed on data.

**Process**:

1. Legal team issues hold notice
2. Affected data is flagged in database
3. Automated deletion is suspended for flagged data
4. Data is preserved until hold is lifted
5. Normal retention policies resume after hold removal

## Right to Erasure (GDPR)

**Policy**: Users can request complete deletion of their data.

**Process**:

1. User submits erasure request
2. Verify user identity
3. Delete all user documents immediately
4. Soft-delete user account
5. After 90 days, hard-delete account
6. Anonymize audit logs (replace user ID with "deleted-user")
7. Provide confirmation to user

**What Gets Deleted**:

- ✅ All user documents (files + metadata)
- ✅ User account information
- ✅ Session data
- ⚠️ Audit logs (anonymized, not deleted)

**What Gets Retained**:

- Audit logs with anonymized user ID
- Aggregated analytics (no PII)
- Financial records (legal requirement)

## Backup Retention

**Policy**: Backups are retained separately from production data.

**Backup Schedule**:

- **Daily**: Last 7 days (hot backup)
- **Weekly**: Last 4 weeks (warm backup)
- **Monthly**: Last 12 months (cold backup)
- **Yearly**: 7 years (archive backup)

**Backup Deletion**:

- Backups follow the same retention policies as production data
- Backups older than 7 years are deleted
- Legal holds apply to backups as well

## Compliance & Auditing

### SOC2 Requirements

**Access Logs**: ✅ Retained for 7 years  
**Change Logs**: ✅ Retained for 7 years  
**Security Events**: ✅ Retained for 7 years  
**User Activity**: ✅ Retained for 7 years

### GDPR Requirements

**Right to Access**: ✅ Users can export their data  
**Right to Erasure**: ✅ Users can delete their data  
**Right to Portability**: ✅ Data export in JSON format  
**Data Minimization**: ✅ Only necessary data is retained

### HIPAA Requirements (if applicable)

**Audit Logs**: ✅ 6 years minimum (we retain 7)  
**Access Controls**: ✅ Documented and enforced  
**Encryption**: ✅ At rest and in transit

## Monitoring & Reporting

### Automated Monitoring

- Daily check for expired sessions
- Weekly check for old audit logs to archive
- Monthly archival process execution
- Quarterly retention policy compliance report

### Manual Reviews

- **Quarterly**: Review retention policy compliance
- **Annually**: Full data retention audit
- **As needed**: Legal hold reviews

## Implementation Checklist

- [x] Audit logs table created
- [x] Audit logging integrated into all operations
- [ ] Automated archival script for old audit logs
- [ ] Cold storage setup (S3 Glacier or equivalent)
- [ ] User data export functionality
- [ ] Account deletion workflow (soft + hard delete)
- [ ] Legal hold mechanism
- [ ] Retention policy monitoring dashboard
- [ ] Compliance reporting automation

## Related Documentation

- [Audit Logging](./audit-logging.md)
- [Data Privacy Policy](./data-privacy-policy.md)
- [Backup & Recovery](./backup-recovery.md)
- [Security Controls](./security-controls.md)

## Policy Updates

**Last Updated**: 2024-11-30  
**Next Review**: 2025-05-30  
**Owner**: Engineering & Legal Teams

Any changes to this policy must be approved by both Engineering and Legal teams.
