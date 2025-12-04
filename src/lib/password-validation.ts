/**
 * Password validation utility for SOC2 compliance
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */

export const PASSWORD_MIN_LENGTH = 12;

export interface PasswordRequirement {
  label: string;
  test: (pwd: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    label: "At least 12 characters",
    test: (password: string) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    label: "At least one uppercase letter",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    label: "At least one lowercase letter",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    label: "At least one number",
    test: (password: string) => /[0-9]/.test(password),
  },
  {
    label: "At least one special character (!@#$%^&*)",
    test: (password: string) =>
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  },
];

/**
 * Validates password against all requirements
 * @param password - The password to validate
 * @returns Object with isValid flag and array of failed requirements
 */
export function validatePassword(password: string): {
  isValid: boolean;
  failedRequirements: string[];
} {
  const failedRequirements = PASSWORD_REQUIREMENTS.filter(
    (req) => !req.test(password)
  ).map((req) => req.label);

  return {
    isValid: failedRequirements.length === 0,
    failedRequirements,
  };
}

/**
 * Gets a user-friendly error message for password validation
 * @param password - The password to validate
 * @returns Error message or null if valid
 */
export function getPasswordErrorMessage(password: string): string | null {
  const { isValid, failedRequirements } = validatePassword(password);

  if (isValid) {
    return null;
  }

  if (failedRequirements.length === 1) {
    return `Password must have: ${failedRequirements[0].toLowerCase()}`;
  }

  return `Password must have: ${failedRequirements.join(", ").toLowerCase()}`;
}
