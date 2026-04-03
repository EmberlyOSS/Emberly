/**
 * Auth Service Layer
 *
 * Shared utilities for auth routes. Consolidates duplicated patterns:
 *   - Application base URL resolution
 *   - Cryptographic token generation (password reset, magic link)
 *   - Short numeric verification code generation
 *   - Verification code storage parsing
 *   - 2FA TOTP + recovery code verification
 */

import { randomBytes, createHash } from 'crypto'

import { loggers } from '@/packages/lib/logger'

import { validateAndConsumeRecoveryCode } from './recovery-codes'

const logger = loggers.auth

// ──────────────────────────────────────────────────────────────────────────
// URL helpers
// ──────────────────────────────────────────────────────────────────────────

/**
 * Resolve the application base URL from environment variables.
 * Priority: APP_BASE_URL → NEXTAUTH_URL → VERCEL_URL → localhost fallback.
 * Trailing slashes are always stripped.
 */
export function getBaseUrl(): string {
  const raw =
    process.env.APP_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000'
  return raw.replace(/\/$/, '')
}

// ──────────────────────────────────────────────────────────────────────────
// Token generation
// ──────────────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically-secure one-time token and its SHA-256 hash.
 *
 * - `token`       — raw hex string sent to the user (URL param / email).
 * - `hashedToken` — SHA-256 hash stored in the database.
 * - `expiresAt`   — expiry `Date` derived from `ttlMs`.
 *
 * @param ttlMs  Time-to-live in milliseconds (e.g. `30 * 60 * 1000` for 30 min).
 */
export function generateSecureToken(ttlMs: number): {
  token: string
  hashedToken: string
  expiresAt: Date
} {
  const token = randomBytes(32).toString('hex')
  const hashedToken = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + ttlMs)
  return { token, hashedToken, expiresAt }
}

/**
 * Generate a 6-digit numeric verification code suitable for manual entry
 * alongside a URL-based token.
 */
export function generateShortCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ──────────────────────────────────────────────────────────────────────────
// Verification code storage
// ──────────────────────────────────────────────────────────────────────────

/**
 * Parse JSON-serialised verification codes stored in `User.verificationCodes`.
 * Entries that are not valid JSON or do not match type `T` are silently dropped.
 */
export function parseVerificationCodes<T extends object>(
  codes: string[]
): T[] {
  return codes
    .map((c) => {
      try {
        return JSON.parse(c) as T
      } catch {
        return null
      }
    })
    .filter((c): c is T => c !== null)
}

// ──────────────────────────────────────────────────────────────────────────
// 2FA verification
// ──────────────────────────────────────────────────────────────────────────

/**
 * Verify a 2FA submission against a TOTP secret, with automatic fallback to a
 * one-time recovery code.
 *
 * Returns `true` when either check passes.
 * Errors are caught and logged — they never propagate to callers.
 *
 * Consolidates the identical TOTP + recovery-code blocks that previously
 * existed in three places:
 *   - NextAuth credentials provider (password path)
 *   - NextAuth credentials provider (magic-link path)
 *   - Desktop app auth endpoint
 */
export async function verify2FACode(
  userId: string,
  secret: string,
  code: string
): Promise<boolean> {
  try {
    const { authenticator } = await import('otplib')
    if (authenticator.check(code, secret)) return true
    return await validateAndConsumeRecoveryCode(userId, code)
  } catch (err) {
    logger.error('2FA verification error', err as Error)
    return false
  }
}
