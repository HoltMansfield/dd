#!/usr/bin/env tsx

/**
 * Audit Log Archival Script
 *
 * This script archives audit logs older than 1 year to the auditLogArchives table.
 * Logs are compressed into JSON format and stored in the database with checksums.
 * Run this monthly as a cron job.
 *
 * Usage:
 *   npm run archive:audit-logs
 *   # or
 *   npx tsx scripts/archive-audit-logs.ts
 *
 * Or add to crontab:
 *   0 0 1 * * cd /path/to/app && npm run archive:audit-logs
 */

// Polyfill WebSocket for Neon serverless driver
import ws from "ws";
if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws as any;
}

import { archiveOldAuditLogs, getAuditLogStats } from "../src/lib/audit";

const DAYS_OLD = 365; // Archive logs older than 1 year

async function main() {
  console.log("🗄️  Starting audit log archival process...\n");

  // Get current stats
  console.log("📊 Current audit log statistics:");
  const stats = await getAuditLogStats();
  console.log(`   Total logs: ${stats.total}`);
  console.log(`   Failed actions: ${stats.failed}`);
  console.log(`   Logs older than 1 year: ${stats.olderThanOneYear}\n`);

  if (stats.olderThanOneYear === 0) {
    console.log("✅ No logs to archive. All logs are less than 1 year old.");
    return;
  }

  // Archive logs to database
  console.log(
    `📦 Archiving ${stats.olderThanOneYear} logs older than ${DAYS_OLD} days...\n`
  );
  const archive = await archiveOldAuditLogs(DAYS_OLD);

  if (!archive) {
    console.log("✅ No logs to archive.");
    return;
  }

  const startDate = archive.startDate.toISOString().split("T")[0];
  const endDate = archive.endDate.toISOString().split("T")[0];

  console.log(`✅ Archive created successfully!`);
  console.log(`   Archive ID: ${archive.id}`);
  console.log(`   Records: ${archive.recordCount}`);
  console.log(`   Date range: ${startDate} to ${endDate}`);
  console.log(`   Checksum: ${archive.checksum?.substring(0, 16)}...`);
  console.log(`   Archive date: ${archive.archiveDate.toISOString()}\n`);

  // Next steps
  console.log("📝 What happened:");
  console.log(
    `   ✅ ${archive.recordCount} logs moved to auditLogArchives table`
  );
  console.log(`   ✅ Original logs marked as archived (archived=1)`);
  console.log(`   ✅ Logs stored as compressed JSON with SHA-256 checksum`);
  console.log(`   ✅ All data remains in database (no external files)\n`);

  console.log("💡 Benefits:");
  console.log(
    "   - Faster queries on recent logs (archived logs excluded by default)"
  );
  console.log("   - Reduced index size for active audit logs");
  console.log("   - All data still accessible via SQL queries");
  console.log("   - Integrity verification via checksum\n");

  console.log("✅ Archival process complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error during archival:", error);
    process.exit(1);
  });
