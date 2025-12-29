/**
 * HaveIBeenPwned (HIBP) Password Breach Checker
 * 
 * Uses the k-anonymity API to check if a password has been compromised
 * Privacy-friendly: only sends first 5 characters of SHA-1 hash
 * 
 * Free API: https://haveibeenpwned.com/API/v3
 */

import { createHash } from 'crypto'

export interface PasswordBreachResult {
  isCompromised: boolean
  occurrences: number
  error?: string
}

/**
 * Check if a password has been compromised using HaveIBeenPwned API
 * Uses k-anonymity approach - only sends hash prefix to HIBP
 * 
 * @param password - The password to check
 * @returns Object with isCompromised flag and occurrence count
 */
export async function checkPasswordBreach(password: string): Promise<PasswordBreachResult> {
  try {
    // Calculate SHA-1 hash of password
    const hash = createHash('sha1').update(password).digest('hex').toUpperCase()
    
    // Take first 5 characters of hash (k-anonymity approach)
    const hashPrefix = hash.substring(0, 5)
    const hashSuffix = hash.substring(5)

    // Query HIBP API with prefix
    // Rate limit: 1 request per 1500ms (built-in delay recommended)
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${hashPrefix}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Emberly-Security-Check', // HIBP requires a User-Agent
        },
      }
    )

    if (!response.ok) {
      // If HIBP is down, don't block login - just skip the check
      if (response.status === 503) {
        return {
          isCompromised: false,
          occurrences: 0,
          error: 'Service temporarily unavailable',
        }
      }
      throw new Error(`HIBP API error: ${response.statusText}`)
    }

    // Parse response - it's a list of hash suffixes and counts
    const data = await response.text()
    const lines = data.split('\r\n')

    // Check if our hash suffix appears in the response
    for (const line of lines) {
      const [suffix, count] = line.split(':')
      if (suffix === hashSuffix) {
        // Password is compromised!
        return {
          isCompromised: true,
          occurrences: parseInt(count, 10),
        }
      }
    }

    // Password not found in breach database
    return {
      isCompromised: false,
      occurrences: 0,
    }
  } catch (error) {
    console.error('Password breach check failed:', error)
    // Don't block login if check fails - just log it
    return {
      isCompromised: false,
      occurrences: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get a human-readable message about password compromise
 */
export function getBreachWarningMessage(occurrences: number): string {
  if (occurrences === 0) {
    return 'This password has been found in data breaches'
  }
  if (occurrences === 1) {
    return 'This password has been found in 1 data breach'
  }
  if (occurrences < 10) {
    return `This password has been found in ${occurrences} data breaches`
  }
  return `This password has been found in ${occurrences}+ data breaches`
}
