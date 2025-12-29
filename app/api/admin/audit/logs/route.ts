import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, paginatedResponse, HTTP_STATUS } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import type { Prisma } from '@/prisma/generated/prisma/client'

const logger = loggers.api.getChildLogger('admin-audit-logs')

const QuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    resource: z.string().trim().optional(),
    action: z.string().trim().optional(),
    success: z.enum(['true', 'false']).optional(),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SCHEDULED']).optional(),
    auditableOnly: z.enum(['true', 'false']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
})

export async function GET(req: NextRequest) {
    try {
        const { response } = await requireAdmin()
        if (response) return response

        const url = new URL(req.url)
        const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams))

        if (!parsed.success) {
            return apiError(parsed.error.errors[0].message, HTTP_STATUS.BAD_REQUEST)
        }

        const { page, limit, search, resource, action, success, status, auditableOnly, startDate, endDate } = parsed.data

        // Surface all events for admins by default, but allow restricting to auditable-only.
        const where: Prisma.EventWhereInput = {}

        if (auditableOnly === 'true') {
            where.isAuditable = true
        }

        if (search) {
            const term = search.toLowerCase()
            where.OR = [
                { actorEmail: { contains: term, mode: 'insensitive' } },
                { targetEmail: { contains: term, mode: 'insensitive' } },
                { type: { contains: term, mode: 'insensitive' } },
                { action: { contains: term, mode: 'insensitive' } },
                { resource: { contains: term, mode: 'insensitive' } },
                { ip: { contains: term, mode: 'insensitive' } },
            ]
        }

        if (resource) {
            where.resource = { equals: resource, mode: 'insensitive' }
        }

        if (action) {
            where.action = { contains: action, mode: 'insensitive' }
        }

        if (status) {
            where.status = status
        }

        if (success) {
            where.success = success === 'true'
        }

        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) {
                const d = new Date(startDate)
                if (Number.isNaN(d.getTime())) return apiError('Invalid startDate', HTTP_STATUS.BAD_REQUEST)
                where.createdAt.gte = d
            }
            if (endDate) {
                const d = new Date(endDate)
                if (Number.isNaN(d.getTime())) return apiError('Invalid endDate', HTTP_STATUS.BAD_REQUEST)
                where.createdAt.lte = d
            }
        }

        const skip = (page - 1) * limit

        const [items, total] = await prisma.$transaction([
            prisma.event.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
                select: {
                    id: true,
                    type: true,
                    status: true,
                    action: true,
                    resource: true,
                    success: true,
                    error: true,
                    payload: true,
                    metadata: true,
                    failedAt: true,
                    processedAt: true,
                    scheduledAt: true,
                    retryCount: true,
                    maxRetries: true,
                    priority: true,
                    actorId: true,
                    actorEmail: true,
                    targetId: true,
                    targetEmail: true,
                    ip: true,
                    userAgent: true,
                    geo: true,
                    createdAt: true,
                },
            }),
            prisma.event.count({ where }),
        ])

        const pageCount = Math.ceil(total / limit) || 1

        return paginatedResponse(items, {
            total,
            pageCount,
            page,
            limit,
        })
    } catch (error) {
        logger.error('Failed to fetch audit logs', error as Error)
        return apiError('Failed to fetch audit logs', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}
