import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import * as legal from '@/packages/lib/legal/service'

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const { searchParams } = new URL(request.url)
        const adminView = searchParams.get('admin') === 'true'

        if (adminView) {
            const { user, response } = await requireAuth(request)
            if (response) return response
            if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
                return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
            }
            const page = await legal.getLegalById(id)
            if (!page) return apiError('Legal page not found', HTTP_STATUS.NOT_FOUND)
            return apiResponse(page)
        }

        const page = await legal.getLegalById(id)
        if (!page || page.status !== 'PUBLISHED') {
            return apiError('Legal page not found', HTTP_STATUS.NOT_FOUND)
        }
        return apiResponse(page)
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to fetch legal page',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { user, response } = await requireAuth(request)
        if (response) return response
        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
            return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
        }

        const { id } = await context.params
        const body = await request.json()

        const payload: any = {
            ...body,
            slug: body.slug ? String(body.slug).toLowerCase() : undefined,
            publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
            sortOrder: Number.isFinite(body.sortOrder) ? body.sortOrder : null,
        }

        if (body.authorId !== undefined) payload.authorId = body.authorId

        const updated = await legal.updateLegal(id, payload)
        return apiResponse(updated)
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to update legal page',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { user, response } = await requireAuth(request)
        if (response) return response
        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
            return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
        }

        const { id } = await context.params
        const deleted = await legal.deleteLegal(id)
        return apiResponse(deleted)
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to delete legal page',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}
