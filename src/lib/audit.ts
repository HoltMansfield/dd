"use server";

import { db } from "@/db/connect";
import { auditLogs, type AuditAction } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";

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
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

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
