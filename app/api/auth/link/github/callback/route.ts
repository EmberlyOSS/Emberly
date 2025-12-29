import { auth } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database'
import { verifyContributorStatus } from '@/packages/lib/perks/github'
import { getGitHubUserInfo } from '@/packages/lib/perks/github'
import { env } from '@/packages/lib/config/env'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/link/github/callback
 * Handles GitHub OAuth callback. Expects code and state in query params.
 * Verifies GitHub user, checks contributor status, and creates LinkedAccount.
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.redirect(new URL('/auth/signin', request.url))
        }

        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
            console.warn('[GitHub OAuth callback] Error from GitHub:', error)
            return NextResponse.redirect(
                new URL(`/profile?error=GitHub authorization failed: ${error}`, request.url)
            )
        }

        if (!code) {
            return NextResponse.redirect(
                new URL('/profile?error=Missing authorization code', request.url)
            )
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                client_id: env.GITHUB_OAUTH_CLIENT_ID,
                client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
                code,
            }),
        })

        const tokenData = (await tokenResponse.json()) as {
            access_token?: string
            error?: string
            error_description?: string
        }

        if (!tokenData.access_token) {
            console.error('[GitHub OAuth callback] Token exchange failed:', tokenData.error)
            return NextResponse.redirect(
                new URL(
                    `/profile?error=Failed to exchange GitHub code: ${tokenData.error}`,
                    request.url
                )
            )
        }

        // Get GitHub user info with the token
        const userInfo = await getGitHubUserInfo(
            '', // Username not needed, token auth handles it
            tokenData.access_token
        )

        if (!userInfo) {
            return NextResponse.redirect(
                new URL('/profile?error=Failed to retrieve GitHub user info', request.url)
            )
        }

        // Check if account already linked by another user
        const existingLink = await prisma.linkedAccount.findFirst({
            where: {
                provider: 'github',
                providerUserId: String(userInfo.id),
            },
        })

        if (existingLink && existingLink.userId !== session.user.id) {
            return NextResponse.redirect(
                new URL(
                    `/profile?error=This GitHub account is already linked to another user`,
                    request.url
                )
            )
        }

        // Create or update LinkedAccount
        const linkedAccount = await prisma.linkedAccount.upsert({
            where: {
                userId_provider: {
                    userId: session.user.id,
                    provider: 'github',
                },
            },
            create: {
                userId: session.user.id,
                provider: 'github',
                providerUserId: String(userInfo.id),
                providerUsername: userInfo.login,
                providerData: {
                    name: userInfo.name,
                    avatar: userInfo.avatar_url,
                },
                accessToken: tokenData.access_token,
            },
            update: {
                providerUserId: String(userInfo.id),
                providerUsername: userInfo.login,
                providerData: {
                    name: userInfo.name,
                    avatar: userInfo.avatar_url,
                },
                accessToken: tokenData.access_token,
                updatedAt: new Date(),
            },
        })

        // Verify contributor status with the access token
        await verifyContributorStatus(
            session.user.id,
            userInfo.login,
            tokenData.access_token
        )

        return NextResponse.redirect(new URL('/profile?success=GitHub account linked', request.url))
    } catch (error) {
        console.error('[GitHub OAuth callback]', error)
        return NextResponse.redirect(
            new URL('/profile?error=Failed to link GitHub account', request.url)
        )
    }
}
