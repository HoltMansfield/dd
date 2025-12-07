# Netlify Migration Webhook Setup Guide

This guide explains how to set up automatic database migrations that run after successful Netlify deploys.

## How It Works

```
1. Merge PR → Netlify builds & deploys
2. Deploy succeeds ✓
3. Netlify sends webhook to migration function
4. Function verifies signature (security)
5. Function determines environment (dev/qa/prod)
6. Function runs migrations against correct database
7. Success/failure logged & alerted
```

## Setup Steps

### 1. Configure Environment Variables in Netlify

Go to: **Site Settings → Environment Variables**

Add the following variables:

#### WEBHOOK_SECRET (same for all contexts)

```bash
WEBHOOK_SECRET=your-random-secret-here
```

**Generate WEBHOOK_SECRET:**

```bash
# On Mac/Linux:
openssl rand -hex 32

# Or use Node:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### DB_URL (different per deploy context)

Netlify lets you set different values for the same variable based on deploy context!

1. Click "Add variable" → Enter `DB_URL`
2. Set values for each context:

**Production (main branch):**

```bash
DB_URL=postgresql://user:pass@prod-db.neon.tech/prod_db
```

Scope: `Production`

**QA (qa branch):**

```bash
DB_URL=postgresql://user:pass@qa-db.neon.tech/qa_db
```

Scope: `Branches` → Select `qa` branch

**Development (all other branches/PRs):**

```bash
DB_URL=postgresql://user:pass@dev-db.neon.tech/dev_db
```

Scope: `Deploy Previews` and `Branch deploys`

**How it works:**

- When you deploy to `main`, the function gets the Production DB_URL
- When you deploy to `qa`, the function gets the QA DB_URL
- When you deploy a PR, the function gets the Dev DB_URL
- Netlify handles this automatically! 🎉

### 2. Deploy the Migration Function

The function is located at: `netlify/functions/run-migration.ts`

It will be automatically deployed with your site.

### 3. Configure Netlify Deploy Notification

1. Go to: **Site Settings → Build & Deploy → Deploy notifications**
2. Click **Add notification**
3. Select **Outgoing webhook**
4. Configure:
   - **Event to listen for**: Deploy succeeded
   - **URL to notify**: `https://your-site.netlify.app/.netlify/functions/run-migration`
   - Leave other fields as default
5. Click **Save**

### 4. Test the Setup

**Option A: Trigger a test deploy**

```bash
git commit --allow-empty -m "test: trigger migration webhook"
git push
```

**Option B: Manual webhook test**

Use curl to simulate a webhook (requires valid signature):

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/run-migration \
  -H "Content-Type: application/json" \
  -H "x-netlify-signature: YOUR_SIGNATURE" \
  -d '{
    "state": "ready",
    "context": "production",
    "branch": "main",
    "commit_message": "Test migration"
  }'
```

## Environment Mapping

Netlify automatically provides the correct `DB_URL` based on deploy context:

| Deploy Context   | Branch         | DB_URL Value                                  |
| ---------------- | -------------- | --------------------------------------------- |
| `production`     | `main`         | Production database (configured in Netlify)   |
| `branch-deploy`  | `qa`           | QA database (configured for qa branch)        |
| `deploy-preview` | Any PR         | Dev database (configured for deploy previews) |
| `branch-deploy`  | Other branches | Dev database (configured for branch deploys)  |

**You don't need to write any code to handle this** - Netlify does it automatically!

## Migration Workflow

### Local Development

```bash
# 1. Make schema changes
vim src/db/schema.ts

# 2. Generate migration files
npm run generate
# → Creates drizzle/migrations/0009_new_migration.sql

# 3. Test locally
npm run migrate

# 4. Commit and push
git add drizzle/migrations/
git commit -m "feat: add new column"
git push
```

### Automatic Migration on Netlify

```bash
# After push:
1. Netlify builds your app
2. Deploy succeeds
3. Webhook triggers migration function
4. Function reads migration files from repo
5. Function applies migrations to appropriate DB
6. You receive success/failure notification
```

## Security Features

✅ **Webhook Signature Verification**

- Uses HMAC SHA256 to verify requests are from Netlify
- Prevents unauthorized migration runs

✅ **Environment Isolation**

- Each environment has separate database URL
- No cross-environment contamination

✅ **Idempotent Migrations**

- Drizzle tracks applied migrations
- Safe to run multiple times

## Monitoring & Alerts

### View Function Logs

1. Go to: **Netlify Dashboard → Functions**
2. Click on `run-migration`
3. View execution logs

### Add Custom Alerts

Edit `netlify/functions/run-migration.ts` and implement the `sendAlert()` function:

**Slack Example:**

```typescript
async function sendAlert(type, context, branch, message) {
  if (process.env.SLACK_WEBHOOK_URL) {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🔄 Migration ${type}: ${context} (${branch})\n${message}`,
      }),
    });
  }
}
```

**Email Example (SendGrid):**

```typescript
async function sendAlert(type, context, branch, message) {
  if (process.env.SENDGRID_API_KEY) {
    await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: "admin@example.com" }] }],
        from: { email: "noreply@example.com" },
        subject: `Migration ${type}: ${context}`,
        content: [{ type: "text/plain", value: message }],
      }),
    });
  }
}
```

## Troubleshooting

### Migration function not triggering

**Check:**

1. Webhook is configured in Netlify UI
2. URL is correct: `https://your-site.netlify.app/.netlify/functions/run-migration`
3. Event is set to "Deploy succeeded"
4. Function is deployed (check Functions tab)

### "Invalid signature" error

**Fix:**

1. Verify `WEBHOOK_SECRET` is set in environment variables
2. Make sure it matches between Netlify and your function
3. Check webhook signature header is being sent

### "DB_URL not configured" error

**Fix:**

1. Add `DB_URL` environment variable in Netlify
2. Make sure it's configured for the correct deploy context (Production/Deploy Previews/Branches)
3. Redeploy to pick up new environment variables

### Migration fails but deploy succeeded

**This is intentional!** The migration runs _after_ deploy, so:

- Your app is already live
- Migration failure doesn't block the deploy
- You need to fix the migration and redeploy

**To prevent this:**

- Test migrations in DEV first
- Use QA environment before PROD
- Review migration files before merging

## Rollback Strategy

If a migration fails in production:

### Option 1: Revert the migration

```bash
# 1. Create a rollback migration
npm run generate
# Edit the new migration file to undo changes

# 2. Commit and push
git add drizzle/migrations/
git commit -m "fix: rollback failed migration"
git push
```

### Option 2: Manual database fix

```bash
# Connect to production database
psql $PROD_DB_URL

# Manually undo changes
ALTER TABLE ...;

# Update migration tracking
DELETE FROM drizzle.__drizzle_migrations WHERE hash = 'failed_migration_hash';
```

## Best Practices

✅ **Always test in DEV first**

- Merge to dev branch
- Verify migration succeeds
- Then promote to QA/PROD

✅ **Use descriptive commit messages**

- They appear in migration logs
- Help with debugging

✅ **Keep migrations small**

- One logical change per migration
- Easier to rollback if needed

✅ **Monitor migration logs**

- Check Netlify function logs after deploys
- Set up alerts for failures

✅ **Backup before major migrations**

```bash
# Backup production database
pg_dump $PROD_DB_URL > backup-$(date +%Y%m%d).sql
```

## Advanced: Branch-Specific Databases

To use different databases for feature branches:

```typescript
function getDatabaseUrl(context: string, branch: string): string | null {
  // Production
  if (context === "production") {
    return process.env.PROD_DB_URL || null;
  }

  // QA
  if (branch === "qa") {
    return process.env.QA_DB_URL || null;
  }

  // Feature branches → separate DBs
  if (branch.startsWith("feat/")) {
    const branchDb =
      process.env[
        `BRANCH_${branch.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_DB_URL`
      ];
    return branchDb || process.env.DEV_DB_URL || null;
  }

  // Default to DEV
  return process.env.DEV_DB_URL || null;
}
```

## Support

If you encounter issues:

1. Check Netlify function logs
2. Review this documentation
3. Check Drizzle migration docs: https://orm.drizzle.team/docs/migrations
4. Open an issue in the repo

---

**Last Updated**: December 7, 2024  
**Maintained By**: Engineering Team
