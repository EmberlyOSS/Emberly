import { NextRequest } from 'next/server'

import { apiError, apiResponse, HTTP_STATUS } from '@/packages/lib/api/response'
import { requireSuperAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.api.getChildLogger('admin-email-logs')

export async function GET(req: NextRequest) {
    try {
        const { response } = await requireSuperAdmin()
        if (response) return response

        // Get query parameters
        const searchParams = req.nextUrl.searchParams
        const status = searchParams.get('status') || 'all' // all, sent, pending, failed
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const offset = parseInt(searchParams.get('offset') || '0')
        const sinceDate = searchParams.get('since') // ISO date string for filtering

        // Build where clause for email events (both sent and failed)
        const where: any = {
            type: { in: ['email.sent', 'email.failed'] }, // Include both success and failure events
        }

        // Filter by status if specified
        if (status !== 'all') {
            if (status === 'sent' || status === 'success' || status === 'completed') {
                where.status = 'COMPLETED'
                where.type = 'email.sent'
            } else if (status === 'pending') {
                where.status = 'PENDING'
            } else if (status === 'failed') {
                where.status = 'FAILED'
                where.type = 'email.failed'
            }
        }

        // Filter by date range if specified
        if (sinceDate) {
            const date = new Date(sinceDate)
            if (!isNaN(date.getTime())) {
                where.createdAt = { gte: date }
            }
        }

        // Get total count for pagination
        const total = await prisma.event.count({ where })

        // Fetch email logs with pagination
        const logs = await prisma.event.findMany({
            where,
            select: {
                id: true,
                type: true,
                payload: true,
                status: true,
                createdAt: true,
                processedAt: true,
                failedAt: true,
                error: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        })

        // Format logs for display
        const formattedLogs = logs.map((log) => {
            const payload = log.payload as any
            const isFailure = log.type === 'email.failed'
            
            return {
                id: log.id,
                to: payload?.to || 'Unknown',
                subject: payload?.subject || 'No subject',
                template: payload?.template || 'Unknown',
                messageId: payload?.messageId || null,
                status: isFailure ? 'FAILED' : log.status,
                type: log.type, // 'email.sent' or 'email.failed'
                createdAt: log.createdAt,
                processedAt: log.processedAt,
                failedAt: log.failedAt,
                error: log.error || payload?.error || null, // Include error from payload or event
                willRetry: isFailure ? payload?.willRetry : undefined,
            }
        })

        logger.info(`Fetched ${logs.length} email logs`, {
            total,
            status,
            limit,
            offset,
        })

        return apiResponse(
            {
                logs: formattedLogs,
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + limit < total,
                },
            }
        )
    } catch (error) {
        logger.error('Failed to fetch email logs', { error })
        return apiError('Failed to fetch email logs', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}
