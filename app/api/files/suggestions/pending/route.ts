import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'

// Get pending suggestions count for files the current user owns
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Count pending suggestions for files owned by current user
        const pendingCount = await prisma.fileEditSuggestion.count({
            where: {
                file: {
                    userId: session.user.id,
                },
                status: 'PENDING',
            },
        })

        return NextResponse.json({
            pendingCount,
        })
    } catch (error) {
        console.error('Failed to get pending suggestions count', error)
        return NextResponse.json(
            { error: 'Failed to get pending suggestions count' },
            { status: 500 }
        )
    }
}
