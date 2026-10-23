'use server'

/**
 * Server Actions: Password Validation
 * 
 * Called from client-side components to validate passwords securely
 * Checks against HaveIBeenPwned and password history
 * 
 * All exported functions must be async due to 'use server' directive
 */

import { validatePassword as performValidation } from './password-validation'
import { getPasswordStrength as getStrengthFn } from './password-utils'

export async function validatePasswordAction(password: string, userId?: string) {
  return performValidation(password, userId)
}

export async function getPasswordStrengthAction(password: string) {
  // Wrapper to make sync function callable from client via server action
  return getStrengthFn(password)
}
