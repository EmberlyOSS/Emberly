import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { verifyDiscordBoosterStatus } from '@/packages/lib/perks/discord'
import { getDiscordUserInfo } from '@/packages/lib/perks/discord'
import { env } from '@/packages/lib/config/env'
import { NextRequest, NextResponse } from 'next/server'
import { sendTemplateEmail, AccountChangeEmail } from '@/packages/lib/emails'

/**
 * GET /api/auth/link/discord/callback
 * Handles Discord OAuth callback. Expects code and state in query params.
 * Verifies Discord user, checks booster status, and creates LinkedAccount.
 */
export async function GET(request: NextRequest) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://embrly.ca'
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.redirect(new URL('/auth/signin', baseUrl))
        }

        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
            console.warn('[Discord OAuth callback] Error from Discord:', error)
            return NextResponse.redirect(
                new URL(`/me?error=Discord authorization failed: ${error}`, baseUrl)
            )
        }

        if (!code) {
            return NextResponse.redirect(
                new URL('/me?error=Missing authorization code', baseUrl)
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
                redirect_uri: `${baseUrl}/api/auth/link/discord/callback`,
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
                    `/me?error=Failed to exchange Discord code: ${tokenData.error}`,
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
                new URL('/me?error=Failed to retrieve Discord user info', request.url)
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
                    `/me?error=This Discord account is already linked to another user`,
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

        // Auto-populate the user's discord social link if not already set
        if (userInfo.username) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { discord: userInfo.username },
            })
        }

        // Verify booster status
        await verifyDiscordBoosterStatus(session.user.id, userInfo.id)

        // Send account change email notification
        if (session.user.email) {
            sendTemplateEmail({
                to: session.user.email,
                subject: 'Discord Account Linked to Your Emberly Account',
                template: AccountChangeEmail,
                props: {
                    userName: session.user.name || undefined,
                    changes: [
                        `Discord account "${userInfo.username || 'Unknown'}" was linked to your account`,
                        `Date: ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`,
                    ],
                },
            }).catch((error) => {
                console.error('[Discord OAuth callback] Failed to send email:', error)
            })
        }

        return NextResponse.redirect(new URL('/me?success=Discord%20account%20linked', baseUrl))
    } catch (error) {
        console.error('[Discord OAuth callback]', error)
        return NextResponse.redirect(
            new URL('/me?error=Failed to link Discord account', baseUrl)
        )
    }
}
