import * as Sentry from "@sentry/nextjs";

// Only initialize if SENTRY_DSN is provided
// Use process.env directly in edge runtime to avoid env validation issues
const sentryDsn = process.env.SENTRY_DSN;
const appEnv = process.env.NEXT_PUBLIC_APP_ENV || "LOCAL";

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    environment: appEnv,

    // Link errors to releases for sourcemap resolution
    release: process.env.SENTRY_RELEASE,
  });
}
