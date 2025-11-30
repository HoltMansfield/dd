### 1. Playwright E2E Tests (`playwright.yml`)

**Trigger Events:**

- Push to main/master branches
- Pull requests to main/master branches

**Key Steps:**

- Runs the E2E test suite using `npm run test:e2e`
- Uploads test reports as artifacts for later review

**Environment Variables:**

- Uses the `e2e` environment in GitHub for secrets
- Sets up required environment variables

### 2. Next.js Build Verification (`build.yml`)

This workflow ensures that the Next.js application builds successfully.
Fails if the build process encounters any errors (including TypeScript and linting errors)

**Trigger Events:**

- Push to main/master branches
- Pull requests to main/master branches

### 3. Dependency Audit (`audit.yml`)

This workflow checks for security vulnerabilities in dependencies.

**Trigger Events:**

- Pull requests to main/master branches

**Key Steps:**

- Runs npm audit with a threshold set to high severity
- Fails if any high or critical severity vulnerabilities are found

### 4. Sentry Sourcemaps Upload (`sentry-sourcemaps.yml`)

This workflow uploads sourcemaps to Sentry for better error tracking.

**Trigger Events:**

- Push to main branch
- Manual trigger via workflow_dispatch

**Key Steps:**

- Uploads sourcemaps to Sentry using their CLI
- Uses the `SENTRY_AUTH_TOKEN` secret for authentication

## Environment Setup

The workflows use GitHub Environments and Secrets for managing sensitive information:

- The `e2e` environment contains secrets needed for E2E testing
- Secrets are injected into the workflow at runtime
- Environment variables are properly secured and not exposed in logs

## Best Practices Implemented

- Caching of dependencies and browsers to speed up workflow runs
- Proper secret management using GitHub Environments
- Artifact retention for test reports (30 days)
- Using LTS versions of Node.js for stability
- Clean separation of concerns between different workflows
