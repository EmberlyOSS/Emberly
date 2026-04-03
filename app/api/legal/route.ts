import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { hasPermission, Permission } from '@/packages/lib/permissions'
import * as legal from '@/packages/lib/legal/service'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const slug = searchParams.get('slug')?.trim() || null
        const all = searchParams.get('all') === 'true'

        // fetch single by slug
        if (slug) {
            if (searchParams.get('admin') === 'true') {
                const { user, response } = await requireAuth(request)
                if (response) return response
                if (!user || !hasPermission(user.role as any, Permission.MANAGE_SETTINGS)) {
                    return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
                }
                const page = await legal.getLegalBySlug(slug, false)
                if (!page) return apiError('Legal page not found', HTTP_STATUS.NOT_FOUND)
                return apiResponse(page)
            }

            const page = await legal.getLegalBySlug(slug, true)
            if (!page) return apiError('Legal page not found', HTTP_STATUS.NOT_FOUND)
            return apiResponse(page)
        }

        const pageNum = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = (pageNum - 1) * limit
        const publishedOnly = !all

        if (all) {
            const { user, response } = await requireAuth(request)
            if (response) return response
            if (!user || !hasPermission(user.role as any, Permission.MANAGE_SETTINGS)) {
                return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
            }
        }

        const list = await legal.listLegal({ publishedOnly, limit, offset })
        return apiResponse(list)
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to fetch legal pages',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}

export async function POST(request: Request) {
    try {
        const { user, response } = await requireAuth(request)
        if (response) return response

        if (!user || !hasPermission(user.role as any, Permission.MANAGE_SETTINGS)) {
            return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
        }

        const body = await request.json()
        const { slug, title, content, excerpt, status, publishedAt, sortOrder } = body || {}

        if (!slug || !title || !content) {
            return apiError('Missing required fields', HTTP_STATUS.BAD_REQUEST)
        }

        const created = await legal.createLegal({
            slug: String(slug).toLowerCase(),
            title,
            content,
            excerpt: excerpt ?? null,
            status: status ?? 'DRAFT',
            publishedAt: publishedAt ? new Date(publishedAt) : null,
            sortOrder: Number.isFinite(sortOrder) ? sortOrder : null,
            authorId: user.id,
        })

        return apiResponse(created)
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to create legal page',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}
