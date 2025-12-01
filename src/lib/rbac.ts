"use server";

import { db } from "@/db/connect";
import {
  documents,
  documentPermissions,
  users,
  type PermissionLevel,
} from "@/db/schema";
import { eq, and, or, isNull, gt, desc } from "drizzle-orm";
import { createAuditLog } from "./audit";

/**
 * Check if a user has the required permission level for a document
 * Permission hierarchy: owner > editor > viewer
 */
export async function canAccessDocument(
  userId: string,
  documentId: string,
  requiredPermission: PermissionLevel = "viewer"
): Promise<boolean> {
  try {
    // Check if user is the document owner
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!document) {
      return false;
    }

    // Owner has all permissions
    if (document.userId === userId) {
      return true;
    }

    // Check shared permissions
    const [permission] = await db
      .select()
      .from(documentPermissions)
      .where(
        and(
          eq(documentPermissions.documentId, documentId),
          eq(documentPermissions.userId, userId),
          or(
            isNull(documentPermissions.expiresAt),
            gt(documentPermissions.expiresAt, new Date())
          )
        )
      )
      .limit(1);

    if (!permission) {
      return false;
    }

    // Permission hierarchy
    const permissionLevels: Record<PermissionLevel, number> = {
      owner: 3,
      editor: 2,
      viewer: 1,
    };

    return (
      permissionLevels[permission.permissionLevel as PermissionLevel] >=
      permissionLevels[requiredPermission]
    );
  } catch (error) {
    console.error("[RBAC] Error checking document access:", error);
    return false;
  }
}

/**
 * Get the user's permission level for a document
 * Returns 'owner', 'editor', 'viewer', or null if no access
 */
export async function getUserPermissionLevel(
  userId: string,
  documentId: string
): Promise<PermissionLevel | null> {
  try {
    // Check if user is the document owner
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!document) {
      return null;
    }

    if (document.userId === userId) {
      return "owner";
    }

    // Check shared permissions
    const [permission] = await db
      .select()
      .from(documentPermissions)
      .where(
        and(
          eq(documentPermissions.documentId, documentId),
          eq(documentPermissions.userId, userId),
          or(
            isNull(documentPermissions.expiresAt),
            gt(documentPermissions.expiresAt, new Date())
          )
        )
      )
      .limit(1);

    return permission ? (permission.permissionLevel as PermissionLevel) : null;
  } catch (error) {
    console.error("[RBAC] Error getting permission level:", error);
    return null;
  }
}

/**
 * Share a document with another user
 */
export async function shareDocument({
  documentId,
  ownerId,
  shareWithUserId,
  permissionLevel,
  expiresAt,
}: {
  documentId: string;
  ownerId: string;
  shareWithUserId: string;
  permissionLevel: "editor" | "viewer";
  expiresAt?: Date;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify owner has permission to share (must be owner)
    const canShare = await canAccessDocument(ownerId, documentId, "owner");
    if (!canShare) {
      await createAuditLog({
        userId: ownerId,
        action: "access_denied",
        documentId,
        success: false,
        errorMessage: "Only document owner can share",
        metadata: {
          attemptedAction: "share",
          targetUser: shareWithUserId,
        },
      });
      return { success: false, error: "Only document owner can share" };
    }

    // Don't allow sharing with self
    if (ownerId === shareWithUserId) {
      return { success: false, error: "Cannot share document with yourself" };
    }

    // Verify target user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, shareWithUserId))
      .limit(1);

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Create or update permission
    await db
      .insert(documentPermissions)
      .values({
        documentId,
        userId: shareWithUserId,
        permissionLevel,
        grantedBy: ownerId,
        expiresAt: expiresAt || null,
      })
      .onConflictDoUpdate({
        target: [documentPermissions.documentId, documentPermissions.userId],
        set: {
          permissionLevel,
          expiresAt: expiresAt || null,
          grantedAt: new Date(),
          grantedBy: ownerId,
        },
      });

    // Audit log
    await createAuditLog({
      userId: ownerId,
      action: "share",
      documentId,
      success: true,
      metadata: {
        sharedWith: shareWithUserId,
        sharedWithEmail: targetUser.email || "unknown",
        permission: permissionLevel,
        expiresAt: expiresAt?.toISOString() || "never",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[RBAC] Error sharing document:", error);
    return { success: false, error: "Failed to share document" };
  }
}

/**
 * Revoke a user's access to a document
 */
export async function revokeAccess({
  documentId,
  ownerId,
  revokeUserId,
}: {
  documentId: string;
  ownerId: string;
  revokeUserId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify owner has permission to revoke (must be owner)
    const canRevoke = await canAccessDocument(ownerId, documentId, "owner");
    if (!canRevoke) {
      await createAuditLog({
        userId: ownerId,
        action: "access_denied",
        documentId,
        success: false,
        errorMessage: "Only document owner can revoke access",
        metadata: {
          attemptedAction: "revoke",
          targetUser: revokeUserId,
        },
      });
      return { success: false, error: "Only document owner can revoke access" };
    }

    // Delete the permission
    const result = await db
      .delete(documentPermissions)
      .where(
        and(
          eq(documentPermissions.documentId, documentId),
          eq(documentPermissions.userId, revokeUserId)
        )
      )
      .returning();

    if (result.length === 0) {
      return { success: false, error: "Permission not found" };
    }

    // Audit log
    await createAuditLog({
      userId: ownerId,
      action: "revoke",
      documentId,
      success: true,
      metadata: {
        revokedFrom: revokeUserId,
        previousPermission: result[0].permissionLevel,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[RBAC] Error revoking access:", error);
    return { success: false, error: "Failed to revoke access" };
  }
}

/**
 * Get all users who have access to a document
 */
export async function getDocumentSharedWith(documentId: string) {
  try {
    const sharedWith = await db
      .select({
        id: documentPermissions.id,
        userId: documentPermissions.userId,
        userName: users.name,
        userEmail: users.email,
        permissionLevel: documentPermissions.permissionLevel,
        grantedAt: documentPermissions.grantedAt,
        expiresAt: documentPermissions.expiresAt,
      })
      .from(documentPermissions)
      .innerJoin(users, eq(documentPermissions.userId, users.id))
      .where(eq(documentPermissions.documentId, documentId))
      .orderBy(desc(documentPermissions.grantedAt));

    return sharedWith;
  } catch (error) {
    console.error("[RBAC] Error getting shared users:", error);
    return [];
  }
}

/**
 * Get all documents shared with a user
 */
export async function getDocumentsSharedWithUser(userId: string) {
  try {
    const sharedDocs = await db
      .select({
        document: documents,
        permission: documentPermissions,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(documentPermissions)
      .innerJoin(documents, eq(documentPermissions.documentId, documents.id))
      .innerJoin(users, eq(documents.userId, users.id))
      .where(
        and(
          eq(documentPermissions.userId, userId),
          or(
            isNull(documentPermissions.expiresAt),
            gt(documentPermissions.expiresAt, new Date())
          )
        )
      )
      .orderBy(desc(documentPermissions.grantedAt));

    return sharedDocs;
  } catch (error) {
    console.error("[RBAC] Error getting shared documents:", error);
    return [];
  }
}

/**
 * Get all documents owned by a user
 */
export async function getDocumentsOwnedByUser(userId: string) {
  try {
    const ownedDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.uploadedAt));

    return ownedDocs;
  } catch (error) {
    console.error("[RBAC] Error getting owned documents:", error);
    return [];
  }
}

/**
 * Get all accessible documents for a user (owned + shared)
 */
export async function getAllAccessibleDocuments(userId: string) {
  try {
    const [owned, shared] = await Promise.all([
      getDocumentsOwnedByUser(userId),
      getDocumentsSharedWithUser(userId),
    ]);

    return {
      owned,
      shared: shared.map((s) => ({
        ...s.document,
        permissionLevel: s.permission.permissionLevel,
        sharedBy: s.ownerName || s.ownerEmail || "Unknown",
      })),
    };
  } catch (error) {
    console.error("[RBAC] Error getting accessible documents:", error);
    return { owned: [], shared: [] };
  }
}

/**
 * Check if a user can perform a specific action on a document
 */
export async function canPerformAction(
  userId: string,
  documentId: string,
  action: "view" | "download" | "edit" | "delete" | "share"
): Promise<boolean> {
  const permissionLevel = await getUserPermissionLevel(userId, documentId);

  if (!permissionLevel) {
    // Log access denied
    await createAuditLog({
      userId,
      action: "access_denied",
      documentId,
      success: false,
      errorMessage: `No permission to ${action}`,
      metadata: { attemptedAction: action },
    });
    return false;
  }

  // Define required permissions for each action
  const actionPermissions: Record<string, PermissionLevel[]> = {
    view: ["owner", "editor", "viewer"],
    download: ["owner", "editor", "viewer"],
    edit: ["owner", "editor"],
    delete: ["owner"],
    share: ["owner"],
  };

  const allowed = actionPermissions[action]?.includes(permissionLevel) || false;

  if (!allowed) {
    await createAuditLog({
      userId,
      action: "access_denied",
      documentId,
      success: false,
      errorMessage: `Insufficient permission to ${action}`,
      metadata: {
        attemptedAction: action,
        currentPermission: permissionLevel,
      },
    });
  }

  return allowed;
}
