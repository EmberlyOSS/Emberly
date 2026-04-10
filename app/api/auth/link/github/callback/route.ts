import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { verifyContributorStatus } from '@/packages/lib/perks/github'
import { getGitHubUserInfo } from '@/packages/lib/perks/github'
import { env } from '@/packages/lib/config/env'
import { NextRequest, NextResponse } from 'next/server'
import { sendTemplateEmail, AccountChangeEmail } from '@/packages/lib/emails'

/**
 * GET /api/auth/link/github/callback
 * Handles GitHub OAuth callback. Expects code and state in query params.
 * Verifies GitHub user, checks contributor status, and creates LinkedAccount.
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
            console.warn('[GitHub OAuth callback] Error from GitHub:', error)
            return NextResponse.redirect(
                new URL(`/me?error=GitHub authorization failed: ${error}`, baseUrl)
            )
        }

        if (!code) {
            return NextResponse.redirect(
                new URL('/me?error=Missing authorization code', baseUrl)
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
                    `/me?error=Failed to exchange GitHub code: ${tokenData.error}`,
                    baseUrl
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
                new URL('/me?error=Failed to retrieve GitHub user info', baseUrl)
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
                    `/me?error=This GitHub account is already linked to another user`,
                    baseUrl
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

        // Auto-populate the user's github social link if not already set
        await prisma.user.update({
            where: { id: session.user.id },
            data: { github: userInfo.login },
        })

        // Verify contributor status with the access token
        await verifyContributorStatus(
            session.user.id,
            userInfo.login,
            tokenData.access_token
        )

        // Send account change email notification
        if (session.user.email) {
            sendTemplateEmail({
                to: session.user.email,
                subject: 'GitHub Account Linked to Your Emberly Account',
                template: AccountChangeEmail,
                props: {
                    userName: session.user.name || undefined,
                    changes: [
                        `GitHub account "${userInfo.login}" was linked to your account`,
                        `Date: ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`,
                    ],
                },
            }).catch((error) => {
                console.error('[GitHub OAuth callback] Failed to send email:', error)
            })
        }

        return NextResponse.redirect(new URL('/me?success=GitHub%20account%20linked', baseUrl))
    } catch (error) {
        console.error('[GitHub OAuth callback]', error)
        return NextResponse.redirect(
            new URL('/me?error=Failed to link GitHub account', baseUrl)
        )
    }
}
