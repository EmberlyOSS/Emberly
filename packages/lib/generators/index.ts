/**
 * ID and code generation utilities
 * Centralizes all random ID/code generation to ensure consistency
 */

import { nanoid } from 'nanoid'

const URL_ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const SHORT_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/**
 * Generate a 5-character URL ID for user profiles
 * Uses URL-safe alphabet (excludes 0, 1, O, I)
 * Complies with regex: /^[A-Za-z0-9]{5}$/
 */
export function generateUrlId(): string {
  return Array.from({ length: 5 }, () =>
    URL_ID_ALPHABET.charAt(Math.floor(Math.random() * URL_ID_ALPHABET.length))
  ).join('')
}

/**
 * Generate a short code for URL shortening
 * Uses nanoid for uniqueness and performance
 * Default length: 7 characters
 */
export function generateShortCode(length = 7): string {
  return nanoid(length)
}

/**
 * Generate a unique request ID for logging and tracing
 * Format: 'req_' + random string
 * Useful for correlating logs across multiple services
 */
export function generateRequestId(): string {
  return `req_${nanoid(16)}`
}

/**
 * Generate a unique upload session ID for multipart uploads
 * Format: 'upload_' + random string
 */
export function generateUploadId(): string {
  return `upload_${nanoid(16)}`
}

/**
 * Generate a verification code for email verification, password reset, etc.
 * Format: 6-digit numeric code (for better user experience)
 */
export function generateVerificationCode(): string {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 10).toString()
  ).join('')
}

/**
 * Generate a secure token for magic links, password reset tokens, etc.
 * Uses nanoid with longer length for cryptographic strength
 */
export function generateSecureToken(length = 32): string {
  return nanoid(length)
}
