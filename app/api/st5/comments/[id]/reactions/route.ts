import { NextResponse } from 'next/server'

import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/database/prisma'

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { user, response } = await requireAuth(request)
        if (response) return response
        if (!user) return apiError('Unauthorized', HTTP_STATUS.UNAUTHORIZED)

        const body = await request.json()
        const type = (body?.type || '').toString()
        if (!['like', 'dislike'].includes(type)) return apiError('Invalid reaction type', HTTP_STATUS.BAD_REQUEST)

        const resolvedParams: any = await params
        const commentId = resolvedParams.id

        // check existing
        const existing = await prisma.st5CommentReaction.findUnique({ where: { commentId_userId: { commentId, userId: user.id } } })

        if (existing) {
            if (existing.type === type) {
                // toggle off
                await prisma.st5CommentReaction.delete({ where: { id: existing.id } })
            } else {
                // switch type
                await prisma.st5CommentReaction.update({ where: { id: existing.id }, data: { type } })
            }
        } else {
            await prisma.st5CommentReaction.create({ data: { commentId, userId: user.id, type } })
        }

        const likeCount = await prisma.st5CommentReaction.count({ where: { commentId, type: 'like' } })
        const dislikeCount = await prisma.st5CommentReaction.count({ where: { commentId, type: 'dislike' } })
        const viewerReaction = await prisma.st5CommentReaction.findUnique({ where: { commentId_userId: { commentId, userId: user.id } } })

        return apiResponse({ likeCount, dislikeCount, viewerReaction: viewerReaction?.type || null })
    } catch (error) {
        return apiError(error instanceof Error ? error.message : 'Failed to toggle reaction', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}
