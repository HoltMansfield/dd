/**
 * Session timeout configuration for SOC2 compliance
 *
 * Requirements:
 * - Automatic session timeout after period of inactivity
 * - Warning before session expires
 * - Activity tracking to extend sessions
 */

// Session timeout after 30 minutes of inactivity (SOC2 recommended)
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Warn user 2 minutes before session expires
export const SESSION_WARNING_MS = 2 * 60 * 1000; // 2 minutes

// Maximum session duration (absolute timeout, regardless of activity)
export const MAX_SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

// Cookie name for session timestamp
export const SESSION_TIMESTAMP_COOKIE = "session_timestamp";

// Cookie name for session creation time
export const SESSION_CREATED_COOKIE = "session_created";
