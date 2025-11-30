import * as Sentry from "@sentry/nextjs";

// Only initialize if SENTRY_DSN is provided
// Use process.env directly to avoid circular dependency with env.ts during instrumentation
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
const appEnv = process.env.NEXT_PUBLIC_APP_ENV || "LOCAL";

console.log(
  "[Sentry Client] Initializing with DSN:",
  sentryDsn ? "Present" : "Missing",
  "Environment:",
  appEnv
);

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    environment: appEnv,

    // Link errors to releases for sourcemap resolution
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    replaysOnErrorSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      // Note: replayIntegration is only available in browser, not during SSR
      ...(typeof window !== "undefined" && Sentry.replayIntegration
        ? [
            Sentry.replayIntegration({
              // Additional Replay configuration goes in here, for example:
              maskAllText: true,
              blockAllMedia: true,
            }),
          ]
        : []),
    ],
  });
}
