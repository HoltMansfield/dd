/**
 * MFA Configuration
 * Controls MFA behavior based on environment
 */

/**
 * Check if MFA should be enforced
 * In LOCAL environment, MFA is always optional
 */
export function shouldEnforceMFA(): boolean {
  const env = process.env.NEXT_PUBLIC_APP_ENV;
  return env !== "LOCAL";
}

/**
 * Check if MFA is available for setup
 * MFA is available in all environments but optional in LOCAL
 */
export function isMFAAvailable(): boolean {
  return true;
}

/**
 * Get MFA enforcement message for UI
 */
export function getMFAEnforcementMessage(): string {
  const env = process.env.NEXT_PUBLIC_APP_ENV;
  if (env === "LOCAL") {
    return "Multi-factor authentication is optional in development mode.";
  }
  return "Multi-factor authentication is recommended for enhanced security.";
}
