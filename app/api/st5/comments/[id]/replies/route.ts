import { NextResponse } from 'next/server'

import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/database/prisma'

const MAX_LEN = 400

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { user, response } = await requireAuth(request)
        if (response) return response
        if (!user) return apiError('Unauthorized', HTTP_STATUS.UNAUTHORIZED)

        const body = await request.json()
        const raw = (body?.content ?? '').toString().trim()

        if (!raw) return apiError('Reply cannot be empty', HTTP_STATUS.BAD_REQUEST)
        if (raw.length > MAX_LEN) return apiError(`Reply too long (max ${MAX_LEN} chars)`, HTTP_STATUS.BAD_REQUEST)

        const resolvedParams: any = await params
        const commentId = resolvedParams.id

        const created = await prisma.st5CommentReply.create({
            data: {
                content: raw,
                userId: user.id,
                commentId,
            },
            include: { user: { select: { id: true, name: true, urlId: true, image: true } } },
        })

        return apiResponse(created)
    } catch (error) {
        return apiError(error instanceof Error ? error.message : 'Failed to post reply', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}
