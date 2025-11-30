# Supabase Storage - Quick Start Checklist

## 🚀 Quick Setup (15 minutes)

### 1. Create Supabase Account & Project

- [ ] Go to https://supabase.com and sign up
- [ ] Create new project (name: `dd-storage` or similar)
- [ ] Wait ~2 minutes for project creation

### 2. Create Storage Bucket

- [ ] Navigate to **Storage** in left sidebar
- [ ] Click "Create a new bucket"
- [ ] Name: `documents`
- [ ] **IMPORTANT**: Keep "Public bucket" **UNCHECKED** ❌
- [ ] Set file size limit: 50MB
- [ ] Click "Create bucket"

### 3. Get API Keys

- [ ] Go to **Settings** → **API**
- [ ] Copy these three values:
  - Project URL: `https://xxxxx.supabase.co`
  - anon public key (starts with `eyJ...`)
  - service_role key (different from anon, also starts with `eyJ...`)

### 4. Add Environment Variables

Create/update `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **Never commit `.env.local` to git!**

### 5. Run Database Migration

```bash
npm run generate
npm run migrate
```

This creates the `documents` table in your **Neon DB** (not Supabase DB).

**Important**:

- The `documents` table stores only metadata (filename, size, path)
- The actual files are stored in Supabase Storage
- All tables (users, sessions, documents) are in your Neon DB
- Supabase is only used for file storage, not their database

### 6. Test It Out

```bash
npm run dev
```

Visit http://localhost:3000/documents and try uploading a file!

---

## 📋 For Production (Netlify)

### Add Environment Variables to Netlify

1. Go to Netlify Dashboard → Your Site
2. **Site settings** → **Environment variables**
3. Add all three Supabase variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Deploy

```bash
npm run build
git push
```

Netlify will automatically deploy with the new environment variables.

---

## ✅ What You Get

- **Secure file uploads** (up to 50MB)
- **SOC2-compliant storage** (Supabase is SOC2 Type II certified)
- **File management UI** (upload, download, delete)
- **Metadata in Neon DB** (file info, user ownership)
- **Actual files in Supabase Storage** (encrypted at rest)
- **Time-limited download URLs** (expire after 1 hour)

---

## 🔒 Security Features

✅ Encryption at rest (AES-256)  
✅ Encryption in transit (TLS)  
✅ User-based file isolation  
✅ File type validation  
✅ File size limits  
✅ Signed URLs with expiration  
✅ Server-side validation

---

## 📁 Supported File Types

- **Documents**: PDF, Word (.doc, .docx)
- **Spreadsheets**: Excel (.xls, .xlsx), CSV
- **Images**: JPEG, PNG, GIF, WebP

Easy to add more types in `/src/actions/documents.ts`

---

## 🆘 Troubleshooting

**"Missing environment variable" error**
→ Restart dev server after adding env vars

**Upload fails**
→ Check Supabase dashboard to verify bucket exists and is named `documents`

**Can't download files**
→ Check browser console for errors, verify file exists in Supabase Storage

---

## 📚 Full Documentation

See `DOCS/supabase-storage-setup.md` for detailed setup, security policies, and advanced configuration.

---

## 💰 Cost

**Supabase Free Tier**: 1GB storage, 2GB bandwidth/month  
**Perfect for**: Development and small apps  
**Upgrade when needed**: $25/mo for 100GB storage

---

## 🎯 Next Steps

1. ✅ Complete setup above
2. 🔄 Integrate into your app's navigation
3. 🔄 Customize allowed file types if needed
4. 🔄 Add file preview functionality
5. 🔄 Set up monitoring/alerts
