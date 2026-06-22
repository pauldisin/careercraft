/**
 * Password Policy Helper
 * Enforces strong password rules for CareerCraft users and administrators.
 */

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
  requirements: {
    minLength: number;
    hasUpper: boolean;
    hasLower: boolean;
    hasDigit: boolean;
    hasSpecial: boolean;
  };
}

/**
 * Validates a password against CareerCraft's policy.
 * @param password The raw password to validate.
 * @param isAdmin Whether to validate using the enhanced administrator rules.
 */
export function validatePassword(password: string, isAdmin = false): PasswordValidationResult {
  const minLength = isAdmin ? 12 : 8;
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const requirements = {
    minLength,
    hasUpper,
    hasLower,
    hasDigit,
    hasSpecial
  };

  if (password.length < minLength) {
    return {
      valid: false,
      message: `Password must be at least ${minLength} characters long.`,
      requirements
    };
  }

  if (isAdmin) {
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return {
        valid: false,
        message: "Administrator passwords require high-grade complexity: at least 1 uppercase letter, 1 lowercase letter, 1 numeric digit, and 1 special symbol.",
        requirements
      };
    }
  } else {
    // For regular users, require at least 3 of the 4 complexity pools
    const complexityScore = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
    if (complexityScore < 3) {
      return {
        valid: false,
        message: "Password is too simple. It must contain a mix of uppercase, lowercase letters, numbers, and special symbols (at least 3 of these categories).",
        requirements
      };
    }
  }

  return {
    valid: true,
    requirements
  };
}
