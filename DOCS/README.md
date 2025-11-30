# Next.js Seed Project

A production-ready Next.js seed project with authentication, database integration, error monitoring, and comprehensive E2E testing.

## Features

- **Next.js 15** with App Router and React Server Components
- **Authentication** - Complete user registration and login system with email verification
- **Database** - PostgreSQL with Drizzle ORM and migrations
- **Styling** - Tailwind CSS with Radix UI components
- **Email** - Transactional emails via Resend
- **Error Monitoring** - Sentry integration for production error tracking
- **E2E Testing** - Playwright tests with Docker-based test database
- **CI/CD** - GitHub Actions workflows for automated testing and deployment
- **Type Safety** - Full TypeScript support throughout

## Tech Stack

- **Framework**: Next.js 15 with Turbopack
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Styling**: Tailwind CSS + Radix UI
- **Authentication**: Custom bcrypt-based auth
- **Email**: Resend + React Email
- **Testing**: Playwright for E2E tests
- **Monitoring**: Sentry
- **Deployment**: Netlify

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (recommend [Neon](https://neon.tech/))
- Docker (for E2E tests)

### Installation

1. Clone and install dependencies:

   ```bash
   git clone <your-repo-url>
   cd <project-name>
   npm install
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your values:

   ```
   NEXT_PUBLIC_APP_ENV=LOCAL
   DB_URL=postgresql://[your-connection-string]
   RESEND_API_KEY=your_resend_api_key
   SENTRY_DSN=your_sentry_dsn
   MIGRATIONS_PATH=./drizzle/migrations
   ```

3. Run database migrations:

   ```bash
   npm run generate
   npm run migrate
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test:e2e` - Run full E2E test suite
- `npm run studio` - Open Drizzle Studio for database management

See [npm-scripts.md](./project-setup/npm-scripts.md) for complete script documentation.

## Documentation

Comprehensive documentation is available in the `/DOCS` directory:

- **[Using as Seed Project](./project-setup/using-as-seed-project.md)** - Complete guide to using this as a starter
- **[NPM Scripts](./project-setup/npm-scripts.md)** - All available scripts and their usage
- **[Environment Variables](./project-setup/environment-variables.md)** - Required environment configuration
- **[GitHub Actions](./project-setup/github-actions.md)** - CI/CD setup and configuration
- **[Third-Party Services](./project-setup/third-party.md)** - External service integrations
- **[Next.js Configuration](./project-setup/next.js.md)** - Framework-specific setup
- **[Drizzle ORM](./drizzle.md)** - Database schema and migrations
- **[Docker](./docker.md)** - Container setup for E2E tests

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── db/              # Database schema and client
│   ├── actions/         # Server actions
│   └── react-email/     # Email templates
├── e2e-tests/           # Playwright E2E tests
├── drizzle/             # Database migrations
├── scripts/             # Build and utility scripts
├── DOCS/                # Project documentation
└── public/              # Static assets
```

## Testing

### E2E Tests

Run the complete E2E test suite:

```bash
npm run test:e2e
```

This will:

1. Start a Docker PostgreSQL container
2. Run migrations
3. Build the app
4. Execute Playwright tests
5. Clean up the test database

Test results are saved to `e2e-test-runs/` directory.

## Deployment

This project is configured for deployment on Netlify. See the [deployment guide](./project-setup/using-as-seed-project.md#step-7-deploy-to-netlify) for detailed instructions.

## Using as a Seed Project

To use this as a starting point for your own project, follow the comprehensive guide in [Using as Seed Project](./project-setup/using-as-seed-project.md).

## License

MIT
