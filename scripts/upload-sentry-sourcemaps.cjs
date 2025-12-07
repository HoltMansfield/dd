// Upload Sentry sourcemaps using @sentry/cli package

// Only upload sourcemaps in production/preview builds (not local dev)
const release =
  process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_SENTRY_RELEASE;

if (!release) {
  console.log("No SENTRY_RELEASE found; skipping sourcemap upload.");
  process.exit(0);
}

if (!process.env.SENTRY_AUTH_TOKEN) {
  console.log("Skipping Sentry sourcemap upload - SENTRY_AUTH_TOKEN not set");
  process.exit(0);
}

const SENTRY_ORG = "holt-mansfield-2h";
const SENTRY_PROJECT = "dd";

async function upload() {
  try {
    // Use the installed @sentry/cli package instead of curling the installer
    const SentryCli = require("@sentry/cli");
    const cli = new SentryCli({ authToken: process.env.SENTRY_AUTH_TOKEN });

    console.log(`Creating Sentry release: ${release}`);

    await cli.releases.new(release, {
      org: SENTRY_ORG,
      project: SENTRY_PROJECT,
    });

    console.log("Setting commits...");
    await cli.releases.setCommits(release, {
      auto: true,
      org: SENTRY_ORG,
      project: SENTRY_PROJECT,
    });

    console.log("Uploading sourcemaps...");
    await cli.releases.uploadSourceMaps(release, {
      include: [".next/static"],
      urlPrefix: "~/_next",
      validate: true,
      org: SENTRY_ORG,
      project: SENTRY_PROJECT,
    });

    console.log("Finalizing release...");
    await cli.releases.finalize(release, {
      org: SENTRY_ORG,
      project: SENTRY_PROJECT,
    });

    await cli.releases.newDeploy(release, {
      env: "production",
      org: SENTRY_ORG,
      project: SENTRY_PROJECT,
    });

    console.log("✅ Sentry sourcemaps uploaded successfully!");
  } catch (error) {
    console.error("❌ Failed to upload sourcemaps to Sentry:", error.message);
    // Don't fail the build if sourcemap upload fails
    process.exit(0);
  }
}

// Run the upload
upload();
