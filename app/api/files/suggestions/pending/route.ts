import { NextResponse } from 'next/server'
import { requireAuth } from '@/packages/lib/auth/api-auth'


import { prisma } from '@/packages/lib/database/prisma'

// Get pending suggestions count for files the current user owns
export async function GET(req: Request) {
    try {
        const { user, response } = await requireAuth(req)
    if (response) return response

        // Count pending suggestions for files owned by current user
        const pendingCount = await prisma.fileEditSuggestion.count({
            where: {
                file: {
                    userId: user.id,
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
