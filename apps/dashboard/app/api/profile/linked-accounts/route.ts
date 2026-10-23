import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@emberly/db'
import { NextRequest, NextResponse } from 'next/server'
import { sendTemplateEmail, AccountChangeEmail } from '@/lib/emails'

/**
 * GET /api/profile/linked-accounts
 * Get all linked social accounts (GitHub, Discord) for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const linkedAccounts = await prisma.linkedAccount.findMany({
            where: { userId: session.user.id },
            select: {
                id: true,
                provider: true,
                providerUsername: true,
                providerData: true,
                linkedAt: true,
                updatedAt: true,
            },
        })

        return NextResponse.json({ linkedAccounts })
    } catch (error) {
        console.error('[GET /api/profile/linked-accounts]', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/profile/linked-accounts
 * Unlink a social account. Expects provider in query params: ?provider=github or ?provider=discord
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const provider = searchParams.get('provider')

        if (!provider || !['github', 'discord'].includes(provider)) {
            return NextResponse.json(
                { error: 'Invalid or missing provider. Must be "github" or "discord"' },
                { status: 400 }
            )
        }

        const linkedAccount = await prisma.linkedAccount.findFirst({
            where: {
                userId: session.user.id,
                provider: provider as 'github' | 'discord',
            },
        })

        if (!linkedAccount) {
            return NextResponse.json(
                { error: `No linked ${provider} account found` },
                { status: 404 }
            )
        }

        // Remove the perk if unlinking discord booster
        if (provider === 'discord') {
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    perkRoles: {
                        set: (await prisma.user.findUnique({
                            where: { id: session.user.id },
                            select: { perkRoles: true },
                        }))?.perkRoles?.filter((role) => !role.startsWith('DISCORD_BOOSTER')) || [],
                    },
                },
            })
        }

        // Remove the account
        await prisma.linkedAccount.delete({
            where: { id: linkedAccount.id },
        })

        // Send account change email notification
        if (session.user.email) {
            const providerName = provider === 'github' ? 'GitHub' : 'Discord'
            const accountName = linkedAccount.providerUsername || 'Unknown'
            
            const changes = [
                `${providerName} account "${accountName}" was unlinked from your account`,
                `Date: ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`,
            ]
            
            // Add warning about lost perks
            if (provider === 'github') {
                changes.push('Note: You may have lost Contributor perks associated with this account')
            } else if (provider === 'discord') {
                changes.push('Note: You may have lost Discord Booster perks associated with this account')
            }
            
            sendTemplateEmail({
                to: session.user.email,
                subject: `${providerName} Account Unlinked from Your Emberly Account`,
                template: AccountChangeEmail,
                props: {
                    userName: session.user.name || undefined,
                    changes,
                },
            }).catch((error) => {
                console.error('[DELETE /api/profile/linked-accounts] Failed to send email:', error)
            })
        }

        return NextResponse.json({ success: true, message: `${provider} account unlinked` })
    } catch (error) {
        console.error('[DELETE /api/profile/linked-accounts]', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

