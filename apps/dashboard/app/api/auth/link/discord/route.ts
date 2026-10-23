import { NextRequest, NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth'
import { appUrl, env } from '@/lib/config/env'
import { getServerSession } from 'next-auth/next'

/**
 * GET /api/auth/link/discord
 * Initiates Discord OAuth flow. Redirects to Discord authorization page.
 */
export async function GET(request: NextRequest) {
  const baseUrl = appUrl()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/login', baseUrl))
    }

    // Generate random state for CSRF protection
    const state = crypto.randomUUID()

    // Store state in a short-lived cookie (5 minutes)
    const response = NextResponse.redirect(
      `https://discord.com/api/oauth2/authorize?${new URLSearchParams({
        client_id: env.DISCORD_OAUTH_CLIENT_ID,
        redirect_uri: `${baseUrl}/api/auth/link/discord/callback`,
        response_type: 'code',
        scope: 'identify',
        state,
      }).toString()}`
    )

    response.cookies.set('discord_oauth_state', state, {
      maxAge: 300, // 5 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('[GET /api/auth/link/discord]', error)
    return NextResponse.redirect(
      new URL('/me?error=discord_link_failed', baseUrl)
    )
  }
}

/**
 * POST /api/auth/link/discord
 * Initiates Discord OAuth flow. Redirects to Discord authorization page.
 */
export async function POST(request: NextRequest) {
  const baseUrl = appUrl()
  try {
    // Generate random state for CSRF protection
    const state = crypto.randomUUID()

    // Store state in a short-lived cookie (5 minutes)
    const response = NextResponse.redirect(
      `https://discord.com/api/oauth2/authorize?${new URLSearchParams({
        client_id: env.DISCORD_OAUTH_CLIENT_ID,
        redirect_uri: `${baseUrl}/api/auth/link/discord/callback`,
        response_type: 'code',
        scope: 'identify',
        state,
      }).toString()}`
    )

    response.cookies.set('discord_oauth_state', state, {
      maxAge: 300, // 5 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('[POST /api/auth/link/discord]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
