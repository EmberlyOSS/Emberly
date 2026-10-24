import { appUrl } from '@/lib/config/env'
import { prisma } from '@emberly/db'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getSessionToken } from './lib/auth/session-cookie'

import { apiError, HTTP_STATUS } from './lib/api/response'
import { isCloudEnabled } from './lib/config/env'
import { routeFileRequest } from './lib/embeds/routing'
import {
  CLOUD_ONLY_API_PATHS,
  CLOUD_ONLY_PAGE_PATHS,
  FILE_URL_PATTERN,
  PROTECTED_PAGE_PATHS,
  SUPERADMIN_PATHS,
} from './lib/middleware/constants'
import { Permission, hasPermission } from './lib/permissions'

// Computed once per isolate, not on every request
const BASE_URL = appUrl()
const MAIN_HOST = new URL(BASE_URL).hostname
const ALPHA_CUTOFF_DATE = new Date('2025-12-27T00:00:00.000Z')

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // Trim trailing slash without regex
  const normalizedPathname =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname

  // Next's own trailing-slash redirect is off (skipTrailingSlashRedirect) so
  // file links ending in "/" are served directly: Discord drops the embed
  // image when a share link redirects. Every other path still redirects.
  if (pathname !== normalizedPathname && !FILE_URL_PATTERN.test(pathname)) {
    // Must be an absolute URL: Next rejects a relative Location from the proxy
    // (500). It relativizes same-host redirects itself, so the request's host
    // is kept rather than the internal one.
    const url = request.nextUrl.clone()
    url.pathname = normalizedPathname
    return NextResponse.redirect(url, 308)
  }

  const fileResponse = await routeFileRequest(request)
  if (fileResponse) return fileResponse

  const incomingHost = request.headers.get('host')?.replace(/:\d+$/, '')

  if (
    incomingHost &&
    incomingHost !== MAIN_HOST &&
    incomingHost !== 'localhost'
  ) {
    if (pathname === '/') {
      try {
        const internalBase = `http://localhost:${process.env.PORT || 3000}`
        const lookupUrl = new URL('/api/internal/domain-lookup', internalBase)
        lookupUrl.searchParams.set('hostname', incomingHost)

        const res = await fetch(lookupUrl.toString())

        if (res.ok) {
          const data = await res.json()
          if (data.found && data.profileSlug) {
            return NextResponse.rewrite(
              new URL(`/user/${data.profileSlug}`, request.url)
            )
          }
        }
      } catch (e) {
        console.error('[Proxy] Custom domain lookup failed:', e)
      }
    }
  }

  let tokenPromise: Promise<null | Record<string, any>> | null = null
  const getAuthToken = () => {
    if (!tokenPromise) {
      tokenPromise = getSessionToken(request) as Promise<null | Record<
        string,
        any
      >>
    }
    return tokenPromise
  }

  if (!isCloudEnabled()) {
    const isMainHost =
      !incomingHost ||
      incomingHost === MAIN_HOST ||
      incomingHost === 'localhost'

    if (isMainHost && normalizedPathname === '/') {
      try {
        const internalBase = `http://localhost:${process.env.PORT || 3000}`
        const res = await fetch(new URL('/api/setup/check', internalBase))
        if (res.ok) {
          const data = await res.json()
          if (!data.completed) {
            return NextResponse.redirect(new URL('/setup', BASE_URL))
          }
        }
      } catch (e) {
        console.error('[Proxy] Setup check failed:', e)
      }

      const token = await getAuthToken()
      return NextResponse.redirect(
        new URL(token ? '/dashboard' : '/auth/login', BASE_URL)
      )
    }

    if (CLOUD_ONLY_API_PATHS.some((p) => pathname.startsWith(p))) {
      return apiError('Not found', HTTP_STATUS.NOT_FOUND)
    }

    if (
      CLOUD_ONLY_PAGE_PATHS.some(
        (p) =>
          normalizedPathname === p || normalizedPathname.startsWith(`${p}/`)
      )
    ) {
      const token = await getAuthToken()
      return NextResponse.redirect(
        new URL(token ? '/dashboard' : '/auth/login', BASE_URL)
      )
    }
  }

  const isAlphaMigrationPage = pathname === '/auth/alpha-migration'
  const isAlphaMigrationApi = pathname === '/api/auth/alpha-migration'
  const isNextAuthRoute = pathname.startsWith('/api/auth/')
  const isApiRoute = pathname.startsWith('/api/')

  const token = await getAuthToken()
  if (token) {
    const createdAt = token.createdAt ? new Date(token.createdAt) : null
    const isPreCutoffUser = createdAt && createdAt < ALPHA_CUTOFF_DATE
    const hasVerifiedEmail = token.emailVerified === true
    const needsMigration = isPreCutoffUser && !hasVerifiedEmail

    if (
      needsMigration &&
      !isAlphaMigrationPage &&
      !isAlphaMigrationApi &&
      !isNextAuthRoute &&
      !isApiRoute
    ) {
      return NextResponse.redirect(new URL('/auth/alpha-migration', BASE_URL))
    }
  }

  const isVerifyEmailPage = pathname === '/auth/verify-email'
  const isVerifyEmailApi = pathname === '/api/auth/verify-email'
  const isAuthPage = pathname.startsWith('/auth/')

  if (token) {
    const isEmailVerified = !!token.emailVerified

    if (
      !isEmailVerified &&
      !isVerifyEmailPage &&
      !isVerifyEmailApi &&
      !isAuthPage &&
      !isNextAuthRoute &&
      !isApiRoute
    ) {
      return NextResponse.redirect(new URL('/auth/verify-email', BASE_URL))
    }
  }

  const isProfileSecurityTab =
    pathname === '/me' && request.nextUrl.searchParams.get('tab') === 'security'
  const isProfilePath = pathname === '/me'
  const isDashboardRoot = pathname === '/dashboard'

  if (token && token.passwordBreachDetectedAt) {
    if (isProfileSecurityTab) {
      return NextResponse.next()
    }
    if (
      isDashboardRoot ||
      (isProfilePath && !request.nextUrl.searchParams.get('tab'))
    ) {
      return NextResponse.redirect(new URL('/me?tab=security', BASE_URL))
    }
  }

  if (pathname.startsWith('/u/')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/auth/') || pathname.startsWith('/setup')) {
    return NextResponse.next()
  }

  const ensureAuthenticated = async () => {
    const t = await getAuthToken()
    if (!t) {
      return NextResponse.redirect(new URL('/auth/login', BASE_URL))
    }
    return { token: t }
  }

  if (pathname.startsWith('/admin/') || pathname === '/admin') {
    const auth = await ensureAuthenticated()
    if (auth instanceof NextResponse) return auth

    // The role comes from the database, not the token, so tokens for deleted
    // accounts or from another install sharing AUTH_SECRET can't reach admin
    const account = auth.token?.id
      ? await prisma.user
          .findUnique({ where: { id: auth.token.id }, select: { role: true } })
          .catch(() => null)
      : null
    if (!account) {
      return NextResponse.redirect(new URL('/auth/login', BASE_URL))
    }
    const role = account.role

    const isSuperAdminRoute = SUPERADMIN_PATHS.some((path) =>
      pathname.startsWith(path)
    )
    if (isSuperAdminRoute) {
      if (!hasPermission(role as any, Permission.PERFORM_SUPERADMIN_ACTIONS)) {
        return NextResponse.redirect(new URL('/dashboard', BASE_URL))
      }
    } else if (!hasPermission(role as any, Permission.ACCESS_ADMIN_PANEL)) {
      return NextResponse.redirect(new URL('/dashboard', BASE_URL))
    }
  }

  if (PROTECTED_PAGE_PATHS.some((p) => pathname.startsWith(p))) {
    const t = await getAuthToken()
    if (!t) {
      return NextResponse.redirect(new URL('/auth/login', BASE_URL))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|icon.svg|.*\\.css|.*\\.js|.*\\.woff|.*\\.woff2|.*\\.ttf|.*\\.otf).*)',
  ],
}
