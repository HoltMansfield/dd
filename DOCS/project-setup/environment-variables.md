# Environment Variables Documentation

## Environment Files

The project uses different environment files for different contexts:

| File         | Purpose                                                      |
| ------------ | ------------------------------------------------------------ |
| `.env.local` | Development environment configuration (not committed to Git) |
| `.env.e2e`   | End-to-end testing environment configuration                 |

## Core Environment Variables

### Application Environment

| Variable                | Description                                | Used In                                                          |
| ----------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_ENV`   | Determines the current runtime environment | Database connection selection, conditional logic for E2E testing |

Possible values:

- `LOCAL` - Development environment
- `E2E` - End-to-end testing environment

### Database Configuration

| Variable          | Description                       | Used In                                        |
| ----------------- | --------------------------------- | ---------------------------------------------- |
| `DB_URL`          | Database connection string        | Database connection, Drizzle ORM configuration |
| `MIGRATIONS_PATH` | Path to store database migrations | Drizzle ORM configuration                      |

### Email Service

| Variable         | Description                          | Used In                     |
| ---------------- | ------------------------------------ | --------------------------- |
| `RESEND_API_KEY` | API key for the Resend email service | Email sending functionality |

### Error Tracking

| Variable            | Description                             | Used In                       |
| ------------------- | --------------------------------------- | ----------------------------- |
| `HIGHLIGHT_API_KEY` | API key for Highlight.io error tracking | Error tracking and monitoring |

### Testing

| Variable  | Description                                          | Used In                  |
| --------- | ---------------------------------------------------- | ------------------------ |
| `E2E_URL` | Base URL for E2E tests (e.g., http://localhost:3001) | Playwright configuration |

## Usage in Code

### Database Connection Selection

The application uses different database connections based on the `NEXT_PUBLIC_APP_ENV` value:

```typescript
// In src/db/connect.ts
if (env.NEXT_PUBLIC_APP_ENV === "E2E") {
  // Use E2E database connection
} else {
  // Use web database connection
}
```

### Email Service Configuration

Email functionality is conditionally enabled based on the environment:

```typescript
// In src/app/register/actions.ts
if (env.NEXT_PUBLIC_APP_ENV !== "E2E") {
  // Send real emails in non-E2E environments
}
```

### Drizzle ORM Configuration

The Drizzle ORM uses environment variables for database connections and migration paths:

```typescript
// In drizzle.config.ts
export default {
  schema: "./src/db/schema.ts",
  out: process.env.MIGRATIONS_PATH,
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_URL ?? "",
  },
} satisfies Config;
```

### Playwright Testing Configuration

Playwright uses the `E2E_URL` environment variable to determine the base URL for tests:

```typescript
// In playwright.config.ts
export default defineConfig({
  use: {
    baseURL: process.env.E2E_URL,
    // ...
  },
  // ...
});
```

## Environment Variable Loading

- For development: Variables are loaded from `.env.local`
- For E2E testing: Variables are loaded from `.env.e2e` using `dotenv-cli`
- In GitHub Actions: Variables are injected from GitHub Secrets
