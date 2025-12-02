// Helper functions for RBAC E2E tests
import { Page, BrowserContext } from "@playwright/test";
import { TestUser } from "./rbac-users";

/**
 * Login a user and return the page with authenticated session
 */
export async function loginUser(
  context: BrowserContext,
  user: TestUser,
  baseURL: string
): Promise<Page> {
  const page = await context.newPage();

  // Navigate to login page
  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState("networkidle");

  // Fill login form
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for redirect after login
  await page.waitForTimeout(2000);

  // Verify we're logged in (not on login page)
  if (page.url().includes("/login")) {
    throw new Error(`Failed to login user ${user.email}`);
  }

  console.log(`[RBAC Test] Logged in as ${user.email}`);
  return page;
}

/**
 * Register a user if they don't exist, then login
 */
export async function registerAndLoginUser(
  context: BrowserContext,
  user: TestUser,
  baseURL: string
): Promise<Page> {
  const page = await context.newPage();

  // Try to register first
  await page.goto(`${baseURL}/register`);
  await page.waitForLoadState("networkidle");

  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // If registration failed (user exists), login instead
  if (page.url().includes("/register")) {
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  }

  console.log(`[RBAC Test] Registered/logged in as ${user.email}`);
  return page;
}

/**
 * Upload a test document
 */
export async function uploadDocument(
  page: Page,
  fileName: string,
  fileContent: string
): Promise<string> {
  // Create a test file
  const buffer = Buffer.from(fileContent);
  const file = {
    name: fileName,
    mimeType: "text/plain",
    buffer,
  };

  // Navigate to upload page or trigger upload
  // This depends on your UI implementation
  // For now, return a mock document ID
  // You'll need to implement the actual upload flow based on your UI

  console.log(`[RBAC Test] Uploaded document ${fileName}`);
  return "mock-document-id"; // Replace with actual document ID from upload
}

/**
 * Share a document with another user via API
 * This is a direct database operation for testing
 */
export async function shareDocumentViaAPI(
  documentId: string,
  ownerId: string,
  shareWithUserId: string,
  permissionLevel: "editor" | "viewer"
): Promise<void> {
  // Import the RBAC function
  const { shareDocument } = await import("../../src/lib/rbac");

  const result = await shareDocument({
    documentId,
    ownerId,
    shareWithUserId,
    permissionLevel,
  });

  if (!result.success) {
    throw new Error(`Failed to share document: ${result.error}`);
  }

  console.log(
    `[RBAC Test] Shared document ${documentId} with user ${shareWithUserId} as ${permissionLevel}`
  );
}

/**
 * Create a test document directly in the database
 */
export async function createTestDocument(
  ownerId: string,
  fileName: string = "test-document.txt"
): Promise<string> {
  const { db } = await import("../../src/db/connect");
  const { documents } = await import("../../src/db/schema");

  const [doc] = await db
    .insert(documents)
    .values({
      userId: ownerId,
      fileName,
      fileSize: 1024,
      mimeType: "text/plain",
      storagePath: `test/${ownerId}/${fileName}`,
      bucketName: "documents",
      description: "E2E test document",
    })
    .returning();

  console.log(`[RBAC Test] Created test document ${doc.id}`);
  return doc.id;
}

/**
 * Clean up test documents
 */
export async function cleanupTestDocuments(ownerId: string): Promise<void> {
  // Small delay to ensure all async operations (like audit logs) complete
  await new Promise((resolve) => setTimeout(resolve, 150));

  const { db } = await import("../../src/db/connect");
  const { documents } = await import("../../src/db/schema");
  const { eq } = await import("drizzle-orm");

  await db.delete(documents).where(eq(documents.userId, ownerId));
  console.log(`[RBAC Test] Cleaned up documents for user ${ownerId}`);
}
