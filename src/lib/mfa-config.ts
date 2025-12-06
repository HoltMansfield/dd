/**
 * MFA Configuration
 * Controls MFA behavior based on environment
 */

/**
 * Check if MFA should be enforced for document access
 * In PRODUCTION and QA environments, MFA is required for accessing documents
 */
export function shouldEnforceMFA(): boolean {
  const env = process.env.NEXT_PUBLIC_APP_ENV;
  return env === "PRODUCTION" || env === "QA";
}

/**
 * Check if MFA enforcement should be applied to document routes
 * Returns true if the current environment requires MFA for document access
 */
export function shouldEnforceMFAForDocuments(): boolean {
  return shouldEnforceMFA();
}

/**
 * Check if MFA is available for setup
 * MFA is available in all environments
 */
export function isMFAAvailable(): boolean {
  return true;
}

/**
 * Get MFA enforcement message for UI
 */
export function getMFAEnforcementMessage(): string {
  const env = process.env.NEXT_PUBLIC_APP_ENV;
  if (env === "PRODUCTION" || env === "QA") {
    return "Multi-factor authentication is required to access documents.";
  }
  return "Multi-factor authentication is optional.";
}
