import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { env } from '@/packages/lib/config/env'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/link/github
 * Initiates GitHub OAuth flow. Redirects to GitHub authorization page.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Generate random state for CSRF protection
        const state = Math.random().toString(36).substring(2, 15)

        // Store state in a short-lived cookie (5 minutes)
        const response = NextResponse.redirect(
            `https://github.com/login/oauth/authorize?${new URLSearchParams({
                client_id: env.GITHUB_OAUTH_CLIENT_ID,
                redirect_uri: new URL('/api/auth/link/github/callback', request.url).toString(),
                scope: 'public_repo,repo',
                state,
            }).toString()}`
        )

        response.cookies.set('github_oauth_state', state, {
            maxAge: 300, // 5 minutes
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        })

        return response
    } catch (error) {
        console.error('[POST /api/auth/link/github]', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
