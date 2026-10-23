import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

import { appUrl, authSecret } from '@/lib/config/env'

process.env.NEXTAUTH_URL ||= appUrl()

const DEV_SECRET = 'emberly-dev-nextauth-secret-please-set-auth-secret-in-env'

export function resolvedAuthSecret() {
  return authSecret() ?? (process.env.NODE_ENV !== 'production' ? DEV_SECRET : undefined)
}

export const sessionCookieDomain = () => process.env.NEXTAUTH_COOKIE_DOMAIN || undefined

export function sessionCookieName() {
  if (sessionCookieDomain()) {
    return process.env.NEXTAUTH_COOKIE_NAME || 'next-auth.session-token'
  }
  return appUrl().startsWith('https://')
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'
}

export function getSessionToken(req: NextRequest) {
  return getToken({
    req,
    secret: resolvedAuthSecret(),
    cookieName: sessionCookieName(),
  })
}
