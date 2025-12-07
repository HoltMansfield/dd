# SOC2 Compliance TODO

## Priority Tasks

### 1. Scheduled Document Integrity Verification (Recommended)

**Status**: Not Started  
**Priority**: Medium  
**Effort**: 2-3 hours  
**SOC2 Requirement**: Processing Integrity Controls

**Description**:
Implement a scheduled background job to periodically verify document integrity. This provides ongoing assurance that stored documents haven't been corrupted and creates audit evidence for SOC2 compliance.

**Implementation Plan**:

1. **Create Verification Job**

   - Weekly cron job (or daily for higher assurance)
   - Verify random 10% sample of all documents
   - Or verify all documents uploaded in last 7 days
   - Log all verification results to audit trail

2. **Add Alerting**

   - Send alert if any integrity checks fail
   - Email to admin/security team
   - Include: document ID, filename, checksum mismatch details

3. **Create Admin Dashboard**

   - Show integrity verification statistics
   - Last verification run timestamp
   - Success/failure counts
   - List of any failed verifications

4. **Implementation Options**:

   **Option A: Next.js API Route + External Cron**

   ```typescript
   // app/api/cron/verify-integrity/route.ts
   export async function GET(request: Request) {
     // Verify CRON_SECRET for security
     const authHeader = request.headers.get("authorization");
     if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
       return new Response("Unauthorized", { status: 401 });
     }

     // Get random 10% of documents
     const documents = await getRandomDocumentSample(0.1);

     const results = {
       total: documents.length,
       verified: 0,
       failed: 0,
       errors: [],
     };

     for (const doc of documents) {
       const result = await verifyDocumentIntegrity(doc.id);
       if (result.valid) {
         results.verified++;
       } else {
         results.failed++;
         results.errors.push({
           documentId: doc.id,
           fileName: doc.fileName,
           error: result.error,
         });
       }
     }

     // Send alert if failures
     if (results.failed > 0) {
       await sendIntegrityAlertEmail(results);
     }

     return Response.json(results);
   }
   ```

   **Option B: Vercel Cron Jobs**

   ```json
   // vercel.json
   {
     "crons": [
       {
         "path": "/api/cron/verify-integrity",
         "schedule": "0 2 * * 0" // 2 AM every Sunday
       }
     ]
   }
   ```

   **Option C: GitHub Actions**

   ```yaml
   # .github/workflows/verify-integrity.yml
   name: Weekly Document Integrity Check
   on:
     schedule:
       - cron: '0 2 * * 0' # 2 AM every Sunday
   jobs:
     verify:
       runs-on: ubuntu-latest
       steps:
         - name: Verify Document Integrity
           run: curl -X GET ${{ secrets.APP_URL }}/api/cron/verify-integrity \
                -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
   ```

**Benefits**:

- ✅ Proactive detection of data corruption
- ✅ Audit evidence for SOC2 compliance
- ✅ Demonstrates ongoing monitoring
- ✅ Early warning system for storage issues
- ✅ Low cost (only verifies sample, not all files)

**Cost Estimate**:

- 10% of 1000 documents = 100 documents
- Average 5MB per document = 500MB download/week
- Supabase Storage: ~$0.09/GB = ~$0.045/week
- Negligible compute cost

**Acceptance Criteria**:

- [ ] Cron job runs weekly without manual intervention
- [ ] Verifies configurable percentage of documents
- [ ] All verifications logged to audit trail
- [ ] Alert sent if any integrity checks fail
- [ ] Admin can view verification history
- [ ] Documentation updated with verification schedule

---

## Future Enhancements

### 2. Right to Erasure (GDPR/Privacy) ✅

**Status**: Completed  
**Priority**: High  
**Effort**: 4-6 hours  
**SOC2 Requirement**: Privacy Controls

**Description**:
Implement "delete my account and all data" functionality to comply with GDPR right to erasure and SOC2 privacy requirements.

**Tasks**:

- [x] Create `deleteUserAccount()` server action
- [x] Delete all user documents from Supabase Storage
- [x] Delete all user data from database (cascade)
- [x] Retain audit logs per retention policy (7 years)
- [x] Add confirmation UI with warning
- [x] Add password verification for security
- [x] Update SOC2 documentation

**Future Enhancements**:

- [ ] Send confirmation email
- [ ] Add cooling-off period (soft delete)
- [ ] Data export before deletion

---

### 3. Document Version Control

**Status**: Not Started  
**Priority**: Medium  
**Effort**: 8-12 hours  
**SOC2 Requirement**: Processing Integrity Controls

**Description**:
Track document versions when files are updated, allowing rollback and audit trail of changes.

**Tasks**:

- [ ] Add `documentVersions` table
- [ ] Store previous versions in separate storage path
- [ ] Track version history with checksums
- [ ] Add UI to view version history
- [ ] Add ability to restore previous version
- [ ] Update audit logging for version operations

---

### 4. Automated Log Analysis & Alerting

**Status**: Not Started  
**Priority**: Medium  
**Effort**: 6-8 hours  
**SOC2 Requirement**: Security Controls - Log Monitoring

**Description**:
Implement automated analysis of audit logs to detect suspicious activity patterns.

**Tasks**:

- [ ] Define suspicious activity patterns
- [ ] Create log analysis queries
- [ ] Set up alerting system (email/Slack)
- [ ] Dashboard for security events
- [ ] Document incident response procedures

---

### 5. Document Classification Labels UI

**Status**: Not Started  
**Priority**: Low  
**Effort**: 2-3 hours  
**SOC2 Requirement**: Confidentiality Controls

**Description**:
Add UI to label documents with sensitivity levels (public, internal, confidential, restricted).

**Tasks**:

- [ ] Add classification dropdown to upload form
- [ ] Display classification badge on documents
- [ ] Filter documents by classification
- [ ] Update audit logs to track classification changes
- [ ] Apply appropriate security controls based on classification

---

## Completed Items

### ✅ Data Integrity Verification

- [x] SHA-256 checksum calculation on upload
- [x] Store checksums in database
- [x] `verifyDocumentIntegrity()` function
- [x] Audit logging for integrity checks
- [x] Documentation

---

**Document Version**: 1.0  
**Last Updated**: December 7, 2024  
**Next Review Date**: January 7, 2025  
**Owner**: Engineering Team
