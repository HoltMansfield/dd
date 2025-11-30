# NPM Scripts Documentation

## Next.js Development and Production

These scripts handle the core Next.js application lifecycle:

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts the development server using Turbopack for faster builds (`next dev --turbopack`) |
| `npm run build` | Creates a production build of the application (`next build`) |
| `npm run start` | Starts the production server using the built application (`next start`) |
| `npm run lint` | Runs ESLint to check for code quality issues (`next lint`) |

## Database Management (Development)

These scripts manage the database schema and migrations for the development environment:

| Script | Description |
|--------|-------------|
| `npm run generate` | Generates SQL migrations based on schema changes (`dotenv -e .env.local -- drizzle-kit generate`) |
| `npm run migrate` | Applies pending migrations to the database (`dotenv -e .env.local -- drizzle-kit migrate`) |
| `npm run push` | Pushes schema changes directly to the database without migrations (`dotenv -e .env.local -- drizzle-kit push`) |
| `npm run pull` | Pulls the database schema into your Drizzle schema (`dotenv -e .env.local -- drizzle-kit pull`) |
| `npm run check` | Checks for drift between your schema and migrations (`dotenv -e .env.local -- drizzle-kit check`) |
| `npm run up` | Updates the database schema to match your code (`dotenv -e .env.local -- drizzle-kit up`) |
| `npm run studio` | Opens Drizzle Studio for visual database management (`dotenv -e .env.local -- drizzle-kit studio`) |

## End-to-End Testing

These scripts manage the end-to-end testing environment and test execution:

| Script | Description |
|--------|-------------|
| `npm run test:e2e` | Main E2E testing script that runs the complete test suite with database setup |
| `npm run db:create-schema` | Creates the E2E database schema by running generate and migrate scripts |
| `npm run _test:e2e:with-app` | Internal script that runs the app and tests in parallel |
| `npm run start:e2e-db` | Starts a PostgreSQL Docker container for E2E testing |
| `npm run stop:e2e-db` | Stops the PostgreSQL Docker container after testing |
| `npm run e2e:generate` | Generates Drizzle migrations for the E2E database |
| `npm run e2e:migrate` | Applies migrations to the E2E database |
| `npm run build:e2e` | Builds the Next.js app for E2E testing |
| `npm run e2e:start` | Starts the Next.js app for E2E testing on port 3001 |
| `npm run e2e:test` | Runs all Playwright tests after the app is ready |
| `npm run e2e:test:anonymous` | Runs only anonymous user Playwright tests |
| `npm run e2e:test:logged-in` | Runs only logged-in user Playwright tests |

## Script Dependencies and Flow

The scripts use several utility packages to manage their execution:

- **npm-run-all**: Used for running multiple scripts in sequence (`run-s`) or parallel (`run-p`)
- **dotenv-cli**: Used to load environment variables from specific files
- **wait-on**: Used to wait for the test server to be ready before running tests

### Main Testing Flow

The main E2E testing flow (`npm run test:e2e`) executes these steps in sequence:

1. Start the E2E database container (`start:e2e-db`)
2. Create the database schema (`db:create-schema`)
   - Generate migrations (`e2e:generate`)
   - Apply migrations (`e2e:migrate`)
3. Build the application for testing (`build:e2e`)
4. Run the tests with the app (`_test:e2e:with-app`)
   - Start the application (`e2e:start`)
   - Run the tests in parallel (`e2e:test`)
5. Stop the database container (`stop:e2e-db`)

## Environment Variables

The scripts use different environment files for different contexts:

- `.env.local`: Used for development environment scripts
- `.env.e2e`: Used for E2E testing environment scripts

## Notes

- The E2E database setup uses a PostgreSQL Docker container running on port 5433 to avoid conflicts with any local PostgreSQL installation
- The E2E tests are divided into two projects: "anonymous" and "logged-in" to test different user states
- All database scripts use Drizzle Kit for schema management and migrations
