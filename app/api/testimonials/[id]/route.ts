import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const id = url.pathname.split('/').pop()
        if (!id) return apiError('Not found', HTTP_STATUS.NOT_FOUND)

        const t = await prisma.testimonial.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, urlId: true } } } })
        if (!t) return apiError('Not found', HTTP_STATUS.NOT_FOUND)

        return apiResponse(t)
    } catch (error) {
        return apiError('Failed to load testimonial', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}

export async function PUT(req: Request) {
    try {
        const { response } = await requireAdmin()
        if (response) return response

        const url = new URL(req.url)
        const id = url.pathname.split('/').pop()
        if (!id) return apiError('Not found', HTTP_STATUS.NOT_FOUND)

        const body = await req.json()
        const approved = body?.approved === true
        const content = typeof body?.content === 'string' ? body.content.trim() : undefined
        const archived = typeof body?.archived === 'boolean' ? body.archived : undefined
        const hidden = typeof body?.hidden === 'boolean' ? body.hidden : undefined

        const updateData: any = {}
        if (approved !== undefined) updateData.approved = approved
        if (content !== undefined) updateData.content = content
        if (archived !== undefined) updateData.archived = archived
        if (hidden !== undefined) updateData.hidden = hidden

        const updated = await prisma.testimonial.update({ where: { id }, data: updateData })
        return apiResponse(updated)
    } catch (error) {
        return apiError('Failed to update testimonial', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}

export async function DELETE(req: Request) {
    try {
        const { response } = await requireAdmin()
        if (response) return response

        const url = new URL(req.url)
        const id = url.pathname.split('/').pop()
        if (!id) return apiError('Not found', HTTP_STATUS.NOT_FOUND)

        await prisma.testimonial.delete({ where: { id } })
        return apiResponse({ id })
    } catch (error) {
        return apiError('Failed to delete testimonial', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}
