import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

import { appUrl, authSecret } from '@/lib/config/env'

process.env.NEXTAUTH_URL ||= appUrl()

const DEV_SECRET = 'emberly-dev-nextauth-secret-please-set-auth-secret-in-env'

export function resolvedAuthSecret() {
  return (
    authSecret() ??
    (process.env.NODE_ENV !== 'production' ? DEV_SECRET : undefined)
  )
}

export const sessionCookieDomain = () =>
  process.env.NEXTAUTH_COOKIE_DOMAIN || undefined

export function sessionCookieName() {
  if (sessionCookieDomain()) {
    return process.env.NEXTAUTH_COOKIE_NAME || 'next-auth.session-token'
  }
  return appUrl().startsWith('https://')
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'
}

const COOKIE_NAMES = [
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
]

export async function getSessionToken(req: NextRequest) {
  const secret = resolvedAuthSecret()
  const names = [
    ...new Set(
      [
        sessionCookieName(),
        process.env.NEXTAUTH_COOKIE_NAME,
        ...COOKIE_NAMES,
      ].filter(Boolean)
    ),
  ] as string[]
  for (const cookieName of names) {
    if (
      !req.cookies
        .getAll()
        .some(
          (c) => c.name === cookieName || c.name.startsWith(`${cookieName}.`)
        )
    )
      continue
    const token = await getToken({ req, secret, cookieName })
    if (token) return token
  }
  return null
}
