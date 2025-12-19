import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import * as docs from '@/packages/lib/docs/service'

function parseCategory(raw: string | null | undefined) {
    if (!raw) return null
    const upper = String(raw).toUpperCase()
    if (upper === 'MAIN' || upper === 'USERS' || upper === 'HOSTING' || upper === 'INTEGRATIONS') return upper
    return null
}

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
            const doc = await docs.getDocById(id)
            if (!doc) return apiError('Doc not found', HTTP_STATUS.NOT_FOUND)
            return apiResponse(doc)
        }

        const doc = await docs.getDocById(id)
        if (!doc || doc.status !== 'PUBLISHED') {
            return apiError('Doc not found', HTTP_STATUS.NOT_FOUND)
        }
        return apiResponse(doc)
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to fetch doc',
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

        const parsedCategory =
            body.category !== undefined ? parseCategory(body.category) : undefined
        if (body.category !== undefined && !parsedCategory) {
            return apiError('Invalid category', HTTP_STATUS.BAD_REQUEST)
        }

        const payload: any = {
            ...body,
            category: parsedCategory ?? undefined,
            publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
            sortOrder: Number.isFinite(body.sortOrder) ? body.sortOrder : null,
        }

        if (body.authorId !== undefined) payload.authorId = body.authorId

        const updated = await docs.updateDoc(id, payload)

        return apiResponse(updated)
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to update doc',
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
        const deleted = await docs.deleteDoc(id)
        return apiResponse(deleted)
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to delete doc',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}
