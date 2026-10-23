/**
 * Comprehensive Password Validation
 * 
 * Validates passwords against:
 * - HaveIBeenPwned breach database
 * - User's password history (reuse prevention)
 * - Basic requirements (length, complexity)
 */

import { checkPasswordBreach, getBreachWarningMessage } from './password-breach-checker'
import { checkPasswordReuse } from './password-reuse-checker'
import { getPasswordReuseMessage, getPasswordStrength } from './password-utils'

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate password against all security checks
 * Returns both blocking errors and non-blocking warnings
 * 
 * @param password - The password to validate
 * @param userId - Optional: User ID to check reuse history
 * @param minLength - Minimum password length (default: 8)
 * @returns Object with valid flag, errors, and warnings
 */
export async function validatePassword(
  password: string,
  userId?: string,
  minLength: number = 8
): Promise<PasswordValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic length check
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`)
  }

  if (password.length > 128) {
    errors.push('Password must be at most 128 characters long')
  }

  // If there are basic errors, return early
  if (errors.length > 0) {
    return { valid: false, errors, warnings }
  }

  // Check HaveIBeenPwned (non-blocking)
  const breachResult = await checkPasswordBreach(password)
  if (breachResult.isCompromised) {
    warnings.push(
      `⚠️ Password Breach: ${getBreachWarningMessage(breachResult.occurrences)}. We recommend using a unique password.`
    )
  }

  // Check password reuse history (blocking if userId provided)
  if (userId) {
    const reuseResult = await checkPasswordReuse(userId, password)
    if (reuseResult.isReused) {
      errors.push(getPasswordReuseMessage(5))
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// Re-export from password-utils for convenience
export { getPasswordStrength } from './password-utils'
