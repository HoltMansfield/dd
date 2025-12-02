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

/**
 * Quick smoke test to verify RBAC system is working
 * This test covers the happy path: share, access, revoke
 */

let testUsers: Record<keyof typeof RBAC_TEST_USERS, TestUser>;
let testDocumentId: string;

test.describe("RBAC - Smoke Test", () => {
  test.beforeAll(async () => {
    testUsers = await setupRBACTestUsers();
    console.log("[Smoke Test] Test users ready");
  });

  test("complete RBAC workflow: share → access → revoke", async () => {
    // 1. Create document
    testDocumentId = await createTestDocument(
      testUsers.owner.id,
      "smoke-test.txt"
    );
    console.log("[Smoke Test] Document created:", testDocumentId);

    // 2. Verify owner has access
    const { canAccessDocument } = await import("../../src/lib/rbac");
    const ownerHasAccess = await canAccessDocument(
      testUsers.owner.id,
      testDocumentId,
      "owner"
    );
    expect(ownerHasAccess).toBe(true);
    console.log("[Smoke Test] ✓ Owner has access");

    // 3. Share with viewer
    await shareDocumentViaAPI(
      testDocumentId,
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );
    console.log("[Smoke Test] ✓ Document shared with viewer");

    // 4. Verify viewer has access
    const viewerHasAccess = await canAccessDocument(
      testUsers.viewer.id,
      testDocumentId,
      "viewer"
    );
    expect(viewerHasAccess).toBe(true);
    console.log("[Smoke Test] ✓ Viewer can access");

    // 5. Verify viewer cannot delete
    const viewerCanDelete = await canAccessDocument(
      testUsers.viewer.id,
      testDocumentId,
      "owner"
    );
    expect(viewerCanDelete).toBe(false);
    console.log("[Smoke Test] ✓ Viewer cannot delete");

    // 6. Verify unauthorized user has no access
    const unauthorizedHasAccess = await canAccessDocument(
      testUsers.unauthorized.id,
      testDocumentId,
      "viewer"
    );
    expect(unauthorizedHasAccess).toBe(false);
    console.log("[Smoke Test] ✓ Unauthorized user blocked");

    // 7. Revoke viewer access
    const { revokeAccess } = await import("../../src/lib/rbac");
    const revokeResult = await revokeAccess({
      documentId: testDocumentId,
      ownerId: testUsers.owner.id,
      revokeUserId: testUsers.viewer.id,
    });
    expect(revokeResult.success).toBe(true);
    console.log("[Smoke Test] ✓ Access revoked");

    // 8. Verify viewer no longer has access
    const viewerHasAccessAfterRevoke = await canAccessDocument(
      testUsers.viewer.id,
      testDocumentId,
      "viewer"
    );
    expect(viewerHasAccessAfterRevoke).toBe(false);
    console.log("[Smoke Test] ✓ Viewer access removed");

    // 9. Verify audit logs were created
    const { db } = await import("../../src/db/connect");
    const { auditLogs } = await import("../../src/db/schema");
    const { eq } = await import("drizzle-orm");

    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.documentId, testDocumentId));

    const shareLog = logs.find((log) => log.action === "share");
    const revokeLog = logs.find((log) => log.action === "revoke");

    // Verify share log
    expect(shareLog).toBeDefined();
    expect(shareLog!.success).toBe(1);
    expect(shareLog!.userId).toBe(testUsers.owner.id);
    expect(shareLog!.action).toBe("share");

    const shareMetadata = JSON.parse(shareLog!.metadata!);
    expect(shareMetadata.sharedWith).toBe(testUsers.viewer.id);
    expect(shareMetadata.permission).toBe("viewer");

    // Verify revoke log
    expect(revokeLog).toBeDefined();
    expect(revokeLog!.success).toBe(1);
    expect(revokeLog!.userId).toBe(testUsers.owner.id);
    expect(revokeLog!.action).toBe("revoke");

    const revokeMetadata = JSON.parse(revokeLog!.metadata!);
    expect(revokeMetadata.revokedFrom).toBe(testUsers.viewer.id);
    expect(revokeMetadata.previousPermission).toBe("viewer");

    console.log("[Smoke Test] ✓ Audit logs created");

    // 10. Cleanup
    await cleanupTestDocuments(testUsers.owner.id);
    console.log("[Smoke Test] ✓ Cleanup complete");

    console.log("\n✅ RBAC Smoke Test PASSED - All systems operational!");
  });
});
