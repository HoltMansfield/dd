# RBAC Quick Start Guide

## What Was Implemented

A complete Role-Based Access Control (RBAC) system for document collaboration with three permission levels: **Owner**, **Editor**, and **Viewer**.

## Files Created/Modified

### ✅ Created Files

1. **`/src/lib/rbac.ts`** - All RBAC functions
2. **`/DOCS/SOC2/rbac-implementation.md`** - Complete documentation
3. **`/drizzle/migrations/0006_misty_gamma_corps.sql`** - Database migration

### ✅ Modified Files

1. **`/src/db/schema.ts`** - Added `documentPermissions` table and types
2. **`/DOCS/SOC2/Checklist.md`** - Marked RBAC items as completed

## Next Steps

### 1. Run the Migration

```bash
npm run migrate
```

This creates the `documentPermissions` table in your database.

### 2. Import RBAC Functions

```typescript
import {
  canAccessDocument,
  shareDocument,
  revokeAccess,
  getDocumentSharedWith,
  getAllAccessibleDocuments,
} from "@/lib/rbac";
```

### 3. Example: Share a Document

```typescript
const result = await shareDocument({
  documentId: "doc-uuid",
  ownerId: "owner-user-id",
  shareWithUserId: "recipient-user-id",
  permissionLevel: "viewer", // or 'editor'
});

if (result.success) {
  console.log("Shared successfully!");
}
```

### 4. Example: Check Access

```typescript
// Before allowing download
const canDownload = await canAccessDocument(userId, documentId, "viewer");

if (!canDownload) {
  return { error: "Access denied" };
}

// Proceed with download...
```

### 5. Example: Get User's Documents

```typescript
const { owned, shared } = await getAllAccessibleDocuments(userId);

console.log("Documents I own:", owned);
console.log("Documents shared with me:", shared);
```

## Permission Levels

| Permission | View | Download | Edit | Delete | Share |
| ---------- | ---- | -------- | ---- | ------ | ----- |
| Owner      | ✅   | ✅       | ✅   | ✅     | ✅    |
| Editor     | ✅   | ✅       | ✅   | ❌     | ❌    |
| Viewer     | ✅   | ✅       | ❌   | ❌     | ❌    |

## Audit Logging

All RBAC actions are automatically logged:

- **`share`** - Document shared with another user
- **`revoke`** - Access revoked from a user
- **`access_denied`** - Unauthorized access attempt

## SOC2 Compliance

This implementation completes these checklist items:

- ✅ Implement RBAC for all documents
- ✅ Enforce principle of least privilege
- ✅ Maintain access control lists (ACLs)
- ✅ Enable access reviews and revocation
- ✅ Audit all permission changes

## UI Components Needed

To complete the user experience, you'll need to build:

1. **Share Modal** - UI to share documents with other users
2. **Shared With List** - Show who has access to a document
3. **Shared With Me Page** - Show documents others have shared
4. **Permission Badge** - Display user's permission level
5. **Revoke Button** - Allow owner to remove access

## Testing

```typescript
// Test the RBAC system
import { shareDocument, canAccessDocument } from "@/lib/rbac";

// 1. Share a document
const shareResult = await shareDocument({
  documentId: "test-doc",
  ownerId: "user-1",
  shareWithUserId: "user-2",
  permissionLevel: "viewer",
});

console.log("Share result:", shareResult);

// 2. Check if user-2 can access
const hasAccess = await canAccessDocument("user-2", "test-doc", "viewer");
console.log("User 2 has access:", hasAccess); // Should be true

// 3. Check if user-2 can delete (should be false)
const canDelete = await canAccessDocument("user-2", "test-doc", "owner");
console.log("User 2 can delete:", canDelete); // Should be false
```

## Full Documentation

See `/DOCS/SOC2/rbac-implementation.md` for:

- Complete API reference
- Security considerations
- Usage examples
- Troubleshooting guide
- Future enhancements

---

**Status**: ✅ Ready to use  
**Migration**: Run `npm run migrate`  
**Next**: Build UI components for sharing
