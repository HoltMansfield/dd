# RBAC Implementation for Document Collaboration

## Overview

This document describes the Role-Based Access Control (RBAC) system implemented for document sharing and collaboration. The system enables users to securely share documents with other users while maintaining SOC2 compliance through comprehensive audit logging and access controls.

## Permission Levels

### Document-Level Permissions

Each document can have multiple users with different permission levels:

| Permission | Can View | Can Download | Can Edit | Can Delete | Can Share |
| ---------- | -------- | ------------ | -------- | ---------- | --------- |
| **Owner**  | ✅       | ✅           | ✅       | ✅         | ✅        |
| **Editor** | ✅       | ✅           | ✅       | ❌         | ❌        |
| **Viewer** | ✅       | ✅           | ❌       | ❌         | ❌        |

### Permission Hierarchy

```
Owner > Editor > Viewer
```

- **Owner**: The user who uploaded the document. Has full control.
- **Editor**: Can view, download, and modify the document (if editing features are added).
- **Viewer**: Can only view and download the document.

### Key Features

- **Unique Constraint**: A user can only have one permission level per document
- **Cascade Delete**: Permissions are automatically deleted when document or user is deleted
- **Time-Limited Sharing**: Optional `expiresAt` field for temporary access
- **Audit Trail**: `grantedBy` and `grantedAt` track who shared and when

## API Functions

All RBAC functions are located in `/src/lib/rbac.ts`.

### 1. Check Access Permission

```typescript
import { canAccessDocument } from "@/lib/rbac";

// Check if user can view a document
const canView = await canAccessDocument(userId, documentId, "viewer");

// Check if user can edit a document
const canEdit = await canAccessDocument(userId, documentId, "editor");

// Check if user is the owner
const isOwner = await canAccessDocument(userId, documentId, "owner");
```

### 2. Get User's Permission Level

```typescript
import { getUserPermissionLevel } from "@/lib/rbac";

const permission = await getUserPermissionLevel(userId, documentId);
// Returns: 'owner' | 'editor' | 'viewer' | null
```

### 3. Share a Document

```typescript
import { shareDocument } from "@/lib/rbac";

const result = await shareDocument({
  documentId: "doc-uuid",
  ownerId: "owner-user-id",
  shareWithUserId: "recipient-user-id",
  permissionLevel: "viewer", // or 'editor'
  expiresAt: new Date("2025-12-31"), // optional
});

if (result.success) {
  console.log("Document shared successfully");
} else {
  console.error("Error:", result.error);
}
```

### 4. Revoke Access

```typescript
import { revokeAccess } from "@/lib/rbac";

const result = await revokeAccess({
  documentId: "doc-uuid",
  ownerId: "owner-user-id",
  revokeUserId: "user-to-revoke",
});

if (result.success) {
  console.log("Access revoked successfully");
}
```

### 5. Get Document Sharing Info

```typescript
import { getDocumentSharedWith } from "@/lib/rbac";

// Get all users who have access to a document
const sharedWith = await getDocumentSharedWith(documentId);
// Returns: Array of { userId, userName, userEmail, permissionLevel, grantedAt, expiresAt }
```

### 6. Get User's Documents

```typescript
import {
  getDocumentsOwnedByUser,
  getDocumentsSharedWithUser,
  getAllAccessibleDocuments,
} from "@/lib/rbac";

// Get documents owned by user
const owned = await getDocumentsOwnedByUser(userId);

// Get documents shared with user
const shared = await getDocumentsSharedWithUser(userId);

// Get all accessible documents (owned + shared)
const all = await getAllAccessibleDocuments(userId);
// Returns: { owned: Document[], shared: Document[] }
```

### 7. Check Specific Action Permission

```typescript
import { canPerformAction } from "@/lib/rbac";

const canDelete = await canPerformAction(userId, documentId, "delete");
const canShare = await canPerformAction(userId, documentId, "share");
const canView = await canPerformAction(userId, documentId, "view");
```

## Audit Logging

All RBAC actions are automatically logged for SOC2 compliance.

### New Audit Action Types

```typescript
export type AuditAction =
  | "upload"
  | "download"
  | "delete"
  | "view"
  | "list"
  | "share" // NEW: Document shared with another user
  | "revoke" // NEW: Access revoked from a user
  | "access_denied"; // NEW: Unauthorized access attempt
```

### Audit Log Examples

**Successful Share:**

```json
{
  "userId": "owner-id",
  "action": "share",
  "documentId": "doc-id",
  "success": true,
  "metadata": {
    "sharedWith": "recipient-id",
    "sharedWithEmail": "user@example.com",
    "permission": "viewer",
    "expiresAt": "2025-12-31T00:00:00Z"
  }
}
```

**Access Denied:**

```json
{
  "userId": "user-id",
  "action": "access_denied",
  "documentId": "doc-id",
  "success": false,
  "errorMessage": "Insufficient permission to delete",
  "metadata": {
    "attemptedAction": "delete",
    "currentPermission": "viewer"
  }
}
```

**Revoke Access:**

```json
{
  "userId": "owner-id",
  "action": "revoke",
  "documentId": "doc-id",
  "success": true,
  "metadata": {
    "revokedFrom": "user-id",
    "previousPermission": "editor"
  }
}
```

## Usage Examples

### Example 1: Share Document with Viewer Access

```typescript
"use server";

import { shareDocument } from "@/lib/rbac";
import { getCurrentUserId } from "@/actions/auth";

export async function shareDocumentAction(
  documentId: string,
  recipientEmail: string
) {
  const ownerId = await getCurrentUserId();
  if (!ownerId) {
    return { success: false, error: "Not authenticated" };
  }

  // Find user by email
  const recipient = await db
    .select()
    .from(users)
    .where(eq(users.email, recipientEmail))
    .limit(1);

  if (!recipient[0]) {
    return { success: false, error: "User not found" };
  }

  return await shareDocument({
    documentId,
    ownerId,
    shareWithUserId: recipient[0].id,
    permissionLevel: "viewer",
  });
}
```

### Example 2: Check Access Before Download

```typescript
"use server";

import { canAccessDocument } from "@/lib/rbac";
import { getCurrentUserId } from "@/actions/auth";
import { createAuditLog } from "@/lib/audit";

export async function downloadDocument(documentId: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user has at least viewer permission
  const hasAccess = await canAccessDocument(userId, documentId, "viewer");

  if (!hasAccess) {
    return { success: false, error: "Access denied" };
  }

  // Proceed with download...
  await createAuditLog({
    userId,
    action: "download",
    documentId,
    success: true,
  });

  // Return download URL...
}
```

### Example 3: Display Shared Documents

```typescript
import { getAllAccessibleDocuments } from "@/lib/rbac";

export async function DocumentsPage() {
  const userId = await getCurrentUserId();
  const { owned, shared } = await getAllAccessibleDocuments(userId);

  return (
    <div>
      <h2>My Documents</h2>
      {owned.map((doc) => (
        <DocumentCard key={doc.id} document={doc} isOwner={true} />
      ))}

      <h2>Shared With Me</h2>
      {shared.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          permissionLevel={doc.permissionLevel}
          sharedBy={doc.sharedBy}
        />
      ))}
    </div>
  );
}
```

### Example 4: Share Modal Component

```typescript
"use client";

import { useState } from "react";
import { shareDocument } from "@/lib/rbac";

export function ShareModal({ documentId, ownerId }: Props) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"viewer" | "editor">("viewer");

  async function handleShare() {
    const result = await shareDocument({
      documentId,
      ownerId,
      shareWithUserId: email, // In real app, look up user by email first
      permissionLevel: permission,
    });

    if (result.success) {
      alert("Document shared successfully!");
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email address"
      />
      <select
        value={permission}
        onChange={(e) => setPermission(e.target.value as "viewer" | "editor")}
      >
        <option value="viewer">Viewer (can view & download)</option>
        <option value="editor">Editor (can edit)</option>
      </select>
      <button onClick={handleShare}>Share</button>
    </div>
  );
}
```

## Security Considerations

### 1. Access Control Enforcement

- **Always check permissions** before allowing any document operation
- Use `canAccessDocument()` or `canPerformAction()` in all server actions
- Never trust client-side permission checks

### 2. Owner Verification

- Only document owners can share or revoke access
- Owner status is determined by `documents.userId` field
- Cannot be overridden by shared permissions

### 3. Audit Logging

- All permission changes are logged
- Failed access attempts are logged with `access_denied` action
- Logs include who granted/revoked access and when

### 4. Time-Limited Sharing

- Use `expiresAt` field for temporary access
- Expired permissions are automatically excluded from queries
- Consider running a cleanup job to delete expired permissions

### 5. Cascading Deletes

- When a document is deleted, all permissions are automatically deleted
- When a user is deleted, all their permissions (granted and received) are deleted
- This prevents orphaned permission records

## SOC2 Compliance Benefits

This RBAC implementation addresses the following SOC2 checklist items:

### ✅ Completed

- **Implement role-based access control (RBAC)** - Permission levels per document
- **Enforce principle of least privilege** - Users only get access they're granted
- **Maintain access control lists (ACLs)** - `documentPermissions` table
- **Log all access to documents** - Audit logs for share/revoke/access_denied
- **Track who accessed what and when** - Complete audit trail

### 🔄 Enables Future Compliance

- **Quarterly access reviews** - Query `documentPermissions` table
- **Revoke access for terminated employees** - Use `revokeAccess()` function
- **Time-limited access** - Use `expiresAt` field
- **Access reporting** - Query audit logs for compliance reports

## Migration Instructions

### 1. Run the Migration

```bash
npm run migrate
```

This will create the `documentPermissions` table with all necessary indexes and constraints.

### 2. Verify Migration

```bash
npm run studio
```

Open Drizzle Studio and verify the `documentPermissions` table exists.

### 3. Test RBAC Functions

```typescript
// Test sharing
const result = await shareDocument({
  documentId: "test-doc-id",
  ownerId: "test-owner-id",
  shareWithUserId: "test-user-id",
  permissionLevel: "viewer",
});

console.log("Share result:", result);

// Test access check
const hasAccess = await canAccessDocument(
  "test-user-id",
  "test-doc-id",
  "viewer"
);
console.log("Has access:", hasAccess);
```

## Future Enhancements

### Planned Features

- [ ] **Group Permissions** - Share with groups/teams instead of individual users
- [ ] **Link Sharing** - Generate shareable links with embedded permissions
- [ ] **Permission Templates** - Predefined permission sets for common scenarios
- [ ] **Bulk Operations** - Share/revoke multiple documents at once
- [ ] **Permission Inheritance** - Folder-level permissions that cascade to documents
- [ ] **Activity Feed** - Show recent sharing activity for a document
- [ ] **Email Notifications** - Notify users when documents are shared with them

### UI Components Needed

- [ ] Share modal/dialog
- [ ] Shared with list (show who has access)
- [ ] Permission badge (show user's permission level)
- [ ] Shared with me page
- [ ] Access management dashboard (admin)

## Troubleshooting

### Permission Not Working

1. Check if migration was run: `npm run migrate`
2. Verify permission exists in database
3. Check if permission has expired (`expiresAt` field)
4. Verify user and document IDs are correct

### Share Function Fails

1. Verify owner has permission to share (must be document owner)
2. Check if target user exists
3. Ensure not trying to share with self
4. Check database constraints (unique index on documentId + userId)

### Access Denied Logs

1. Review audit logs for `access_denied` actions
2. Check user's current permission level
3. Verify required permission for attempted action
4. Ensure permission hasn't expired

## Related Documentation

- [Audit Logging](./audit-logging.md)
- [Data Retention Policy](./data-retention-policy.md)
- [SOC2 Compliance Checklist](./Checklist.md)
- [Database Schema](../../src/db/schema.ts)

## Changelog

**2024-11-30**: Initial RBAC implementation

- Created `documentPermissions` table
- Implemented core RBAC functions
- Added audit logging for share/revoke/access_denied
- Generated database migration
- Created documentation

---

**Last Updated**: 2024-11-30  
**Owner**: Engineering Team  
**Status**: ✅ Implemented, Ready for Testing
