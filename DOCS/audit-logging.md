# Audit Logging for SOC2 Compliance

## Overview

The audit logging system provides a complete, immutable trail of all file operations for SOC2 compliance. Every upload, download, and delete operation is logged with user attribution, timestamps, and contextual metadata.

## Database Schema

### `auditLogs` Table

| Column         | Type      | Description                                                    |
| -------------- | --------- | -------------------------------------------------------------- |
| `id`           | UUID      | Primary key                                                    |
| `userId`       | UUID      | User who performed the action (FK to users)                    |
| `documentId`   | UUID      | Document affected (FK to documents, nullable)                  |
| `action`       | TEXT      | Type of action: 'upload', 'download', 'delete', 'view', 'list' |
| `timestamp`    | TIMESTAMP | When the action occurred (auto-generated)                      |
| `ipAddress`    | TEXT      | IP address of the request                                      |
| `userAgent`    | TEXT      | Browser/client user agent                                      |
| `metadata`     | TEXT      | JSON string with additional context                            |
| `success`      | INTEGER   | 1 for success, 0 for failure                                   |
| `errorMessage` | TEXT      | Error details if success = 0                                   |

## What Gets Logged

### Upload Operations

- **Success**: User ID, document ID, file name, file size, MIME type
- **Failure**: User ID, error message

### Download Operations

- **Success**: User ID, document ID, file name
- **Failure**: User ID, document ID, error message

### Delete Operations

- **Success**: User ID, document ID, file name, file size
- **Failure**: User ID, document ID, error message

## Usage

### Creating Audit Logs

```typescript
import { createAuditLog } from "@/lib/audit";

// Log successful upload
await createAuditLog({
  userId: "user-uuid",
  action: "upload",
  documentId: "doc-uuid",
  success: true,
  metadata: {
    fileName: "report.pdf",
    fileSize: 1024000,
    mimeType: "application/pdf",
  },
});

// Log failed download
await createAuditLog({
  userId: "user-uuid",
  action: "download",
  documentId: "doc-uuid",
  success: false,
  errorMessage: "File not found in storage",
});
```

### Querying Audit Logs

```typescript
import {
  getUserAuditLogs,
  getDocumentAuditLogs,
  getAllAuditLogs,
} from "@/lib/audit";

// Get all actions by a specific user
const userLogs = await getUserAuditLogs("user-uuid", 100);

// Get all actions on a specific document
const docLogs = await getDocumentAuditLogs("doc-uuid", 100);

// Get all audit logs (admin only)
const allLogs = await getAllAuditLogs(1000);
```

## SOC2 Compliance Benefits

### 1. **Access Control Monitoring**

- Track who accessed what files and when
- Identify unauthorized access attempts
- Monitor user activity patterns

### 2. **Change Management**

- Complete history of file modifications
- Track deletions with user attribution
- Audit trail for compliance reviews

### 3. **Incident Response**

- Investigate security incidents
- Identify affected files and users
- Timeline reconstruction for forensics

### 4. **Compliance Reporting**

- Generate access reports for auditors
- Demonstrate security controls
- Prove data handling procedures

## Best Practices

### 1. **Never Delete Audit Logs**

Audit logs should be immutable and retained indefinitely (or per your retention policy).

### 2. **Monitor Failed Actions**

Failed actions may indicate:

- Unauthorized access attempts
- System issues
- User errors requiring support

### 3. **Regular Reviews**

- Review audit logs periodically
- Look for anomalous patterns
- Investigate repeated failures

### 4. **Secure Access**

- Restrict audit log access to admins only
- Log access to audit logs themselves
- Implement role-based access control

## Retention Policy

**Recommended**: Retain audit logs for at least 7 years for SOC2 compliance.

Configure automatic archival:

1. Export logs older than 1 year to cold storage
2. Keep recent logs in hot database for quick access
3. Implement backup procedures for audit logs

## Future Enhancements

### Planned Features

- [ ] Audit log viewer UI (admin dashboard)
- [ ] Export audit logs to CSV/JSON
- [ ] Real-time alerts for suspicious activity
- [ ] Automated compliance reports
- [ ] Integration with SIEM systems
- [ ] Audit log integrity verification (checksums)

## Example Queries

### Find all downloads by a user

```sql
SELECT * FROM "auditLogs"
WHERE "userId" = 'user-uuid'
AND action = 'download'
ORDER BY timestamp DESC;
```

### Find all failed operations

```sql
SELECT * FROM "auditLogs"
WHERE success = 0
ORDER BY timestamp DESC;
```

### Find all actions on a document

```sql
SELECT * FROM "auditLogs"
WHERE "documentId" = 'doc-uuid'
ORDER BY timestamp DESC;
```

### Count operations by type

```sql
SELECT action, COUNT(*) as count
FROM "auditLogs"
GROUP BY action;
```

## Security Considerations

1. **IP Address Privacy**: IP addresses are logged for security but may be considered PII in some jurisdictions
2. **User Agent**: Helps identify client types but may contain identifying information
3. **Metadata**: Be careful not to log sensitive data in metadata field
4. **Access Control**: Implement strict RBAC for audit log access

## Related Documentation

- [SOC2 Compliance Overview](./soc2-compliance.md)
- [File Storage Architecture](./architecture-storage.md)
- [Security Best Practices](./security.md)
