/**
 * Session timeout configuration for SOC2 compliance
 *
 * Requirements:
 * - Automatic session timeout after period of inactivity
 * - Warning before session expires
 * - Activity tracking to extend sessions
 *
 * Note: In non-production environments, timeouts are extended to 3 days
 * for developer convenience while maintaining SOC2 compliance in production.
 */

const isProduction = process.env.NODE_ENV === "production";

// Session timeout after inactivity
// Production: 30 minutes (SOC2 recommended)
// Development: 3 days (developer convenience)
export const SESSION_TIMEOUT_MS = isProduction
  ? 30 * 60 * 1000 // 30 minutes
  : 3 * 24 * 60 * 60 * 1000; // 3 days

// Warn user before session expires
// Production: 2 minutes before
// Development: 5 minutes before
export const SESSION_WARNING_MS = isProduction
  ? 2 * 60 * 1000 // 2 minutes
  : 5 * 60 * 1000; // 5 minutes

// Maximum session duration (absolute timeout, regardless of activity)
// Production: 12 hours
// Development: 7 days
export const MAX_SESSION_DURATION_MS = isProduction
  ? 12 * 60 * 60 * 1000 // 12 hours
  : 7 * 24 * 60 * 60 * 1000; // 7 days

// Cookie name for session timestamp
export const SESSION_TIMESTAMP_COOKIE = "session_timestamp";

// Cookie name for session creation time
export const SESSION_CREATED_COOKIE = "session_created";
