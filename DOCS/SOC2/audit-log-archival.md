# Audit Log Archival Process

## Overview

This document describes the process for archiving old audit logs to comply with the 7-year retention policy while keeping the hot database performant.

## Why Archive?

- **Performance**: Keep hot database fast by moving old logs to cold storage
- **Cost**: Cold storage (S3 Glacier) is ~90% cheaper than hot database
- **Compliance**: Maintain 7-year retention without database bloat
- **Searchability**: Recent logs (< 1 year) remain quickly searchable

## Archival Schedule

**Frequency**: Monthly (1st of each month)

**What Gets Archived**: Audit logs older than 1 year

**Retention**: Archives kept for 7 years total

## Archival Process

### 1. Export Logs

Run the archival script:

```bash
npx tsx scripts/archive-audit-logs.ts
```

This will:

- Query all audit logs older than 365 days
- Export them to JSON format
- Save to `audit-archives/` directory
- Display statistics and next steps

### 2. Upload to Cold Storage

**Recommended**: AWS S3 Glacier Deep Archive

```bash
# Example: Upload to S3 Glacier
aws s3 cp audit-archives/audit-logs-2023-01-01-to-2023-12-31.json \
  s3://your-bucket/audit-archives/ \
  --storage-class DEEP_ARCHIVE
```

**Alternative Options**:

- Google Cloud Archive Storage
- Azure Archive Storage
- Local encrypted backup drives (for small deployments)

### 3. Verify Archive

```bash
# Verify file was uploaded
aws s3 ls s3://your-bucket/audit-archives/

# Verify file integrity (checksum)
aws s3api head-object \
  --bucket your-bucket \
  --key audit-archives/audit-logs-2023-01-01-to-2023-12-31.json
```

### 4. Delete from Hot Database (Optional)

⚠️ **ONLY after archive is verified!**

```sql
-- Delete logs older than 1 year
DELETE FROM "auditLogs"
WHERE timestamp < NOW() - INTERVAL '1 year';
```

Or use a helper function:

```typescript
// TODO: Implement deleteArchivedLogs() function
await deleteArchivedLogs(365);
```

## Archive File Format

```json
{
  "archiveDate": "2024-12-01T00:00:00.000Z",
  "recordCount": 15000,
  "dateRange": {
    "start": "2023-01-01T00:00:00.000Z",
    "end": "2023-12-31T23:59:59.999Z"
  },
  "retentionPolicy": "7 years",
  "logs": [
    {
      "id": "uuid",
      "userId": "uuid",
      "documentId": "uuid",
      "action": "upload",
      "timestamp": "2023-06-15T10:30:00.000Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": "{\"fileName\":\"report.pdf\",\"fileSize\":1024000}",
      "success": true,
      "errorMessage": null
    }
  ]
}
```

## Retrieving Archived Logs

### For Recent Logs (< 1 year)

Query the hot database directly:

```typescript
const logs = await getUserAuditLogs(userId, 100);
```

### For Old Logs (> 1 year)

1. **Identify the archive file** containing the date range
2. **Retrieve from cold storage** (may take hours for Glacier)
3. **Parse JSON** and search locally

```bash
# Request retrieval from Glacier (takes 12-48 hours)
aws s3api restore-object \
  --bucket your-bucket \
  --key audit-archives/audit-logs-2023-01-01-to-2023-12-31.json \
  --restore-request Days=7,GlacierJobParameters={Tier=Standard}

# After retrieval is complete, download
aws s3 cp s3://your-bucket/audit-archives/audit-logs-2023-01-01-to-2023-12-31.json .

# Search locally
cat audit-logs-2023-01-01-to-2023-12-31.json | jq '.logs[] | select(.userId == "user-uuid")'
```

## Automation

### Cron Job Setup

Add to crontab to run monthly:

```bash
# Edit crontab
crontab -e

# Add this line (runs 1st of each month at midnight)
0 0 1 * * cd /path/to/app && npx tsx scripts/archive-audit-logs.ts >> /var/log/audit-archival.log 2>&1
```

### GitHub Actions (Alternative)

```yaml
name: Archive Audit Logs
on:
  schedule:
    - cron: "0 0 1 * *" # Monthly on the 1st
  workflow_dispatch: # Manual trigger

jobs:
  archive:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx tsx scripts/archive-audit-logs.ts
      - name: Upload to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws s3 sync audit-archives/ s3://your-bucket/audit-archives/ \
            --storage-class DEEP_ARCHIVE
```

## Cost Estimates

### Hot Database (Neon)

- **Storage**: $0.10/GB/month
- **1M logs ≈ 500MB**: $0.05/month
- **10M logs ≈ 5GB**: $0.50/month

### Cold Storage (S3 Glacier Deep Archive)

- **Storage**: $0.00099/GB/month
- **1M logs ≈ 500MB**: $0.0005/month (99% savings!)
- **10M logs ≈ 5GB**: $0.005/month (99% savings!)

**Retrieval Costs**:

- Standard (12-48 hours): $0.02/GB
- Bulk (48 hours): $0.0025/GB

## Monitoring

### Monthly Checklist

- [ ] Run archival script
- [ ] Verify archive file created
- [ ] Upload to cold storage
- [ ] Verify upload successful
- [ ] Check archive file integrity
- [ ] (Optional) Delete from hot database
- [ ] Update archival log/spreadsheet
- [ ] Verify backup exists

### Metrics to Track

- Total audit logs in hot database
- Total audit logs archived
- Archive file sizes
- Cold storage costs
- Retrieval requests (should be rare)

## Disaster Recovery

### If Archive is Lost

- **Backups**: Daily database backups include audit logs
- **Redundancy**: Store archives in multiple regions
- **Verification**: Monthly integrity checks

### If Hot Database is Lost

- **Recent logs**: Restore from daily backup
- **Old logs**: Retrieve from cold storage archives

## Compliance Notes

### SOC2 Requirements

✅ **Audit logs retained for 7 years**  
✅ **Logs are immutable** (write-once, read-many)  
✅ **Access is logged** (archive retrieval is tracked)  
✅ **Integrity verified** (checksums)

### GDPR Considerations

- Archives may contain PII (IP addresses, user IDs)
- For "right to erasure" requests, anonymize user ID in archives
- Document archive locations in privacy policy

## Troubleshooting

### Archive Script Fails

```bash
# Check database connection
psql $DB_URL -c "SELECT COUNT(*) FROM \"auditLogs\";"

# Check disk space
df -h

# Run with verbose logging
DEBUG=* npx tsx scripts/archive-audit-logs.ts
```

### Archive File Too Large

If archive file > 1GB, split by month:

```typescript
// Modify script to archive by month instead of year
const archiveData = await exportAuditLogsForArchival(30); // 30 days
```

### Retrieval Takes Too Long

- Use Expedited retrieval (1-5 minutes, higher cost)
- Keep more recent logs in hot database (e.g., 2 years instead of 1)
- Implement archive index for faster searching

## Related Documentation

- [Data Retention Policy](./data-retention-policy.md)
- [Audit Logging](./audit-logging.md)
- [Backup & Recovery](./backup-recovery.md)

## Next Steps

1. Set up S3 Glacier bucket (or equivalent)
2. Configure AWS credentials
3. Test archival script in staging
4. Set up monthly cron job
5. Document first archival in compliance log
