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

test.describe("RBAC - Document Sharing", () => {
  test.beforeAll(async () => {
    // Setup test users
    testUsers = await setupRBACTestUsers();
    console.log("[RBAC Test] Test users created:", Object.keys(testUsers));
  });

  test.beforeEach(async () => {
    // Create a test document owned by the owner user
    testDocumentId = await createTestDocument(
      testUsers.owner.id,
      "shared-test-doc.txt"
    );
    console.log("[RBAC Test] Created test document:", testDocumentId);
  });

  test.afterEach(async () => {
    // Clean up test documents
    await cleanupTestDocuments(testUsers.owner.id);
  });

  test("owner can share document with viewer permission", async () => {
    // Share document with viewer
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );

    // Small delay to ensure database write is committed
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify permission was created
    const { db } = await import("../../src/db/connect");
    const { documentPermissions } = await import("../../src/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const [permission] = await db
      .select()
      .from(documentPermissions)
      .where(
        and(
          eq(documentPermissions.documentId, testDocumentId),
          eq(documentPermissions.userId, testUsers.viewer.id)
        )
      )
      .limit(1);

    expect(permission).toBeDefined();
    expect(permission.permissionLevel).toBe("viewer");
    expect(permission.grantedBy).toBe(testUsers.owner.id);
  });

  test("owner can share document with editor permission", async () => {
    // Share document with editor
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.editor.id,
      "editor"
    );

    // Verify permission was created with retry logic
    const { db } = await import("../../src/db/connect");
    const { documentPermissions } = await import("../../src/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Retry up to 5 times with 200ms delay between attempts
    let permission;
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));

      [permission] = await db
        .select()
        .from(documentPermissions)
        .where(
          and(
            eq(documentPermissions.documentId, testDocumentId),
            eq(documentPermissions.userId, testUsers.editor.id)
          )
        )
        .limit(1);

      if (permission) break;
    }

    expect(permission).toBeDefined();
    expect(permission.permissionLevel).toBe("editor");
  });

  test("non-owner cannot share document", async () => {
    // First share document with viewer
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );

    // Try to share as viewer (should fail)
    const { shareDocument } = await import("../../src/lib/rbac");

    const result = await shareDocument({
      documentId: testDocumentId,
      ownerId: testUsers.viewer.id, // Viewer trying to share
      shareWithUserId: testUsers.editor.id,
      permissionLevel: "viewer",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("owner");
  });

  test("cannot share document with self", async () => {
    const { shareDocument } = await import("../../src/lib/rbac");

    const result = await shareDocument({
      documentId: testDocumentId,
      ownerId: testUsers.owner.id,
      shareWithUserId: testUsers.owner.id, // Sharing with self
      permissionLevel: "viewer",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("yourself");
  });

  test("sharing creates audit log entry", async () => {
    // Share document
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );

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
          eq(auditLogs.action, "share"),
          eq(auditLogs.userId, testUsers.owner.id)
        )
      )
      .limit(1);

    expect(auditLog).toBeDefined();
    expect(auditLog.success).toBe(1);
    expect(auditLog.action).toBe("share");
    expect(auditLog.userId).toBe(testUsers.owner.id);
    expect(auditLog.documentId).toBe(testDocumentId);
    expect(auditLog.metadata).toBeTruthy();

    // Verify metadata contains sharing details
    const metadata = JSON.parse(auditLog.metadata!);
    expect(metadata.sharedWith).toBe(testUsers.viewer.id);
    expect(metadata.sharedWithEmail).toBe(testUsers.viewer.email);
    expect(metadata.permission).toBe("viewer");
  });

  test("can update existing permission level", async () => {
    // Share as viewer first
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );

    // Update to editor
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.viewer.id,
      "editor"
    );

    // Verify permission was updated
    const { db } = await import("../../src/db/connect");
    const { documentPermissions } = await import("../../src/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const [permission] = await db
      .select()
      .from(documentPermissions)
      .where(
        and(
          eq(documentPermissions.documentId, testDocumentId),
          eq(documentPermissions.userId, testUsers.viewer.id)
        )
      )
      .limit(1);

    expect(permission.permissionLevel).toBe("editor");
  });
});
