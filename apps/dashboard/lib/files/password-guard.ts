import { compare } from 'bcryptjs'
import { randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number }
) => Promise<Buffer>

const WINDOW_MS = 15 * 60 * 1000
const PER_CLIENT_LIMIT = 10
const PER_FILE_LIMIT = 100
const REMEMBER_MS = 10 * 60 * 1000

export const MIN_FILE_PASSWORD_LENGTH = 8
export const MAX_FILE_PASSWORD_BYTES = 72

interface Attempts {
  failures: number
  pending: number
  resetAt: number
}

const attempts = new Map<string, Attempts>()
const accepted = new Map<string, number>()

// Remembered passwords are keyed by a cheap scrypt with a per-process secret, never a fast hash
const SECRET = randomBytes(32)
async function rememberKeyFor(
  storedHash: string,
  client: string,
  password: string
) {
  const salt = Buffer.concat([SECRET, Buffer.from(`${storedHash}\0${client}`)])
  const key = await scryptAsync(password, salt, 32, { N: 1024, r: 8, p: 1 })
  return key.toString('hex')
}

function sweep(now: number) {
  if (attempts.size + accepted.size < 10_000) return
  for (const [key, value] of attempts)
    if (value.resetAt <= now && value.pending === 0) attempts.delete(key)
  for (const [key, expires] of accepted)
    if (expires <= now) accepted.delete(key)
}

function bucket(key: string, now: number): Attempts {
  let entry = attempts.get(key)
  if (!entry || (entry.resetAt <= now && entry.pending === 0)) {
    entry = { failures: 0, pending: 0, resetAt: now + WINDOW_MS }
    attempts.set(key, entry)
  }
  return entry
}

/** The caller's address, as reported by Cloudflare or the reverse proxy. */
export function clientAddress(headers?: Headers | null): string {
  if (!headers) return 'unknown'
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

/** Why a new file password can't be used, or null when it's fine. */
export function filePasswordProblem(password: string): string | null {
  if (password.length < MIN_FILE_PASSWORD_LENGTH)
    return `File passwords must be at least ${MIN_FILE_PASSWORD_LENGTH} characters`
  if (Buffer.byteLength(password, 'utf8') > MAX_FILE_PASSWORD_BYTES)
    return 'File password is too long'
  return null
}

export type FilePasswordResult =
  | { ok: true }
  | { ok: false; limited: false }
  | { ok: false; limited: true; retryAfter: number }

/**
 * Checks a password for a protected file. Wrong guesses are limited per
 * address and per file, and a correct password is remembered briefly so
 * streaming a video doesn't run bcrypt for every range request.
 */
export async function checkFilePassword(
  storedHash: string,
  password: string,
  client: string
): Promise<FilePasswordResult> {
  const now = Date.now()
  sweep(now)

  const rememberKey = await rememberKeyFor(storedHash, client, password)
  if ((accepted.get(rememberKey) ?? 0) > now) return { ok: true }

  const file = storedHash
  const perClient = bucket(`${file}:${client}`, now)
  const perFile = bucket(file, now)

  for (const [entry, limit] of [
    [perClient, PER_CLIENT_LIMIT],
    [perFile, PER_FILE_LIMIT],
  ] as const) {
    if (entry.failures + entry.pending >= limit) {
      return {
        ok: false,
        limited: true,
        retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      }
    }
  }

  perClient.pending++
  perFile.pending++
  let valid = false
  try {
    valid = await compare(password, storedHash)
  } finally {
    perClient.pending--
    perFile.pending--
  }

  if (valid) {
    accepted.set(rememberKey, now + REMEMBER_MS)
    return { ok: true }
  }
  perClient.failures++
  perFile.failures++
  return { ok: false, limited: false }
}
