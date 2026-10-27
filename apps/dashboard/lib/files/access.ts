/**
 * Shared file access-control helpers.
 *
 * Centralises the "check visibility + check password" logic that was
 * duplicated across raw/route.ts, direct/route.ts, the [...path] route,
 * the download route, the OCR route, and the player route.
 *
 * Usage:
 *   const deny = await checkFileAccess(file, { session, providedPassword })
 *   if (deny) return deny   // Response with appropriate 4xx status
 *
 * The helper is intentionally generic in its return type so callers can pass
 * in extra headers (e.g. CORS headers for the raw route) by wrapping the
 * result, but usually the bare Response is all that's needed.
 */
import { checkFilePassword, clientAddress } from '@/lib/files/password-guard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileAccessFields {
  userId: string
  visibility: string
  password: string | null
}

interface AccessOptions {
  /** The currently authenticated user's id, if any. */
  userId?: string | null
  /** Raw (un-hashed) password provided by the client, if any. */
  providedPassword?: string | null
  /** HTTP status to use for "not found / private" responses (default 404). */
  privateStatus?: number
  /** The incoming request, so wrong password guesses are limited per address. */
  request?: Request
}

// ---------------------------------------------------------------------------
// Main helper
// ---------------------------------------------------------------------------

/**
 * Check whether the caller is allowed to access `file`.
 *
 * Returns `null` when access is permitted; returns a `Response` with the
 * correct status code when access should be denied.
 *
 * Rules:
 *  - `PRIVATE` files: only the owner can view them → 404 (so we don't leak
 *    existence to third parties).
 *  - Password-protected files: non-owners must supply the correct password →
 *    401 when no password given, 401 when password is wrong.
 */
/**
 * Cache-Control for responses that must never be stored by a CDN or browser:
 * errors, denials, and anything private or password-protected. Without it,
 * Cloudflare caches responses on image-like URLs (e.g. a transient 404) and
 * serves them to everyone.
 */
export const NO_STORE = 'private, no-store'

/**
 * Cache-Control for serving a file's bytes. Only public, password-free files
 * may be cached, and only briefly so deletes and visibility changes take effect.
 */
export function fileCacheControl(
  file: Pick<FileAccessFields, 'visibility' | 'password'>
): string {
  return file.visibility === 'PUBLIC' && !file.password
    ? 'public, max-age=3600'
    : NO_STORE
}

export async function checkFileAccess(
  file: FileAccessFields,
  { userId, providedPassword, privateStatus = 404, request }: AccessOptions
): Promise<Response | null> {
  const isOwner = !!userId && userId === file.userId

  // Private-visibility gate
  if (file.visibility === 'PRIVATE' && !isOwner) {
    return new Response(null, {
      status: privateStatus,
      headers: { 'Cache-Control': NO_STORE },
    })
  }

  // Password gate (owners bypass)
  if (file.password && !isOwner) {
    if (!providedPassword) {
      return new Response(null, {
        status: 401,
        headers: { 'Cache-Control': NO_STORE },
      })
    }
    const result = await checkFilePassword(
      file.password,
      providedPassword,
      clientAddress(request?.headers)
    )
    if (!result.ok) {
      return new Response(null, {
        status: result.limited ? 429 : 401,
        headers: {
          'Cache-Control': NO_STORE,
          ...(result.limited
            ? { 'Retry-After': String(result.retryAfter) }
            : {}),
        },
      })
    }
  }

  return null
}
