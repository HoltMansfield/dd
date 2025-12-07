# Netlify Functions

## run-migration.ts

Automatically runs database migrations after successful Netlify deploys.

### Quick Setup

1. **Add environment variables in Netlify:**

   ```
   WEBHOOK_SECRET=<random-32-char-hex>

   DB_URL=postgresql://... (set different values per deploy context)
   - Production: your prod database
   - Deploy Previews: your dev database
   - Branch (qa): your QA database
   ```

2. **Configure webhook in Netlify UI:**

   - Site Settings → Build & Deploy → Deploy notifications
   - Add notification → Outgoing webhook
   - Event: "Deploy succeeded"
   - URL: `https://your-site.netlify.app/.netlify/functions/run-migration`

3. **Deploy and test!**

### Full Documentation

See: [DOCS/netlify-migration-setup.md](../../DOCS/netlify-migration-setup.md)
