# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage for SOC2-compliant file storage.

## Prerequisites

- A Supabase account (free tier available at https://supabase.com)
- Your existing Neon DB and Netlify setup

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in project details:
   - **Name**: Choose a name (e.g., "dd-storage")
   - **Database Password**: Generate a strong password (you won't need this for storage-only)
   - **Region**: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

## Step 2: Create Storage Bucket

1. In your Supabase dashboard, go to **Storage** in the left sidebar
2. Click "Create a new bucket"
3. Configure the bucket:
   - **Name**: `documents`
   - **Public bucket**: ❌ **UNCHECKED** (keep it private!)
   - **File size limit**: 50MB (or adjust as needed)
   - **Allowed MIME types**: Leave empty for now (we handle this in code)
4. Click "Create bucket"

## Step 3: Set Up Storage Policies (Security)

1. Click on the `documents` bucket
2. Go to **Policies** tab
3. Click "New Policy"
4. Create the following policies:

### Policy 1: Users can upload to their own folder

```sql
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Users can read their own files

```sql
CREATE POLICY "Users can read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: Users can delete their own files

```sql
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Note**: Since we're using the service role key in server actions, these policies are optional but recommended for defense in depth.

## Step 4: Get API Keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (starts with eyJ)
   - **service_role key**: `eyJhbGc...` (different from anon key)

⚠️ **IMPORTANT**: The `service_role` key bypasses Row Level Security. NEVER expose it to the client!

## Step 5: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### For Netlify Deployment

Add the same variables to Netlify:

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Step 6: Run Database Migration

Generate and apply the migration for the new `documents` table:

```bash
# Generate migration
npm run generate

# Apply migration to your Neon DB
npm run migrate
```

This will create the `documents` table in your **Neon database** to store file metadata.

**Architecture Note**:

- The `documents` table is stored in **Neon DB** (your existing database)
- The actual files are stored in **Supabase Storage** (separate service)
- All tables (users, sessions, documents) live in Neon DB
- Only the binary files live in Supabase Storage
- Everything is in `src/db/schema.ts` - one schema file for all tables

## Step 7: Test the Integration

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to `/documents` in your browser

3. Try uploading a test file (PDF, image, etc.)

4. Verify:
   - File appears in Supabase Storage (check dashboard)
   - Metadata appears in Neon DB (check your database)
   - You can download the file
   - You can delete the file

## Security Best Practices

### ✅ DO:

- Use service role key only in server actions
- Validate file types and sizes on the server
- Generate signed URLs with expiration (we use 1 hour)
- Store only metadata in the database
- Use HTTPS for all transfers
- Regularly audit access logs

### ❌ DON'T:

- Never expose service role key to client
- Don't store files in the database
- Don't allow unlimited file sizes
- Don't skip MIME type validation
- Don't use public buckets for sensitive data

## File Structure

```
src/
├── actions/
│   └── documents.ts          # Server actions for file operations
├── components/
│   ├── DocumentUpload.tsx    # Upload UI component
│   └── DocumentsList.tsx     # List/download/delete UI
├── lib/
│   └── supabase.ts           # Supabase client configuration
├── db/
│   └── schema.ts             # All database tables (users, sessions, documents)
└── app/
    └── documents/
        └── page.tsx          # Demo page
```

**Note**: The `documents` table metadata is stored in your Neon DB (in `schema.ts`), while the actual files are stored in Supabase Storage.

## Monitoring & Compliance

### Supabase Dashboard

- **Storage**: Monitor usage and file count
- **Logs**: View access logs and errors
- **Database**: Check metadata integrity

### SOC2 Compliance Checklist

- ✅ Encryption at rest (Supabase default)
- ✅ Encryption in transit (HTTPS/TLS)
- ✅ Access controls (RLS policies + server validation)
- ✅ Audit logging (Supabase logs)
- ✅ Signed URLs with expiration
- ✅ File type and size validation
- ✅ User-based isolation (files stored in user folders)

### Supabase Compliance

- SOC2 Type II certified
- HIPAA compliant
- GDPR compliant
- ISO 27001 certified

## Troubleshooting

### "Missing environment variable" error

- Ensure all three env vars are set in `.env.local`
- Restart your dev server after adding env vars

### Upload fails with "Unauthorized"

- Check that service role key is correct
- Verify bucket name matches ("documents")

### Can't download files

- Ensure signed URL generation is working
- Check browser console for errors
- Verify file exists in Supabase dashboard

### Database migration fails

- Ensure Neon DB connection string is correct
- Check that you have write permissions
- Try running `npm run push` for development

## Cost Estimates

### Supabase Pricing

- **Free tier**: 1GB storage, 2GB bandwidth/month
- **Pro ($25/mo)**: 100GB storage, 200GB bandwidth
- **Additional**: $0.021/GB storage, $0.09/GB bandwidth

For most small to medium apps, the free tier is sufficient to start.

## Next Steps

1. ✅ Set up Supabase project and bucket
2. ✅ Configure environment variables
3. ✅ Run database migration
4. ✅ Test file upload/download
5. 🔄 Integrate into your app's UI
6. 🔄 Add to your navigation/menu
7. 🔄 Customize file type restrictions as needed
8. 🔄 Set up monitoring and alerts

## Support

- Supabase Docs: https://supabase.com/docs/guides/storage
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: Create an issue in your repo
