const { execSync } = require("child_process");

// Only upload sourcemaps in production/preview builds (not local dev)
if (!process.env.SENTRY_AUTH_TOKEN) {
  console.log("Skipping Sentry sourcemap upload - SENTRY_AUTH_TOKEN not set");
  process.exit(0);
}

const SENTRY_ORG = "holt-mansfield-2h";
const SENTRY_PROJECT = "dd";

try {
  console.log("Installing Sentry CLI...");
  execSync("curl -sL https://sentry.io/get-cli/ | bash", { stdio: "inherit" });

  console.log("Creating Sentry release...");
  const release = execSync("sentry-cli releases propose-version")
    .toString()
    .trim();g

  execSync(
    `sentry-cli releases new "${release}" --org ${SENTRY_ORG} --project ${SENTRY_PROJECT}`,
    { stdio: "inherit" }
  );
  execSync(
    `sentry-cli releases set-commits "${release}" --auto --org ${SENTRY_ORG} --project ${SENTRY_PROJECT}`,
    { stdio: "inherit" }
  );

  console.log("Uploading sourcemaps...");
  execSync(
    `sentry-cli sourcemaps upload --release "${release}" --org ${SENTRY_ORG} --project ${SENTRY_PROJECT} --url-prefix "~/_next" .next/static`,
    { stdio: "inherit" }
  );

  console.log("Finalizing release...");
  execSync(
    `sentry-cli releases finalize "${release}" --org ${SENTRY_ORG} --project ${SENTRY_PROJECT}`,
    { stdio: "inherit" }
  );
  execSync(
    `sentry-cli releases deploys "${release}" new -e production --org ${SENTRY_ORG} --project ${SENTRY_PROJECT}`,
    { stdio: "inherit" }
  );

  console.log("✅ Sentry sourcemaps uploaded successfully!");
} catch (error) {
  console.error("❌ Failed to upload sourcemaps to Sentry:", error.message);
  // Don't fail the build if sourcemap upload fails
  process.exit(0);
}
