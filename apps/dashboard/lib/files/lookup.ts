/**
 * Shared file lookup helpers.
 *
 * Centralises the "find by urlPath, fall back to space→dash variant" pattern
 * that was duplicated across 6+ route files. Handles both literal spaces and
 * percent-encoded spaces (%20) that some HTTP clients / crawlers send.
 */
import type { Prisma } from '@emberly/db'

import { prisma } from '@emberly/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FileSelect = Prisma.FileSelect
type FileInclude = Prisma.FileInclude

type FindArgs<
  S extends FileSelect | undefined,
  I extends FileInclude | undefined,
> = {
  select?: S
  include?: I
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a raw-serve URL for a file, correctly encoding the password if given.
 * Prevents injection when the password contains `&`, `=`, `#`, etc.
 */
export function buildRawUrl(urlPath: string, password?: string | null): string {
  const base = `${urlPath}/raw`
  if (!password) return base
  return `${base}?password=${encodeURIComponent(password)}`
}

/**
 * Fetch a file record by its urlPath, automatically retrying with spaces
 * replaced by hyphens when the first lookup fails.  This covers two cases:
 *   1. Filenames that contain literal spaces stored in the DB as dashes.
 *   2. Callers that pass `%20`-encoded paths (decoded by Next.js before we
 *      receive them, resulting in a literal space in `filename`).
 *
 * Pass `select` OR `include` (not both) to control which fields are returned,
 * exactly as you would with a raw `prisma.file.findUnique` call.
 */
export async function findFileByUrlPath<
  S extends FileSelect | undefined = undefined,
  I extends FileInclude | undefined = undefined,
>(
  userUrlId: string,
  filename: string,
  args?: FindArgs<S, I>
): Promise<Prisma.FileGetPayload<{ select: S; include: I }> | null> {
  let decoded: string
  try {
    decoded = decodeURIComponent(filename)
  } catch {
    return null
  }
  // Postgres rejects text containing NUL, and no stored path can contain one
  if (decoded.includes('\u0000') || userUrlId.includes('\u0000')) return null
  const urlPath = `/${userUrlId}/${decoded}`

  const query: any = { where: { urlPath }, ...args }

  let file = await prisma.file.findUnique(query)

  // If not found and the decoded filename contains spaces, retry with dashes.
  if (!file && decoded.includes(' ')) {
    const dashed = decoded.replace(/ /g, '-')
    file = await prisma.file.findUnique({
      where: { urlPath: `/${userUrlId}/${dashed}` },
      ...args,
    })
  }

  return file as Prisma.FileGetPayload<{ select: S; include: I }> | null
}
