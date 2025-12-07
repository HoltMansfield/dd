import { Handler } from "@netlify/functions";
import { execSync } from "child_process";
import crypto from "crypto";

/**
 * Netlify Function to run database migrations after successful deploys
 *
 * Triggered by Netlify Deploy Notification webhook
 *
 * Setup:
 * 1. In Netlify UI: Site Settings → Build & Deploy → Deploy notifications
 * 2. Add notification → Outgoing webhook
 * 3. Event: "Deploy succeeded"
 * 4. URL: https://your-site.netlify.app/.netlify/functions/run-migration
 * 5. Add WEBHOOK_SECRET to environment variables
 *
 * Environment Variables Required:
 * - WEBHOOK_SECRET: Secret for verifying webhook signatures
 * - DB_URL: Database connection string (set different values per deploy context in Netlify UI)
 */

interface NetlifyDeployWebhook {
  id: string;
  site_id: string;
  build_id: string;
  state: string; // 'ready', 'building', 'error'
  name: string;
  url: string;
  ssl_url: string;
  admin_url: string;
  deploy_url: string;
  deploy_ssl_url: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  error_message?: string;
  required: string[];
  required_functions: string[];
  commit_ref: string;
  review_id?: number;
  branch: string;
  commit_url: string;
  skipped?: boolean;
  locked?: boolean;
  log_access_attributes: {
    type: string;
    url: string;
    endpoint: string;
    path: string;
    token: string;
  };
  title: string;
  commit_message: string;
  review_url?: string;
  published_at: string;
  context: "production" | "deploy-preview" | "branch-deploy";
  deploy_time: number;
  available_functions: Array<{
    n: string;
    d: string;
    id: string;
    sha: string;
  }>;
  screenshot_url?: string;
  site_capabilities: {
    title: string;
    asset_acceleration: boolean;
    form_processing: boolean;
    cdn_propagation: string;
    build_node_pool: string;
    domain_aliases: boolean;
    secure_site: boolean;
    prerendering: boolean;
    proxying: boolean;
    ssl: string;
    rate_cents: number;
    yearly_rate_cents: number;
    ipv6_domain: string;
    branch_deploy: boolean;
    managed_dns: boolean;
    geo_ip: boolean;
    split_testing: boolean;
    id: string;
    cdn_tier: string;
  };
  committer: string;
}

/**
 * Verify webhook signature from Netlify
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature) {
    console.error("No signature provided");
    return false;
  }

  // Netlify uses HMAC SHA256
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Get database URL from environment
 *
 * Note: Netlify automatically provides the correct DB_URL based on deploy context.
 * You configure different values for the same variable in Netlify UI:
 * - DB_URL (Production) = your production database
 * - DB_URL (Deploy Previews) = your dev database
 * - DB_URL (Branch: qa) = your QA database
 *
 * The function automatically gets the right value!
 */
function getDatabaseUrl(): string | null {
  return process.env.DB_URL || null;
}

/**
 * Send alert notification (implement based on your needs)
 */
async function sendAlert(
  type: "success" | "error",
  context: string,
  branch: string,
  message: string
) {
  console.log(`[ALERT] ${type.toUpperCase()}: ${message}`);

  // TODO: Implement alerting
  // Options:
  // - Email via SendGrid/AWS SES
  // - Slack webhook
  // - PagerDuty
  // - Sentry

  // Example Slack webhook:
  // if (process.env.SLACK_WEBHOOK_URL) {
  //   await fetch(process.env.SLACK_WEBHOOK_URL, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       text: `Migration ${type}: ${context} (${branch})\n${message}`
  //     })
  //   });
  // }
}

export const handler: Handler = async (event) => {
  console.log("Migration webhook triggered");

  // Only accept POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Verify webhook signature for security
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("WEBHOOK_SECRET not configured");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Webhook secret not configured" }),
    };
  }

  const signature = event.headers["x-netlify-signature"];
  const payload = event.body || "";

  if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
    console.error("Invalid webhook signature");
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid signature" }),
    };
  }

  // Parse webhook payload
  let webhookData: NetlifyDeployWebhook;
  try {
    webhookData = JSON.parse(payload);
  } catch (error) {
    console.error("Failed to parse webhook payload:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON payload" }),
    };
  }

  const { state, context, branch, commit_message, deploy_url } = webhookData;

  console.log(`Deploy webhook received:`, {
    state,
    context,
    branch,
    commit_message,
  });

  // Only run migrations on successful deploys
  if (state !== "ready") {
    console.log(`Deploy state is "${state}", skipping migration`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Deploy not ready, skipping migration",
        state,
      }),
    };
  }

  // Get database URL (Netlify provides the correct one based on deploy context)
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    const error = `DB_URL not configured for context: ${context}, branch: ${branch}`;
    console.error(error);
    await sendAlert("error", context, branch, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }

  // Run migrations
  try {
    console.log(`Running migrations for ${context} (${branch})...`);
    console.log(`Deploy URL: ${deploy_url}`);

    const startTime = Date.now();

    // Execute migration command
    const output = execSync("npx drizzle-kit migrate", {
      encoding: "utf-8",
      env: {
        ...process.env,
        DB_URL: dbUrl,
        MIGRATIONS_PATH: "./drizzle/migrations",
      },
    });

    const duration = Date.now() - startTime;

    console.log("Migration output:", output);
    console.log(`✅ Migrations completed in ${duration}ms`);

    await sendAlert(
      "success",
      context,
      branch,
      `Migrations completed successfully in ${duration}ms\nCommit: ${commit_message}`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        context,
        branch,
        duration,
        message: "Migrations applied successfully",
        deploy_url,
      }),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Migration failed:", errorMessage);

    await sendAlert(
      "error",
      context,
      branch,
      `Migration failed: ${errorMessage}\nCommit: ${commit_message}`
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        context,
        branch,
        deploy_url,
      }),
    };
  }
};
