import { NextResponse } from 'next/server'

import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth, requireAdmin } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/database/prisma'

const MAX_LEN = 800

export async function GET() {
    try {
        const comments = await prisma.st5Comment.findMany({
            where: { isHidden: false },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                content: true,
                isSpoiler: true,
                createdAt: true,
                user: { select: { id: true, name: true, urlId: true } },
                attachments: { select: { id: true, file: { select: { id: true, urlPath: true, mimeType: true, size: true } } } },
            },
        })

        return apiResponse(comments)
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to load comments',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}

export async function POST(req: Request) {
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response
        if (!user) return apiError('Unauthorized', HTTP_STATUS.UNAUTHORIZED)

        const body = await req.json()
        const raw = (body?.content ?? '').toString().trim()
        const attachments: string[] = Array.isArray(body?.attachments) ? body.attachments : []
        const isSpoiler = !!body?.isSpoiler

        if (!raw && attachments.length === 0) {
            return apiError('Comment cannot be empty', HTTP_STATUS.BAD_REQUEST)
        }
        if (raw.length > MAX_LEN) {
            return apiError(`Comment too long (max ${MAX_LEN} chars)`, HTTP_STATUS.BAD_REQUEST)
        }

        const created = await prisma.st5Comment.create({
            data: {
                content: raw,
                userId: user.id,
                isSpoiler,
                attachments: attachments.length
                    ? { create: attachments.map((fileId) => ({ fileId })) }
                    : undefined,
            },
            select: {
                id: true,
                content: true,
                isSpoiler: true,
                createdAt: true,
                user: { select: { id: true, name: true, urlId: true } },
                attachments: { select: { id: true, file: { select: { id: true, urlPath: true, mimeType: true, size: true } } } },
            },
        })

        return apiResponse(created)
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to post comment',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}
