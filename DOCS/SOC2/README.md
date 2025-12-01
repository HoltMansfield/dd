# SOC2 Compliance Documentation

## Overview

This directory contains all documentation related to SOC2 compliance for the document management system.

## Documents

### [Audit Logging](./audit-logging.md)

Complete guide to the audit logging system that tracks all file operations.

**Key Features**:

- Immutable audit trail
- User attribution
- IP address and user agent tracking
- Success/failure logging
- 7-year retention

### [Data Retention Policy](./data-retention-policy.md)

Defines what data is retained, for how long, and how it's managed.

**Key Policies**:

- User documents: User-controlled (hard delete)
- Audit logs: 7 years (never delete)
- User accounts: 90-day grace period
- Session data: 30 days

### [Audit Log Archival](./audit-log-archival.md)

Process for archiving old audit logs to cold storage.

**Key Process**:

- Monthly archival of logs > 1 year old
- Export to JSON format
- Upload to S3 Glacier Deep Archive
- 99% cost savings vs hot database

## Quick Start

### View Audit Log Statistics

```bash
npm run audit:stats
```

Output:

```json
{
  "total": 15000,
  "byAction": {
    "upload": 5000,
    "download": 8000,
    "delete": 2000
  },
  "failed": 150,
  "olderThanOneYear": 3000
}
```

### Archive Old Audit Logs

```bash
npm run archive:audit-logs
```

This will:

1. Export logs older than 1 year
2. Save to `audit-archives/` directory
3. Display next steps for cold storage upload

### Query Audit Logs

```typescript
import {
  getUserAuditLogs,
  getDocumentAuditLogs,
  getAllAuditLogs,
} from "@/lib/audit";

// Get all actions by a user
const userLogs = await getUserAuditLogs("user-uuid");

// Get all actions on a document
const docLogs = await getDocumentAuditLogs("doc-uuid");

// Get all logs (admin only)
const allLogs = await getAllAuditLogs(1000);
```

## SOC2 Compliance Checklist

### ✅ Completed

- [x] **Audit Logging**

  - [x] Database schema
  - [x] Integration with all file operations
  - [x] IP address and user agent tracking
  - [x] Success/failure logging
  - [x] Query helper functions

- [x] **Data Retention Policy**

  - [x] Policy documentation
  - [x] Hard delete for user documents
  - [x] 7-year retention for audit logs
  - [x] Archival process defined

- [x] **Archival System**
  - [x] Export functionality
  - [x] Archival script
  - [x] Documentation
  - [x] npm scripts

### 🔄 In Progress

- [ ] **Cold Storage Setup**

  - [ ] S3 Glacier bucket configuration
  - [ ] Automated upload process
  - [ ] Archive verification

- [ ] **Automation**
  - [ ] Monthly cron job
  - [ ] Archive integrity checks
  - [ ] Compliance reporting

### 📋 Planned

- [ ] **Admin Dashboard**

  - [ ] Audit log viewer UI
  - [ ] Statistics dashboard
  - [ ] User access reports
  - [ ] Suspicious activity alerts

- [ ] **Enhanced Security**

  - [ ] Multi-factor authentication
  - [ ] Session timeout policies
  - [ ] Rate limiting
  - [ ] Password complexity requirements

- [ ] **Data Privacy**
  - [ ] User data export
  - [ ] Right to erasure implementation
  - [ ] Data anonymization
  - [ ] Privacy policy updates

## Compliance Requirements Met

### SOC2 Trust Service Criteria

| Criterion | Requirement                         | Status      |
| --------- | ----------------------------------- | ----------- |
| **CC6.1** | Audit logs for all access           | ✅ Complete |
| **CC6.2** | Logs retained for compliance period | ✅ Complete |
| **CC6.3** | Logs are immutable                  | ✅ Complete |
| **CC7.2** | User attribution for all actions    | ✅ Complete |
| **CC7.3** | Failed access attempts logged       | ✅ Complete |

### GDPR Requirements

| Requirement              | Implementation               | Status      |
| ------------------------ | ---------------------------- | ----------- |
| **Right to Access**      | User data export             | 📋 Planned  |
| **Right to Erasure**     | Hard delete on request       | ✅ Complete |
| **Right to Portability** | JSON export format           | 📋 Planned  |
| **Data Minimization**    | Only necessary data retained | ✅ Complete |

## Cost Estimates

### Current (Hot Database Only)

- 1M audit logs ≈ 500MB
- Neon DB: $0.10/GB/month
- **Cost**: ~$0.05/month per 1M logs

### With Archival (Hot + Cold)

- Recent logs (< 1 year) in hot DB
- Old logs (> 1 year) in S3 Glacier
- S3 Glacier: $0.00099/GB/month
- **Cost**: ~$0.005/month per 1M archived logs
- **Savings**: 99% reduction for archived logs

### Example: 10M Logs Over 7 Years

**Without Archival**:

- 10M logs ≈ 5GB
- Cost: $0.50/month = $42/year = **$294 over 7 years**

**With Archival**:

- Recent (1M logs): $0.05/month
- Archived (9M logs): $0.045/month
- Cost: $0.095/month = $8/year = **$56 over 7 years**
- **Savings**: $238 (81% reduction)\*\*

## Monitoring

### Daily Checks

- Session cleanup (automated)
- Failed login attempts review

### Weekly Checks

- Audit log growth rate
- Failed operation patterns
- Storage usage

### Monthly Tasks

- Run archival script
- Upload archives to cold storage
- Verify archive integrity
- Review compliance metrics

### Quarterly Reviews

- Full retention policy compliance audit
- Security incident review
- Access pattern analysis
- Cost optimization review

## Support & Escalation

### For Questions

- **Technical**: Engineering team
- **Compliance**: Legal/Compliance team
- **Security Incidents**: Security team + Legal

### Incident Response

1. Identify the incident
2. Query audit logs for affected users/documents
3. Preserve evidence (legal hold if needed)
4. Notify affected parties
5. Document in incident log

## Related Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Neon Database Documentation](https://neon.tech/docs)
- [AWS S3 Glacier Documentation](https://docs.aws.amazon.com/glacier/)
- [SOC2 Trust Service Criteria](https://www.aicpa.org/resources/landing/trust-services-criteria)

## Changelog

- **2024-11-30**: Initial audit logging implementation
- **2024-11-30**: Data retention policy documented
- **2024-11-30**: Archival process created

---

**Last Updated**: 2024-11-30  
**Next Review**: 2025-05-30  
**Maintained By**: Engineering Team
