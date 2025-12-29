import { auth } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database'
import { verifyDiscordBoosterStatus } from '@/packages/lib/perks/discord'
import { getDiscordUserInfo } from '@/packages/lib/perks/discord'
import { env } from '@/packages/lib/config/env'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/link/discord/callback
 * Handles Discord OAuth callback. Expects code and state in query params.
 * Verifies Discord user, checks booster status, and creates LinkedAccount.
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
            console.warn('[Discord OAuth callback] Error from Discord:', error)
            return NextResponse.redirect(
                new URL(`/profile?error=Discord authorization failed: ${error}`, request.url)
            )
        }

        if (!code) {
            return NextResponse.redirect(
                new URL('/profile?error=Missing authorization code', request.url)
            )
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: env.DISCORD_OAUTH_CLIENT_ID,
                client_secret: env.DISCORD_OAUTH_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: new URL('/api/auth/link/discord/callback', request.url).toString(),
                scope: 'identify',
            }).toString(),
        })

        const tokenData = (await tokenResponse.json()) as {
            access_token?: string
            error?: string
            error_description?: string
        }

        if (!tokenData.access_token) {
            console.error('[Discord OAuth callback] Token exchange failed:', tokenData.error)
            return NextResponse.redirect(
                new URL(
                    `/profile?error=Failed to exchange Discord code: ${tokenData.error}`,
                    request.url
                )
            )
        }

        // Get Discord user info
        const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        })

        const userInfo = (await userResponse.json()) as {
            id?: string
            username?: string
            avatar?: string
            error?: string
        }

        if (!userInfo.id) {
            console.error('[Discord OAuth callback] Failed to get user info:', userInfo.error)
            return NextResponse.redirect(
                new URL('/profile?error=Failed to retrieve Discord user info', request.url)
            )
        }

        // Check if account already linked by another user
        const existingLink = await prisma.linkedAccount.findFirst({
            where: {
                provider: 'discord',
                providerUserId: userInfo.id,
            },
        })

        if (existingLink && existingLink.userId !== session.user.id) {
            return NextResponse.redirect(
                new URL(
                    `/profile?error=This Discord account is already linked to another user`,
                    request.url
                )
            )
        }

        // Create or update LinkedAccount
        const linkedAccount = await prisma.linkedAccount.upsert({
            where: {
                userId_provider: {
                    userId: session.user.id,
                    provider: 'discord',
                },
            },
            create: {
                userId: session.user.id,
                provider: 'discord',
                providerUserId: userInfo.id,
                providerUsername: userInfo.username || '',
                providerData: {
                    username: userInfo.username,
                    avatar: userInfo.avatar,
                },
                accessToken: tokenData.access_token,
            },
            update: {
                providerUserId: userInfo.id,
                providerUsername: userInfo.username || '',
                providerData: {
                    username: userInfo.username,
                    avatar: userInfo.avatar,
                },
                accessToken: tokenData.access_token,
                updatedAt: new Date(),
            },
        })

        // Verify booster status
        await verifyDiscordBoosterStatus(session.user.id, userInfo.id)

        return NextResponse.redirect(new URL('/profile?success=Discord account linked', request.url))
    } catch (error) {
        console.error('[Discord OAuth callback]', error)
        return NextResponse.redirect(
            new URL('/profile?error=Failed to link Discord account', request.url)
        )
    }
}
