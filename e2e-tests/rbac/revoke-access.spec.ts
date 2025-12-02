import { test, expect } from "@playwright/test";
import {
  setupRBACTestUsers,
  RBAC_TEST_USERS,
  TestUser,
} from "../fixtures/rbac-users";
import {
  createTestDocument,
  shareDocumentViaAPI,
  cleanupTestDocuments,
} from "../fixtures/rbac-helpers";

let testUsers: Record<keyof typeof RBAC_TEST_USERS, TestUser>;
let testDocumentId: string;

test.describe("RBAC - Revoke Access", () => {
  test.beforeAll(async () => {
    testUsers = await setupRBACTestUsers();
  });

  test.beforeEach(async () => {
    testDocumentId = await createTestDocument(
      testUsers.owner.id,
      "revoke-test-doc.txt"
    );
  });

  test.afterEach(async () => {
    await cleanupTestDocuments(testUsers.owner.id);
  });

  test("owner can revoke viewer access", async () => {
    // Share with viewer
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );

    // Verify viewer has access
    const { canAccessDocument } = await import("../../src/lib/rbac");
    const hasAccessBefore = await canAccessDocument(
      testUsers.viewer.id,
      testDocumentId,
      "viewer"
    );
    expect(hasAccessBefore).toBe(true);

    // Revoke access
    const { revokeAccess } = await import("../../src/lib/rbac");
    const result = await revokeAccess({
      documentId: testDocumentId,
      ownerId: testUsers.owner.id,
      revokeUserId: testUsers.viewer.id,
    });

    expect(result.success).toBe(true);

    // Verify viewer no longer has access
    const hasAccessAfter = await canAccessDocument(
      testUsers.viewer.id,
      testDocumentId,
      "viewer"
    );
    expect(hasAccessAfter).toBe(false);
  });

  test("owner can revoke editor access", async () => {
    // Share with editor
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.editor.id,
      "editor"
    );

    // Revoke access
    const { revokeAccess } = await import("../../src/lib/rbac");
    const result = await revokeAccess({
      documentId: testDocumentId,
      ownerId: testUsers.owner.id,
      revokeUserId: testUsers.editor.id,
    });

    expect(result.success).toBe(true);

    // Verify editor no longer has access
    const { canAccessDocument } = await import("../../src/lib/rbac");
    const hasAccess = await canAccessDocument(
      testUsers.editor.id,
      testDocumentId,
      "editor"
    );
    expect(hasAccess).toBe(false);
  });

  test("non-owner cannot revoke access", async () => {
    // Share with viewer and editor
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.editor.id,
      "editor"
    );

    // Try to revoke as editor (should fail)
    const { revokeAccess } = await import("../../src/lib/rbac");
    const result = await revokeAccess({
      documentId: testDocumentId,
      ownerId: testUsers.editor.id, // Editor trying to revoke
      revokeUserId: testUsers.viewer.id,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("owner");

    // Verify viewer still has access
    const { canAccessDocument } = await import("../../src/lib/rbac");
    const hasAccess = await canAccessDocument(
      testUsers.viewer.id,
      testDocumentId,
      "viewer"
    );
    expect(hasAccess).toBe(true);
  });

  test("revoking non-existent permission returns error", async () => {
    const { revokeAccess } = await import("../../src/lib/rbac");

    // Try to revoke permission that doesn't exist
    const result = await revokeAccess({
      documentId: testDocumentId,
      ownerId: testUsers.owner.id,
      revokeUserId: testUsers.viewer.id, // Never had access
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  test("revoke creates audit log entry", async () => {
    // Share with viewer
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );

    // Revoke access
    const { revokeAccess } = await import("../../src/lib/rbac");
    await revokeAccess({
      documentId: testDocumentId,
      ownerId: testUsers.owner.id,
      revokeUserId: testUsers.viewer.id,
    });

    // Check audit log
    const { db } = await import("../../src/db/connect");
    const { auditLogs } = await import("../../src/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const [auditLog] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.documentId, testDocumentId),
          eq(auditLogs.action, "revoke"),
          eq(auditLogs.userId, testUsers.owner.id)
        )
      )
      .limit(1);

    expect(auditLog).toBeDefined();
    expect(auditLog.success).toBe(1);
    expect(auditLog.action).toBe("revoke");
    expect(auditLog.userId).toBe(testUsers.owner.id);
    expect(auditLog.documentId).toBe(testDocumentId);
    expect(auditLog.metadata).toBeTruthy();

    // Verify metadata contains revocation details
    const metadata = JSON.parse(auditLog.metadata!);
    expect(metadata.revokedFrom).toBe(testUsers.viewer.id);
    expect(metadata.previousPermission).toBe("viewer");
  });

  test("permission is deleted from database after revoke", async () => {
    // Share with viewer
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );

    // Verify permission exists
    const { db } = await import("../../src/db/connect");
    const { documentPermissions } = await import("../../src/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const [permissionBefore] = await db
      .select()
      .from(documentPermissions)
      .where(
        and(
          eq(documentPermissions.documentId, testDocumentId),
          eq(documentPermissions.userId, testUsers.viewer.id)
        )
      )
      .limit(1);

    expect(permissionBefore).toBeDefined();

    // Revoke access
    const { revokeAccess } = await import("../../src/lib/rbac");
    await revokeAccess({
      documentId: testDocumentId,
      ownerId: testUsers.owner.id,
      revokeUserId: testUsers.viewer.id,
    });

    // Verify permission is deleted
    const [permissionAfter] = await db
      .select()
      .from(documentPermissions)
      .where(
        and(
          eq(documentPermissions.documentId, testDocumentId),
          eq(documentPermissions.userId, testUsers.viewer.id)
        )
      )
      .limit(1);

    expect(permissionAfter).toBeUndefined();
  });
});
