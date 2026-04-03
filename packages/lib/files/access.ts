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
import { compare } from 'bcryptjs'

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
export async function checkFileAccess(
  file: FileAccessFields,
  { userId, providedPassword, privateStatus = 404 }: AccessOptions,
): Promise<Response | null> {
  const isOwner = !!userId && userId === file.userId

  // Private-visibility gate
  if (file.visibility === 'PRIVATE' && !isOwner) {
    return new Response(null, { status: privateStatus })
  }

  // Password gate (owners bypass)
  if (file.password && !isOwner) {
    if (!providedPassword) {
      return new Response(null, { status: 401 })
    }
    const valid = await compare(providedPassword, file.password)
    if (!valid) {
      return new Response(null, { status: 401 })
    }
  }

  return null
}
