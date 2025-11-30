# Next.js Project Setup and Configuration

This document summarizes the Next.js-specific setup and configuration in this project.

## Core Framework and Runtime

- **Next.js (v15.3.1)**: React framework with server-side rendering capabilities
  - Using Turbopack for faster development builds
  - Leveraging React Server Components for data fetching
  - Using Server Actions for form submissions and mutations

## Project Structure

The project follows the Next.js App Router structure introduced in Next.js 13+:

- `src/app/`: Contains all pages and layouts using the file-based routing system
  - `layout.tsx`: Root layout that wraps all pages
  - `page.tsx`: Home page component
  - `providers.tsx`: Client-side providers wrapper
  - `globals.css`: Global styles
  - Feature-based folders (`login/`, `register/`) with their own page components

## Next.js Configuration

The project uses a TypeScript-based Next.js configuration (`next.config.ts`) with:

- Server source maps enabled for better debugging
- Comprehensive security headers:
  - Content Security Policy (CSP)
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
  - Strict-Transport-Security
  - Permissions-Policy

## App Router Implementation

- **Server Components**: The project leverages React Server Components extensively for data fetching
- **Server Actions**: Form submissions and mutations use server actions instead of API routes
- **Metadata API**: Used for setting page titles and descriptions
- **Font Optimization**: Uses Next.js font system with the Inter font

## Authentication Flow

- Custom cookie-based authentication using Next.js Cookies API
- Server-side redirect protection for authenticated routes
- Session management without relying on external auth providers

## Data Fetching

- Direct database queries in Server Components
- Server Actions for mutations following Next.js best practices
- No client-side API calls to separate endpoints

## Styling and UI

- Tailwind CSS integration with custom configuration
- Radix UI Theme Provider for consistent theming
- Component-based architecture with UI components in `/src/components`

## Development Setup

- Using Turbopack for faster development builds (`next dev --turbopack`)
- TypeScript for type safety throughout the application
- ESLint configured with Next.js recommended settings

## Environment Configuration

- Environment variables managed through `.env.local` for development
- Separate environment configuration for E2E testing (`.env.e2e`)
- Proper handling of server-only environment variables

## Performance Optimizations

- Font optimization with `next/font`
- Server Components to reduce client-side JavaScript
- Proper code splitting through the App Router's built-in capabilities

## Deployment Configuration

The application is configured for deployment to standard Node.js hosting environments with:

- Production build script (`next build`)
- Start script for production server (`next start`)

## Testing Integration

- E2E testing with Playwright
- Separate test environment configuration
- Test-specific database setup

This Next.js implementation follows modern best practices, leveraging the latest features of Next.js 15 while maintaining a clean, organized project structure.
