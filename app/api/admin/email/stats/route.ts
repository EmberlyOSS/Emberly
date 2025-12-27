import { NextRequest } from 'next/server'

import { apiError, apiResponse, HTTP_STATUS } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.api.getChildLogger('admin-email-stats')

export async function GET(_req: NextRequest) {
    try {
        const { response } = await requireAdmin()
        if (response) return response

        // Get email statistics from Event table
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Count sent emails (email.sent events OR completed email.send events)
        const [sentEvents, completedSends] = await Promise.all([
            prisma.event.count({
                where: { type: 'email.sent' },
            }),
            prisma.event.count({
                where: { type: 'email.send', status: 'COMPLETED' },
            }),
        ])
        const totalSent = sentEvents + completedSends

        // Count pending emails (email.send events that haven't completed)
        const pending = await prisma.event.count({
            where: {
                type: 'email.send',
                status: { in: ['PENDING', 'PROCESSING', 'SCHEDULED'] },
            },
        })

        // Count failed emails (email.failed events OR failed email.send events)
        const [failedEvents, failedSends] = await Promise.all([
            prisma.event.count({
                where: {
                    type: 'email.failed',
                    createdAt: { gte: thirtyDaysAgo },
                },
            }),
            prisma.event.count({
                where: {
                    type: 'email.send',
                    status: 'FAILED',
                    createdAt: { gte: thirtyDaysAgo },
                },
            }),
        ])
        const failed = failedEvents + failedSends

        // Get last sent email (from email.sent or completed email.send)
        const lastSent = await prisma.event.findFirst({
            where: {
                OR: [
                    { type: 'email.sent' },
                    { type: 'email.send', status: 'COMPLETED' },
                ],
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
        })

        // Get recent email activity (last 7 days)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const recentSent = await prisma.event.count({
            where: {
                type: 'email.sent',
                createdAt: { gte: sevenDaysAgo },
            },
        })

        return apiResponse({
            totalSent,
            pending,
            failed,
            recentSent,
            lastSentAt: lastSent?.createdAt?.toISOString() || null,
        })
    } catch (error) {
        logger.error('Failed to fetch email stats', error as Error)
        return apiError('Failed to fetch email statistics', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}
