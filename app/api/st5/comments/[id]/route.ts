import { NextResponse } from 'next/server'

import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/database/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const { response } = await requireAdmin()
        if (response) return response

        const body = await request.json()
        const { isHidden } = body

        if (typeof isHidden !== 'boolean') {
            return apiError('Invalid payload', HTTP_STATUS.BAD_REQUEST)
        }

        const updated = await prisma.st5Comment.update({
            where: { id: params.id },
            data: { isHidden },
            select: { id: true, isHidden: true },
        })

        return apiResponse(updated)
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to update comment',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { response } = await requireAdmin()
        if (response) return response

        await prisma.st5Comment.delete({ where: { id: params.id } })
        return apiResponse({ success: true })
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to delete comment',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}
