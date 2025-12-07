# Netlify Functions

## run-migration.ts

Automatically runs database migrations after successful Netlify deploys.

### Quick Setup

1. **Add environment variables in Netlify:**

   ```
   WEBHOOK_SECRET=<random-32-char-hex>
   DEV_DB_URL=postgresql://...
   QA_DB_URL=postgresql://...
   PROD_DB_URL=postgresql://...
   ```

2. **Configure webhook in Netlify UI:**

   - Site Settings → Build & Deploy → Deploy notifications
   - Add notification → Outgoing webhook
   - Event: "Deploy succeeded"
   - URL: `https://your-site.netlify.app/.netlify/functions/run-migration`

3. **Deploy and test!**

### Full Documentation

See: [DOCS/netlify-migration-setup.md](../../DOCS/netlify-migration-setup.md)
