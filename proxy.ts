import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getToken } from 'next-auth/jwt'

import { checkAuthentication } from './packages/lib/middleware/auth-checker'
import { handleBotRequest } from './packages/lib/middleware/bot-handler'
import { ADMIN_PATHS, PUBLIC_PATHS, SUPERADMIN_PATHS } from './packages/lib/middleware/constants'

// Global store for login context (IP, UserAgent, Geo)
// Used to pass request context to NextAuth callbacks
declare global {
  var __nextAuthLoginContext: Record<string, any>
}

if (!globalThis.__nextAuthLoginContext) {
  globalThis.__nextAuthLoginContext = {}
}

/**
 * Extract IP address from various sources
 * Priority: x-forwarded-for (Vercel), x-real-ip, cf-connecting-ip (Cloudflare), client IP
 */
function getClientIP(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  return request.ip
}

/**
 * Extract geographic information from CDN headers
 */
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

  // Capture login context for auth tracking
  if (pathname === '/api/auth/callback/credentials' && request.method === 'POST') {
    const ip = getClientIP(request)
    const { country, city } = getGeoInfo(request)
    const userAgent = request.headers.get('user-agent')

    // Store in global context with a timestamp key
    const contextKey = `login_context:${Date.now()}`
    globalThis.__nextAuthLoginContext[contextKey] = {
      ip: ip || undefined,
      userAgent: userAgent || undefined,
      geo: country || city ? { country, city } : null,
    }

    // Cleanup old entries (keep only recent ones)
    const now = Date.now()
    for (const key in globalThis.__nextAuthLoginContext) {
      try {
        const ts = parseInt(key.split(':')[1])
        if (now - ts > 60000) { // Keep for 1 minute
          delete globalThis.__nextAuthLoginContext[key]
        }
      } catch {
        // ignore
      }
    }
  }

  // Fetch token lazily so we only hit auth once
  let tokenPromise: Promise<null | Record<string, any>> | null = null
  const getAuthToken = () => {
    if (!tokenPromise) {
      tokenPromise = getToken({ req: request }) as Promise<null | Record<string, any>>
    }
    return tokenPromise
  }

  // ALPHA MIGRATION CHECK - Must come FIRST before any other checks
  // Users created before Dec 27, 2025 who haven't verified their email must complete migration
  const ALPHA_CUTOFF_DATE = new Date('2025-12-27T00:00:00.000Z')
  const isAlphaMigrationPage = pathname === '/auth/alpha-migration'
  const isAlphaMigrationApi = pathname === '/api/auth/alpha-migration'
  const isNextAuthRoute = pathname.startsWith('/api/auth/')
  const isApiRoute = pathname.startsWith('/api/')

  // Check if user needs alpha migration
  const token = await getAuthToken()
  if (token) {
    const createdAt = token.createdAt ? new Date(token.createdAt) : null
    const isPreCutoffUser = createdAt && createdAt < ALPHA_CUTOFF_DATE
    const hasVerifiedEmail = token.emailVerified === true
    const needsMigration = isPreCutoffUser && !hasVerifiedEmail

    // Users who need migration can ONLY access:
    // - The migration page itself
    // - The migration API
    // - NextAuth routes (for logout, session refresh)
    // - Other API routes (they should handle auth themselves)
    if (needsMigration && !isAlphaMigrationPage && !isAlphaMigrationApi && !isNextAuthRoute && !isApiRoute) {
      return NextResponse.redirect(new URL('/auth/alpha-migration', request.url))
    }
  }

  // Continue with normal routing
  if (
    pathname.endsWith('/raw') ||
    pathname.endsWith('/direct')
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/u/')) {
    return NextResponse.next()
  }

  if (
    PUBLIC_PATHS.some((path: string) =>
      path === '/'
        ? pathname === '/' // only allow exact root match
        : pathname.startsWith(path)
    )
  ) {
    return NextResponse.next()
  }

  const ensureAuthenticated = async () => {
    const t = await getAuthToken()
    if (!t) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return { token: t }
  }

  const isSuperAdminRoute = SUPERADMIN_PATHS.some((path) => pathname.startsWith(path))
  if (isSuperAdminRoute) {
    const auth = await ensureAuthenticated()
    if (auth instanceof NextResponse) return auth
    const role = auth.token?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  const isAdminRoute = ADMIN_PATHS.some((path) => pathname.startsWith(path))
  if (isAdminRoute) {
    const auth = await ensureAuthenticated()
    if (auth instanceof NextResponse) return auth
    const role = auth.token?.role

    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  const botResponse = handleBotRequest(request)
  if (botResponse) return botResponse

  if (
    request.nextUrl.pathname.startsWith('/setup') ||
    request.nextUrl.pathname.startsWith('/api/setup')
  ) {
    return NextResponse.next()
  }

  const authResponse = await checkAuthentication(request)
  if (authResponse) return authResponse

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
