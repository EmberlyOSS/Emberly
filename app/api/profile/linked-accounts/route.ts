import { auth } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/profile/linked-accounts
 * Get all linked social accounts (GitHub, Discord) for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
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
        const session = await auth()
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

        return NextResponse.json({ success: true, message: `${provider} account unlinked` })
    } catch (error) {
        console.error('[DELETE /api/profile/linked-accounts]', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
