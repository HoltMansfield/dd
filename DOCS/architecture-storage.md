# Storage Architecture

## Overview

This application uses a **hybrid storage approach**:

- **Neon DB**: All relational data (users, sessions, file metadata)
- **Supabase Storage**: Secure file storage (SOC2-compliant)

## Database Schema

**Important**: The `documents` table is stored in **Neon DB**. It only contains metadata about files that are physically stored in Supabase Storage.

## Data Flow

### Upload Flow

```
1. User uploads file via UI
   ↓
2. Server action validates file
   ↓
3. File uploaded to Supabase Storage (encrypted)
   ↓
4. Metadata saved to Neon DB (documents table)
   ↓
5. Success response to user
```

### Download Flow

```
1. User requests file download
   ↓
2. Server action checks ownership (Neon DB)
   ↓
3. Generate signed URL from Supabase (1-hour expiration)
   ↓
4. Return URL to user
   ↓
5. User downloads directly from Supabase
```

## Why This Architecture?

### ✅ Advantages

1. **Separation of Concerns**: Neon handles structured data, Supabase handles files
2. **Cost Effective**: Don't store large files in expensive database storage
3. **Performance**: Files served via CDN from Supabase
4. **Scalability**: Each service scales independently
5. **Security**: Files encrypted at rest in Supabase, metadata in Neon
6. **Compliance**: Supabase is SOC2 certified for file storage

### 🎯 Best Practices

- **Never store files in Neon DB** (use Supabase Storage)
- **Always store metadata in Neon DB** (for querying, relationships)
- **Use server actions** (never expose storage keys to client)
- **Keep everything in one schema** (schema.ts for simplicity)

## File Storage Locations

| Data Type     | Stored In        | Why                                 |
| ------------- | ---------------- | ----------------------------------- |
| User info     | Neon DB          | Structured, relational data         |
| Sessions      | Neon DB          | Fast queries, relationships         |
| File metadata | Neon DB          | Queryable, relationships with users |
| Actual files  | Supabase Storage | Optimized for large files, CDN      |

## Security Model

### Neon DB Security

- Row-level security via application logic
- User authentication via sessions
- Server-side validation

### Supabase Storage Security

- Private buckets (not public)
- User-based folder structure (`userId/filename`)
- Signed URLs with expiration
- Server-side validation (file type, size)
- Service role key only in server actions

## Migration Strategy

When you run `npm run generate && npm run migrate`:

- Creates `documents` table in **Neon DB**
- Does NOT create anything in Supabase DB
- Supabase Storage bucket created manually via dashboard

## Querying Files

All file queries go through Neon DB:

```typescript
// ✅ Query metadata in Neon
const userFiles = await db
  .select()
  .from(documents)
  .where(eq(documents.userId, userId));

// Note: We don't use Supabase's PostgreSQL database at all
// Only Supabase Storage for file storage
```

## Summary

- **Neon DB**: Your primary database for all application data (users, sessions, file metadata)
- **Supabase Storage**: File storage only (not using their database)
- **Hybrid Approach**: Best of both worlds - structured data in Neon, files in Supabase
- **Simple Schema**: Everything in `schema.ts` for easy management
