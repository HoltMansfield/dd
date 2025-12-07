"use server";

import { db } from "@/db/connect";
import { users, documents } from "@/db/schema";
import { getCurrentUserId } from "./auth";
import { createAuditLog } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { withSentryError } from "@/sentry-error";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_TIMESTAMP_COOKIE,
  SESSION_CREATED_COOKIE,
} from "@/lib/session-config";

/**
 * Delete user account and all associated data (Right to Erasure / GDPR compliance)
 *
 * This function:
 * 1. Verifies the user's password for security
 * 2. Deletes all documents from Supabase Storage
 * 3. Deletes user record from database (cascades to sessions, documents, permissions)
 * 4. Retains audit logs per 7-year retention policy (for compliance)
 * 5. Logs out the user and redirects to home page
 *
 * @param password - User's password for verification
 * @returns Success/error result
 */
async function _deleteUserAccount(
  password: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  try {
    // Get user record
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify password for security
    if (!user.passwordHash) {
      return { success: false, error: "Cannot verify password" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await createAuditLog({
        userId,
        action: "account_deletion_failed",
        success: false,
        errorMessage: "Invalid password",
      });

      return { success: false, error: "Invalid password" };
    }

    // Get all user documents for deletion from storage
    const userDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId));

    console.log(
      `[deleteUserAccount] Found ${userDocuments.length} documents to delete`
    );

    // Delete all documents from Supabase Storage
    const storageErrors: string[] = [];
    for (const doc of userDocuments) {
      try {
        const { error } = await supabaseAdmin.storage
          .from(doc.bucketName)
          .remove([doc.storagePath]);

        if (error) {
          console.error(
            `[deleteUserAccount] Failed to delete ${doc.storagePath}:`,
            error
          );
          storageErrors.push(`${doc.fileName}: ${error.message}`);
        } else {
          console.log(`[deleteUserAccount] Deleted ${doc.storagePath}`);
        }
      } catch (error) {
        console.error(
          `[deleteUserAccount] Exception deleting ${doc.storagePath}:`,
          error
        );
        storageErrors.push(
          `${doc.fileName}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Log storage deletion results
    if (storageErrors.length > 0) {
      console.warn(
        `[deleteUserAccount] ${storageErrors.length} storage deletion errors:`,
        storageErrors
      );
    }

    // Create audit log BEFORE deleting user (so userId still exists)
    // Note: Audit logs are NOT deleted (retained for 7 years per compliance policy)
    await createAuditLog({
      userId,
      action: "account_deleted",
      success: true,
      metadata: {
        ...(user.email && { email: user.email }),
        documentsDeleted: userDocuments.length,
        ...(storageErrors.length > 0 && {
          storageErrorCount: storageErrors.length,
        }),
      },
    });

    // Delete user from database
    // This cascades to: sessions, documents, documentPermissions
    // Audit logs are NOT cascaded (retained for compliance)
    await db.delete(users).where(eq(users.id, userId));

    console.log(`[deleteUserAccount] User ${userId} deleted successfully`);

    // Clear session cookies
    const cookieStore = await cookies();
    cookieStore.delete("session_user");
    cookieStore.delete(SESSION_TIMESTAMP_COOKIE);
    cookieStore.delete(SESSION_CREATED_COOKIE);

    // Redirect to home page
    redirect("/");
  } catch (error) {
    console.error("[deleteUserAccount] Error:", error);

    // Try to log the error (user might still exist)
    try {
      await createAuditLog({
        userId,
        action: "account_deletion_failed",
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    } catch (auditError) {
      console.error(
        "[deleteUserAccount] Failed to create audit log:",
        auditError
      );
      // Log to Sentry - audit logging failure could indicate database issues
      if (process.env.NEXT_PUBLIC_APP_ENV !== "E2E") {
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(auditError, {
          tags: {
            context: "account_deletion_audit_log_failure",
          },
          extra: {
            userId,
            originalError:
              error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    // Re-throw to let withSentryError wrapper handle Sentry logging
    throw error;
  }
}

export const deleteUserAccount = withSentryError(_deleteUserAccount);
