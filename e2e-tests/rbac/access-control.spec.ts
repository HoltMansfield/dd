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

test.describe("RBAC - Access Control", () => {
  test.beforeAll(async () => {
    testUsers = await setupRBACTestUsers();
  });

  test.beforeEach(async () => {
    testDocumentId = await createTestDocument(
      testUsers.owner.id,
      "access-test-doc.txt"
    );
  });

  test.afterEach(async () => {
    await cleanupTestDocuments(testUsers.owner.id);
  });

  test("owner has full access to document", async () => {
    const { canAccessDocument } = await import("../../src/lib/rbac");

    const canView = await canAccessDocument(
      testUsers.owner.id,
      testDocumentId,
      "viewer"
    );
    const canEdit = await canAccessDocument(
      testUsers.owner.id,
      testDocumentId,
      "editor"
    );
    const isOwner = await canAccessDocument(
      testUsers.owner.id,
      testDocumentId,
      "owner"
    );

    expect(canView).toBe(true);
    expect(canEdit).toBe(true);
    expect(isOwner).toBe(true);
  });

  test("viewer can view but not edit or delete", async () => {
    // Share with viewer
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );

    const { canAccessDocument } = await import("../../src/lib/rbac");

    const canView = await canAccessDocument(
      testUsers.viewer.id,
      testDocumentId,
      "viewer"
    );
    const canEdit = await canAccessDocument(
      testUsers.viewer.id,
      testDocumentId,
      "editor"
    );
    const isOwner = await canAccessDocument(
      testUsers.viewer.id,
      testDocumentId,
      "owner"
    );

    expect(canView).toBe(true);
    expect(canEdit).toBe(false);
    expect(isOwner).toBe(false);
  });

  test("editor can view and edit but not delete", async () => {
    // Share with editor
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.editor.id,
      "editor"
    );

    const { canAccessDocument } = await import("../../src/lib/rbac");

    const canView = await canAccessDocument(
      testUsers.editor.id,
      testDocumentId,
      "viewer"
    );
    const canEdit = await canAccessDocument(
      testUsers.editor.id,
      testDocumentId,
      "editor"
    );
    const isOwner = await canAccessDocument(
      testUsers.editor.id,
      testDocumentId,
      "owner"
    );

    expect(canView).toBe(true);
    expect(canEdit).toBe(true);
    expect(isOwner).toBe(false);
  });

  test("unauthorized user has no access", async () => {
    const { canAccessDocument } = await import("../../src/lib/rbac");

    const canView = await canAccessDocument(
      testUsers.unauthorized.id,
      testDocumentId,
      "viewer"
    );

    expect(canView).toBe(false);
  });

  test("getUserPermissionLevel returns correct level", async () => {
    // Share with different permission levels
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

    const { getUserPermissionLevel } = await import("../../src/lib/rbac");

    const ownerLevel = await getUserPermissionLevel(
      testUsers.owner.id,
      testDocumentId
    );
    const editorLevel = await getUserPermissionLevel(
      testUsers.editor.id,
      testDocumentId
    );
    const viewerLevel = await getUserPermissionLevel(
      testUsers.viewer.id,
      testDocumentId
    );
    const unauthorizedLevel = await getUserPermissionLevel(
      testUsers.unauthorized.id,
      testDocumentId
    );

    expect(ownerLevel).toBe("owner");
    expect(editorLevel).toBe("editor");
    expect(viewerLevel).toBe("viewer");
    expect(unauthorizedLevel).toBe(null);
  });

  test("canPerformAction enforces correct permissions", async () => {
    // Share with viewer
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );

    const { canPerformAction } = await import("../../src/lib/rbac");

    // Viewer can view and download
    const canView = await canPerformAction(
      testUsers.viewer.id,
      testDocumentId,
      "view"
    );
    const canDownload = await canPerformAction(
      testUsers.viewer.id,
      testDocumentId,
      "download"
    );

    // Viewer cannot edit, delete, or share
    const canEdit = await canPerformAction(
      testUsers.viewer.id,
      testDocumentId,
      "edit"
    );
    const canDelete = await canPerformAction(
      testUsers.viewer.id,
      testDocumentId,
      "delete"
    );
    const canShare = await canPerformAction(
      testUsers.viewer.id,
      testDocumentId,
      "share"
    );

    expect(canView).toBe(true);
    expect(canDownload).toBe(true);
    expect(canEdit).toBe(false);
    expect(canDelete).toBe(false);
    expect(canShare).toBe(false);
  });

  test("access denied is logged in audit trail", async () => {
    const { canPerformAction } = await import("../../src/lib/rbac");

    // Try to access document without permission
    await canPerformAction(testUsers.unauthorized.id, testDocumentId, "view");

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
          eq(auditLogs.action, "access_denied"),
          eq(auditLogs.userId, testUsers.unauthorized.id)
        )
      )
      .limit(1);

    expect(auditLog).toBeDefined();
    expect(auditLog.success).toBe(0);
  });
});
