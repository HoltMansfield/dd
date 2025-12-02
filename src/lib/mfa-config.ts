/**
 * MFA Configuration
 * Controls MFA behavior based on environment
 */

/**
 * Check if MFA should be enforced
 * In PRODUCTION environment, MFA is always required
 */
export function shouldEnforceMFA(): boolean {
  const env = process.env.NEXT_PUBLIC_APP_ENV;
  return env === "PRODUCTION";
}

/**
 * Check if MFA is available for setup
 * MFA is optional in all environments but required in PRODUCTION
 */
export function isMFAAvailable(): boolean {
  return true;
}

/**
 * Get MFA enforcement message for UI
 */
export function getMFAEnforcementMessage(): string {
  const env = process.env.NEXT_PUBLIC_APP_ENV;
  if (env !== "PRODUCTION") {
    return "Multi-factor authentication is optional.";
  }
  return "Multi-factor authentication is required.";
}
