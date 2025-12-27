import { NextResponse } from 'next/server'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { response } = await requireAdmin()
        if (response) return response

        const { id } = await params
        const body = await request.json()
        const { isHidden } = body

        if (typeof isHidden !== 'boolean') {
            return apiError('Invalid payload', HTTP_STATUS.BAD_REQUEST)
        }

        const updated = await prisma.st5Comment.update({
            where: { id },
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

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { response } = await requireAdmin()
        if (response) return response

        const { id } = await params
        await prisma.st5Comment.delete({ where: { id } })
        return apiResponse({ success: true })
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to delete comment',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}
