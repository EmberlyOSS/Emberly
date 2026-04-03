/**
 * Server-side domain service — NOT browser-compatible.
 * Contains shared logic used across domain API routes.
 */
import type { CustomDomain } from '@/prisma/generated/prisma/client'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.domains || loggers.app

/** Regex for a valid hostname (e.g. "img.example.com"). */
export const DOMAIN_NAME_REGEX = /^([a-z0-9-]+\.)+[a-z]{2,}$/

/** Returns true if `domain` is a syntactically valid hostname. */
export function isValidDomainName(domain: string): boolean {
  return DOMAIN_NAME_REGEX.test(domain)
}

/**
 * Fetches a CustomDomain by id and verifies it belongs to `userId`.
 * Returns `null` if the record does not exist or is owned by a different user
 * (callers should respond with 404 in both cases to avoid enumeration).
 */
export async function getDomainWithOwnership(
  domainId: string,
  userId: string,
): Promise<CustomDomain | null> {
  const domain = await prisma.customDomain.findUnique({ where: { id: domainId } })
  if (!domain || domain.userId !== userId) return null
  return domain
}

/**
 * Computes and persists exponential-backoff state after a Cloudflare error.
 * Backoff capped at 10 increments; delay: 5 s × 2^(min(count,5)−1), capped at 5 steps.
 * Errors are swallowed and logged so callers don't need a try/catch wrapper.
 */
export async function persistCfErrorBackoff(
  domainId: string,
  currentBackoffCount: number,
  cfMeta: unknown,
): Promise<void> {
  const next = Math.min(currentBackoffCount + 1, 10)
  const exp = Math.min(next, 5)
  const delayMs = 5000 * Math.pow(2, Math.max(0, exp - 1))
  const pauseUntil = new Date(Date.now() + delayMs)
  try {
    await prisma.customDomain.update({
      where: { id: domainId },
      data: { cfStatus: 'error', cfMeta, cfBackoffCount: next, cfPauseUntil: pauseUntil },
    })
  } catch (err) {
    logger.error('Failed to persist CF error backoff state', {
      message: (err as Error).message ?? String(err),
    })
  }
}

/**
 * Safely serializes an unknown value to a JSON-safe representation.
 * Handles circular references; falls back to `String(value)` on failure.
 */
export function safeSerialize(value: unknown): unknown {
  try {
    const seen = new Set<object>()
    return JSON.parse(
      JSON.stringify(value, (_k, val: unknown) => {
        if (val !== null && typeof val === 'object') {
          if (seen.has(val)) return '[Circular]'
          seen.add(val)
        }
        return val
      }),
    )
  } catch {
    try {
      return String(value)
    } catch {
      return null
    }
  }
}
