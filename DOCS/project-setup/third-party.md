# Third-Party Services

Overview of all third-party services and libraries integrated into this application.

## Database and ORM

- **Neon Database**: Serverless PostgreSQL database service
  - Connected via `@neondatabase/serverless` for the web environment
  - Uses connection pooling for efficient database connections

- **Drizzle ORM (v0.43.1)**: TypeScript ORM for SQL databases
  - Used for database schema definition, migrations, and queries
  - `drizzle-kit` for migrations, schema generation, and database management
  - Separate configurations for web and E2E testing environments

- **PostgreSQL**: Used as the database engine
  - `pg` package for Node.js PostgreSQL client in E2E testing

## Authentication

- **bcryptjs (v3.0.2)**: Library for password hashing and verification
  - Used for secure password storage and validation
  - Implements account lockout functionality after failed login attempts

- **Custom Cookie-based Authentication**: 
  - Uses Next.js cookies API for session management
  - No JWT or third-party auth provider dependency

## UI Framework and Components

- **Tailwind CSS (v4)**: Utility-first CSS framework
  - Used for responsive design and styling
  - `tailwind-merge` for combining Tailwind classes

- **Radix UI**: Unstyled, accessible UI components
  - `@radix-ui/react-slot` for component composition
  - `@radix-ui/themes` for theming capabilities

- **Lucide React**: Icon library

- **class-variance-authority**: For creating variant-based components

## Form Handling

- **React Hook Form (v7.56.4)**: Form state management and validation
  - Used for all form interactions in the application
  - `@hookform/resolvers` for schema validation integration

- **Yup (v1.6.1)**: Schema validation library
  - Used for form validation rules

## Email Services

- **Resend**: Email delivery service
  - Used for sending transactional emails
  - Integrated with React Email components

- **React Email (v0.0.41)**: Components for building emails
  - Used for creating email templates

## Monitoring and Error Tracking

- **Highlight (v7.9.23)**: Error tracking and monitoring service
  - `@highlight-run/next` for Next.js integration
  - `@highlight-run/node` for server-side error tracking
  - Custom error wrapper (`withHighlightError`) for server actions

## Testing

- **Playwright (v1.52.0)**: End-to-end testing framework
  - Configured for both anonymous and logged-in user flows
  - Separate E2E database configuration

- **Docker**: Used for E2E testing database
  - Provides isolated PostgreSQL instance for tests

## Development Tools

- **TypeScript (v5.8.3)**: Static type checking

- **ESLint (v9)**: Code linting
  - With Next.js and accessibility plugins

- **dotenv**: Environment variable management
  - Separate configurations for development and E2E testing

## Utilities

- **uuid (v11.1.0)**: For generating unique identifiers

- **npm-run-all**: For running multiple npm scripts

- **wait-on**: For waiting on resources to be available

## Deployment

The application is configured for deployment to standard Node.js hosting environments that support Next.js applications.
