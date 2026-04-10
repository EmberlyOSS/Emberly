import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getToken } from 'next-auth/jwt'

import { handleBotRequest } from './packages/lib/middleware/bot-handler'
import { PROTECTED_PAGE_PATHS, SUPERADMIN_PATHS } from './packages/lib/middleware/constants'
import { hasPermission, Permission } from './packages/lib/permissions'

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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://embrly.ca'

  // ── Custom Domain Routing ──────────────────────────────────────────────
  // If the incoming host differs from the main domain, check if it's a
  // verified custom domain. If the visitor is on the root path ("/"),
  // rewrite to the domain owner's public profile. All other paths
  // (file views, short URLs, etc.) pass through normally.
  const incomingHost = request.headers.get('host')?.replace(/:\d+$/, '')
  const mainHost = new URL(baseUrl).hostname

  if (incomingHost && incomingHost !== mainHost && incomingHost !== 'localhost') {
    // Only rewrite the root path — everything else (files, short URLs, assets) passes through
    if (pathname === '/') {
      try {
        const lookupUrl = new URL('/api/internal/domain-lookup', request.url)
        lookupUrl.searchParams.set('hostname', incomingHost)

        const res = await fetch(lookupUrl.toString(), {
          headers: { 'x-internal-request': 'true' },
        })

        if (res.ok) {
          const data = await res.json()
          if (data.found && data.profileSlug) {
            return NextResponse.rewrite(new URL(`/user/${data.profileSlug}`, request.url))
          }
        }
      } catch (e) {
        // Lookup failed — fall through to normal routing
        console.error('[Proxy] Custom domain lookup failed:', e)
      }
    }
  }

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
      return NextResponse.redirect(new URL('/auth/alpha-migration', baseUrl))
    }
  }

  // EMAIL VERIFICATION CHECK - Enforce email verification for authenticated users
  // Users who haven't verified their email can ONLY access:
  // - Auth pages (/auth/*)
  // - NextAuth routes (/api/auth/*)
  // - Email verification endpoint (/api/auth/verify-email)
  const isVerifyEmailPage = pathname === '/auth/verify-email'
  const isVerifyEmailApi = pathname === '/api/auth/verify-email'
  const isAuthPage = pathname.startsWith('/auth/')

  if (token) {
    const isEmailVerified = token.emailVerified ? true : false

    if (!isEmailVerified && !isVerifyEmailPage && !isVerifyEmailApi && !isAuthPage && !isNextAuthRoute && !isApiRoute) {
      console.log(`[Proxy] Unverified user ${token.email} blocked from ${pathname}`)
      return NextResponse.redirect(new URL('/auth/verify-email', baseUrl))
    }
  }

  // PASSWORD BREACH CHECK - Redirect to security tab if breach detected
  // Users with detected password breaches are redirected to profile security tab
  const isProfileSecurityTab = pathname === '/me' && request.nextUrl.searchParams.get('tab') === 'security'
  const isProfilePath = pathname === '/me'
  const isDashboardRoot = pathname === '/dashboard'

  if (token && token.passwordBreachDetectedAt) {
    // If already on profile security tab, allow through
    if (isProfileSecurityTab) {
      return NextResponse.next()
    }
    // If on dashboard root, redirect to profile security
    if (isDashboardRoot) {
      console.log(`[Proxy] User ${token.email} with password breach detected, redirecting from dashboard to profile security`)
      return NextResponse.redirect(new URL('/me?tab=security', baseUrl))
    }
    // If on profile but not security tab, redirect to security tab
    if (isProfilePath && !request.nextUrl.searchParams.get('tab')) {
      console.log(`[Proxy] User ${token.email} with password breach detected, redirecting to security tab`)
      return NextResponse.redirect(new URL('/me?tab=security', baseUrl))
    }
  }

  // Pass through raw/direct file paths and short URL redirects
  if (
    pathname.endsWith('/raw') ||
    pathname.endsWith('/direct') ||
    pathname.startsWith('/u/')
  ) {
    return NextResponse.next()
  }

  // API routes manage their own authentication — skip middleware auth checks
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Auth, setup, and email verification flows are always public
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/setup')
  ) {
    return NextResponse.next()
  }

  const ensureAuthenticated = async () => {
    const t = await getAuthToken()
    if (!t) {
      return NextResponse.redirect(new URL('/auth/login', baseUrl))
    }
    return { token: t }
  }

  // All /admin/* routes require at minimum ADMIN access.
  // Specific superadmin-only paths require elevated permissions.
  if (pathname.startsWith('/admin/') || pathname === '/admin') {
    const auth = await ensureAuthenticated()
    if (auth instanceof NextResponse) return auth
    const role = auth.token?.role

    const isSuperAdminRoute = SUPERADMIN_PATHS.some((path) => pathname.startsWith(path))
    if (isSuperAdminRoute) {
      if (!hasPermission(role as any, Permission.PERFORM_SUPERADMIN_ACTIONS)) {
        return NextResponse.redirect(new URL('/dashboard', baseUrl))
      }
    } else if (!hasPermission(role as any, Permission.ACCESS_ADMIN_PANEL)) {
      return NextResponse.redirect(new URL('/dashboard', baseUrl))
    }
  }

  // Protected pages require a valid session
  if (PROTECTED_PAGE_PATHS.some((p) => pathname.startsWith(p))) {
    const t = await getAuthToken()
    if (!t) {
      return NextResponse.redirect(new URL('/auth/login', baseUrl))
    }
  }

  const botResponse = await handleBotRequest(request)
  if (botResponse) return botResponse

  // Everything else is public (marketing pages, user profiles, file viewer, etc.)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|icon.svg|.*\\.css|.*\\.js|.*\\.woff|.*\\.woff2|.*\\.ttf|.*\\.otf).*)',
  ],
}
