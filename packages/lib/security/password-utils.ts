/**
 * Password Strength and Messaging Utilities
 * 
 * Client-safe utilities that don't require Prisma or server access
 * These can be imported from client components
 */

/**
 * Quick strength indicator for password
 */
export function getPasswordStrength(password: string): 'weak' | 'fair' | 'good' | 'strong' {
  let strength = 0

  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (password.length >= 16) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++

  if (strength <= 2) return 'weak'
  if (strength <= 3) return 'fair'
  if (strength <= 4) return 'good'
  return 'strong'
}

/**
 * Get a human-readable message about password reuse
 */
export function getPasswordReuseMessage(checkCount: number): string {
  if (checkCount === 1) {
    return 'You cannot use a password from your last 1 password change'
  }
  return `You cannot use a password from your last ${checkCount} password changes`
}
