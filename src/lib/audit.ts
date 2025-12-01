"use server";

import { db } from "@/db/connect";
import { auditLogs, auditLogArchives, type AuditAction } from "@/db/schema";
import { eq, desc, lt, sql } from "drizzle-orm";
import crypto from "crypto";

// Conditionally import headers only in Next.js environment
let headers: (() => Promise<Headers>) | null = null;
try {
  // @ts-ignore - Dynamic import for Next.js headers
  headers = require("next/headers").headers;
} catch (error) {
  // Running in test environment without Next.js
  headers = null;
}

type AuditLogParams = {
  userId: string;
  action: AuditAction;
  documentId?: string;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, string | number | boolean>;
};

/**
 * Create an audit log entry for SOC2 compliance
 * Tracks all file operations with user, timestamp, IP, and user agent
 */
export async function createAuditLog({
  userId,
  action,
  documentId,
  success = true,
  errorMessage,
  metadata,
}: AuditLogParams): Promise<void> {
  try {
    // Get request headers for IP and user agent
    // In test environments, headers() may not be available
    let ipAddress = "unknown";
    let userAgent = "unknown";

    if (headers) {
      try {
        const headersList = await headers();
        ipAddress =
          headersList.get("x-forwarded-for") ||
          headersList.get("x-real-ip") ||
          "unknown";
        userAgent = headersList.get("user-agent") || "unknown";
      } catch (error) {
        // Headers call failed
        ipAddress = "unknown";
        userAgent = "unknown";
      }
    } else {
      // Running in test environment without Next.js
      ipAddress = "test-environment";
      userAgent = "test-agent";
    }

    // Insert audit log
    await db.insert(auditLogs).values({
      userId,
      documentId: documentId || null,
      action,
      success: success ? 1 : 0,
      errorMessage: errorMessage || null,
      ipAddress,
      userAgent,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    console.log(
      `[Audit] ${action.toUpperCase()} by user ${userId} - ${success ? "SUCCESS" : "FAILED"}`
    );
  } catch (error) {
    // Don't throw - audit logging failures shouldn't break the app
    console.error("[Audit] Failed to create audit log:", error);
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(userId: string, limit = 100) {
  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
}

/**
 * Get audit logs for a specific document
 */
export async function getDocumentAuditLogs(documentId: string, limit = 100) {
  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.documentId, documentId))
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
}

/**
 * Get all audit logs (admin only)
 */
export async function getAllAuditLogs(limit = 1000) {
  return await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
}

/**
 * Get audit logs older than specified days
 * Used for archival process
 */
export async function getOldAuditLogs(daysOld = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await db
    .select()
    .from(auditLogs)
    .where(lt(auditLogs.timestamp, cutoffDate))
    .orderBy(auditLogs.timestamp);
}

/**
 * Archive old audit logs to the auditLogArchives table
 * Moves logs older than specified days to compressed JSON storage
 * Returns the archive record or null if no logs to archive
 */
export async function archiveOldAuditLogs(daysOld = 365) {
  // Get unarchived logs older than specified days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const logs = await db
    .select()
    .from(auditLogs)
    .where(
      sql`${auditLogs.timestamp} < ${cutoffDate} AND ${auditLogs.archived} = 0`
    )
    .orderBy(auditLogs.timestamp);

  if (logs.length === 0) {
    return null;
  }

  const startDate = logs[0].timestamp!;
  const endDate = logs[logs.length - 1].timestamp!;

  // Prepare logs for JSON storage
  const logsData = logs.map((log) => ({
    id: log.id,
    userId: log.userId,
    documentId: log.documentId,
    action: log.action,
    timestamp: log.timestamp?.toISOString(),
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    metadata: log.metadata,
    success: log.success === 1,
    errorMessage: log.errorMessage,
  }));

  const logsJson = JSON.stringify(logsData);

  // Generate checksum for integrity verification
  const checksum = crypto.createHash("sha256").update(logsJson).digest("hex");

  // Insert archive record
  const [archive] = await db
    .insert(auditLogArchives)
    .values({
      startDate,
      endDate,
      recordCount: logs.length,
      logsJson,
      checksum,
    })
    .returning();

  // Mark logs as archived
  const logIds = logs.map((log) => log.id);
  await db
    .update(auditLogs)
    .set({ archived: 1 })
    .where(sql`${auditLogs.id} = ANY(${logIds})`);

  console.log(
    `[Audit Archive] Archived ${logs.length} logs from ${startDate.toISOString()} to ${endDate.toISOString()}`
  );

  return archive;
}

/**
 * Get all archive records
 */
export async function getAuditLogArchives(limit = 100) {
  return await db
    .select()
    .from(auditLogArchives)
    .orderBy(desc(auditLogArchives.archiveDate))
    .limit(limit);
}

/**
 * Get a specific archive and parse its logs
 */
export async function getArchiveById(archiveId: string) {
  const [archive] = await db
    .select()
    .from(auditLogArchives)
    .where(eq(auditLogArchives.id, archiveId))
    .limit(1);

  if (!archive) {
    return null;
  }

  // Verify checksum
  const calculatedChecksum = crypto
    .createHash("sha256")
    .update(archive.logsJson)
    .digest("hex");

  if (calculatedChecksum !== archive.checksum) {
    console.error(
      `[Audit Archive] Checksum mismatch for archive ${archiveId}! Data may be corrupted.`
    );
    throw new Error("Archive integrity check failed");
  }

  // Parse and return logs
  const logs = JSON.parse(archive.logsJson);

  return {
    ...archive,
    logs,
    verified: true,
  };
}

/**
 * Get audit log statistics
 * Useful for monitoring and compliance reporting
 */
export async function getAuditLogStats() {
  const totalLogs = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLogs);

  const actionCounts = await db
    .select({
      action: auditLogs.action,
      count: sql<number>`count(*)`,
    })
    .from(auditLogs)
    .groupBy(auditLogs.action);

  const failedActions = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLogs)
    .where(eq(auditLogs.success, 0));

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 365);

  const oldLogs = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLogs)
    .where(lt(auditLogs.timestamp, cutoffDate));

  return {
    total: totalLogs[0]?.count || 0,
    byAction: actionCounts.reduce(
      (acc, { action, count }) => {
        acc[action] = count;
        return acc;
      },
      {} as Record<string, number>
    ),
    failed: failedActions[0]?.count || 0,
    olderThanOneYear: oldLogs[0]?.count || 0,
  };
}
