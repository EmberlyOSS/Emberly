import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getToken } from 'next-auth/jwt'

import {
  handleBotRequest,
  isBotRequest,
} from './packages/lib/middleware/bot-handler'
import {
  FILE_URL_PATTERN,
  PROTECTED_PAGE_PATHS,
  SUPERADMIN_PATHS,
  VIDEO_EXTENSIONS,
} from './packages/lib/middleware/constants'
import { Permission, hasPermission } from './packages/lib/permissions'

declare global {
  var __nextAuthLoginContext: Record<string, any>
}

if (!globalThis.__nextAuthLoginContext) {
  globalThis.__nextAuthLoginContext = {}
}

// Computed once per isolate, not on every request
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://embrly.ca'
const MAIN_HOST = new URL(BASE_URL).hostname
const VIDEO_EXTENSIONS_SET = new Set(VIDEO_EXTENSIONS)
const ALPHA_CUTOFF_DATE = new Date('2025-12-27T00:00:00.000Z')

function getClientIP(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim()

  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-client-ip') ??
    undefined
  )
}

function getGeoInfo(request: NextRequest) {
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    null

  const city =
    request.headers.get('x-vercel-ip-city') ||
    request.headers.get('cf-ipcity') ||
    null

  return { country, city }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // Trim trailing slash without regex
  const normalizedPathname =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname

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

  if (
    pathname === '/api/auth/callback/credentials' &&
    request.method === 'POST'
  ) {
    const ip = getClientIP(request)
    const { country, city } = getGeoInfo(request)
    const userAgent = request.headers.get('user-agent')

    const contextKey = `login_context:${Date.now()}`
    globalThis.__nextAuthLoginContext[contextKey] = {
      ip: ip || undefined,
      userAgent: userAgent || undefined,
      geo: country || city ? { country, city } : null,
    }

    const now = Date.now()
    for (const key in globalThis.__nextAuthLoginContext) {
      try {
        const ts = parseInt(key.split(':')[1])
        if (now - ts > 60000) {
          delete globalThis.__nextAuthLoginContext[key]
        }
      } catch {}
    }
  }

  let tokenPromise: Promise<null | Record<string, any>> | null = null
  const getAuthToken = () => {
    if (!tokenPromise) {
      tokenPromise = getToken({ req: request }) as Promise<null | Record<
        string,
        any
      >>
    }
    return tokenPromise
  }

  const isAlphaMigrationPage = pathname === '/auth/alpha-migration'
  const isAlphaMigrationApi = pathname === '/api/auth/alpha-migration'
  const isNextAuthRoute = pathname.startsWith('/api/auth/')
  const isApiRoute = pathname.startsWith('/api/')

  const isFileUrl =
    FILE_URL_PATTERN.test(normalizedPathname) &&
    !normalizedPathname.endsWith('/raw') &&
    !normalizedPathname.endsWith('/direct')

  if (isFileUrl) {
    const fileExt = normalizedPathname.split('.').pop()?.toLowerCase()
    const rangeHeader = request.headers.get('range')
    const acceptHeader = request.headers.get('accept') || ''
    const isMediaRequest =
      rangeHeader != null ||
      (acceptHeader !== '' && !acceptHeader.includes('text/html'))

    if (fileExt && VIDEO_EXTENSIONS_SET.has(fileExt) && isMediaRequest) {
      const url = new URL(request.url)
      url.pathname = `${normalizedPathname}/raw`
      return NextResponse.rewrite(url)
    }

    if (pathname === normalizedPathname) {
      const userAgent = request.headers.get('user-agent') || ''
      if (!isBotRequest(userAgent)) {
        const url = new URL(request.url)
        url.pathname = `${pathname}/`
        return NextResponse.rewrite(url)
      }
    }
  }

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

  if (
    normalizedPathname.endsWith('/raw') ||
    normalizedPathname.endsWith('/direct') ||
    pathname.startsWith('/u/')
  ) {
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
    const role = auth.token?.role

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

  const botResponse = await handleBotRequest(request)
  if (botResponse) return botResponse

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|icon.svg|.*\\.css|.*\\.js|.*\\.woff|.*\\.woff2|.*\\.ttf|.*\\.otf).*)',
  ],
}
