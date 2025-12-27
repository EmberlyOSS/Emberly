import { NextResponse } from 'next/server'

import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.users

export const dynamic = 'force-dynamic'

/**
 * GET /api/profile/sessions
 * Returns login history and session info for the current user
 */
export async function GET(req: Request) {
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response

        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '20', 10)

        // Get login history
        const loginHistory = await prisma.loginHistory.findMany({
            where: {
                userId: user.id,
                success: true,
            },
            select: {
                id: true,
                ip: true,
                userAgent: true,
                fingerprint: true,
                country: true,
                city: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: Math.min(limit, 100),
        })

        // Get the user's current session version
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                sessionVersion: true,
                lastLoginAt: true,
                lastLoginIp: true,
                lastLoginUserAgent: true,
            },
        })

        return NextResponse.json({
            loginHistory,
            sessionInfo: {
                sessionVersion: userData?.sessionVersion ?? 1,
                lastLoginAt: userData?.lastLoginAt,
                lastLoginIp: userData?.lastLoginIp,
                lastLoginUserAgent: userData?.lastLoginUserAgent,
            },
        })
    } catch (error) {
        logger.error('Failed to fetch sessions', error as Error)
        return NextResponse.json(
            { error: 'Failed to fetch session data' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/profile/sessions
 * Revokes all sessions by incrementing sessionVersion
 */
export async function DELETE(req: Request) {
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response

        // Increment session version to invalidate all sessions
        await prisma.user.update({
            where: { id: user.id },
            data: {
                sessionVersion: { increment: 1 },
            },
        })

        // Optionally clear login history older than current session
        // This keeps a record but marks a "fresh start"

        logger.info(`User ${user.id} revoked all sessions`)

        return NextResponse.json({
            success: true,
            message: 'All sessions have been revoked. You will need to log in again on all devices.',
        })
    } catch (error) {
        logger.error('Failed to revoke sessions', error as Error)
        return NextResponse.json(
            { error: 'Failed to revoke sessions' },
            { status: 500 }
        )
    }
}
