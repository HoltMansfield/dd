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
let testDocumentIds: string[] = [];

test.describe("RBAC - Document Queries", () => {
  test.beforeAll(async () => {
    testUsers = await setupRBACTestUsers();
  });

  test.beforeEach(async () => {
    // Create multiple test documents
    const doc1 = await createTestDocument(testUsers.owner.id, "doc1.txt");
    const doc2 = await createTestDocument(testUsers.owner.id, "doc2.txt");
    const doc3 = await createTestDocument(testUsers.owner.id, "doc3.txt");
    testDocumentIds = [doc1, doc2, doc3];
  });

  test.afterEach(async () => {
    await cleanupTestDocuments(testUsers.owner.id);
    testDocumentIds = [];
  });

  test("getDocumentsOwnedByUser returns only owned documents", async () => {
    const { getDocumentsOwnedByUser } = await import("../../src/lib/rbac");

    const ownedDocs = await getDocumentsOwnedByUser(testUsers.owner.id);

    expect(ownedDocs.length).toBe(3);
    expect(ownedDocs.every((doc) => doc.userId === testUsers.owner.id)).toBe(
      true
    );
  });

  test("getDocumentsSharedWithUser returns only shared documents", async () => {
    // Share doc1 and doc2 with viewer
    await shareDocumentViaAPI(
      testDocumentIds[0],
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );
    await shareDocumentViaAPI(
      testDocumentIds[1],
      testUsers.owner.id,
      testUsers.viewer.id,
      "editor"
    );

    const { getDocumentsSharedWithUser } = await import("../../src/lib/rbac");

    const sharedDocs = await getDocumentsSharedWithUser(testUsers.viewer.id);

    expect(sharedDocs.length).toBe(2);
    expect(sharedDocs.some((s) => s.document.id === testDocumentIds[0])).toBe(
      true
    );
    expect(sharedDocs.some((s) => s.document.id === testDocumentIds[1])).toBe(
      true
    );
    expect(sharedDocs.some((s) => s.document.id === testDocumentIds[2])).toBe(
      false
    );
  });

  test("getAllAccessibleDocuments returns owned and shared documents", async () => {
    // Create a document owned by viewer
    const viewerDoc = await createTestDocument(
      testUsers.viewer.id,
      "viewer-doc.txt"
    );

    // Share one of owner's docs with viewer
    await shareDocumentViaAPI(
      testDocumentIds[0],
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );

    const { getAllAccessibleDocuments } = await import("../../src/lib/rbac");

    const result = await getAllAccessibleDocuments(testUsers.viewer.id);

    expect(result.owned.length).toBe(1);
    expect(result.owned[0].id).toBe(viewerDoc);

    expect(result.shared.length).toBe(1);
    expect(result.shared[0].id).toBe(testDocumentIds[0]);

    // Cleanup viewer's document
    await cleanupTestDocuments(testUsers.viewer.id);
  });

  test("getDocumentSharedWith returns all users with access", async () => {
    // Share with multiple users
    await shareDocumentViaAPI(
      testDocumentIds[0],
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );
    await shareDocumentViaAPI(
      testDocumentIds[0],
      testUsers.owner.id,
      testUsers.editor.id,
      "editor"
    );

    const { getDocumentSharedWith } = await import("../../src/lib/rbac");

    const sharedWith = await getDocumentSharedWith(testDocumentIds[0]);

    expect(sharedWith.length).toBe(2);

    const viewerEntry = sharedWith.find(
      (s) => s.userId === testUsers.viewer.id
    );
    const editorEntry = sharedWith.find(
      (s) => s.userId === testUsers.editor.id
    );

    expect(viewerEntry).toBeDefined();
    expect(viewerEntry?.permissionLevel).toBe("viewer");
    expect(viewerEntry?.userEmail).toBe(testUsers.viewer.email);

    expect(editorEntry).toBeDefined();
    expect(editorEntry?.permissionLevel).toBe("editor");
    expect(editorEntry?.userEmail).toBe(testUsers.editor.email);
  });

  test("shared documents include permission level", async () => {
    // Share with different permission levels
    await shareDocumentViaAPI(
      testDocumentIds[0],
      testUsers.owner.id,
      testUsers.viewer.id,
      "viewer"
    );
    await shareDocumentViaAPI(
      testDocumentIds[1],
      testUsers.owner.id,
      testUsers.viewer.id,
      "editor"
    );

    const { getDocumentsSharedWithUser } = await import("../../src/lib/rbac");

    const sharedDocs = await getDocumentsSharedWithUser(testUsers.viewer.id);

    const doc1 = sharedDocs.find((s) => s.document.id === testDocumentIds[0]);
    const doc2 = sharedDocs.find((s) => s.document.id === testDocumentIds[1]);

    expect(doc1?.permission.permissionLevel).toBe("viewer");
    expect(doc2?.permission.permissionLevel).toBe("editor");
  });

  test("expired permissions are not returned", async () => {
    // Share with expiration in the past
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const { shareDocument } = await import("../../src/lib/rbac");
    await shareDocument({
      documentId: testDocumentIds[0],
      ownerId: testUsers.owner.id,
      shareWithUserId: testUsers.viewer.id,
      permissionLevel: "viewer",
      expiresAt: pastDate,
    });

    const { getDocumentsSharedWithUser } = await import("../../src/lib/rbac");

    const sharedDocs = await getDocumentsSharedWithUser(testUsers.viewer.id);

    // Should not include expired permission
    expect(sharedDocs.some((s) => s.document.id === testDocumentIds[0])).toBe(
      false
    );
  });

  test("active time-limited permissions are returned", async () => {
    // Share with expiration in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const { shareDocument } = await import("../../src/lib/rbac");
    await shareDocument({
      documentId: testDocumentIds[0],
      ownerId: testUsers.owner.id,
      shareWithUserId: testUsers.viewer.id,
      permissionLevel: "viewer",
      expiresAt: futureDate,
    });

    const { getDocumentsSharedWithUser } = await import("../../src/lib/rbac");

    const sharedDocs = await getDocumentsSharedWithUser(testUsers.viewer.id);

    // Should include active time-limited permission
    expect(sharedDocs.some((s) => s.document.id === testDocumentIds[0])).toBe(
      true
    );
  });

  test("user with no documents returns empty arrays", async () => {
    const { getAllAccessibleDocuments } = await import("../../src/lib/rbac");

    const result = await getAllAccessibleDocuments(testUsers.unauthorized.id);

    expect(result.owned.length).toBe(0);
    expect(result.shared.length).toBe(0);
  });
});
