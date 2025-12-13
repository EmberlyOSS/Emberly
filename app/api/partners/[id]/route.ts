import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/database/prisma'
import { loggers } from '@/lib/logger'

const logger = loggers.files || console

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const partner = await prisma.partner.findUnique({ where: { id: params.id } })
        if (!partner) return apiError('Partner not found', HTTP_STATUS.NOT_FOUND)
        return apiResponse(partner)
    } catch (error) {
        logger.error('Error fetching partner', error as Error)
        return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { response } = await requireAdmin()
        if (response) return response

        const json = await req.json()
        const { name, tagline, url, imagePath, active, sortOrder } = json

        const existing = await prisma.partner.findUnique({ where: { id: params.id } })
        if (!existing) return apiError('Partner not found', HTTP_STATUS.NOT_FOUND)

        const updated = await prisma.partner.update({
            where: { id: params.id },
            data: {
                ...(name !== undefined && { name }),
                ...(tagline !== undefined && { tagline }),
                ...(url !== undefined && { url }),
                ...(imagePath !== undefined && { imagePath }),
                ...(active !== undefined && { active: Boolean(active) }),
                ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
            },
        })

        return apiResponse(updated)
    } catch (error) {
        logger.error('Error updating partner', error as Error)
        return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { response } = await requireAdmin()
        if (response) return response

        const existing = await prisma.partner.findUnique({ where: { id: params.id } })
        if (!existing) return apiError('Partner not found', HTTP_STATUS.NOT_FOUND)

        await prisma.partner.delete({ where: { id: params.id } })

        return apiResponse({ success: true })
    } catch (error) {
        logger.error('Error deleting partner', error as Error)
        return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}
