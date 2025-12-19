import { DocCategory } from '@prisma/client'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { inferCategoryAndSlug } from '@/packages/lib/docs/service'
import * as docs from '@/packages/lib/docs/service'

function parseCategory(raw: string | null): DocCategory | null {
    if (!raw) return null
    const upper = raw.toUpperCase() as DocCategory
    if (upper === 'MAIN' || upper === 'USERS' || upper === 'HOSTING' || upper === 'INTEGRATIONS') return upper
    return null
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const slug = searchParams.get('slug')
        const categoryParam = parseCategory(searchParams.get('category'))
        const all = searchParams.get('all') === 'true'

        // fetch single by slug/category
        if (slug) {
            const inferred = categoryParam ? { category: categoryParam, slug } : inferCategoryAndSlug(slug)
            if (!inferred) return apiError('category is required', HTTP_STATUS.BAD_REQUEST)
            const category = inferred.category
            const normalizedSlug = inferred.slug

            if (searchParams.get('admin') === 'true') {
                const { user, response } = await requireAuth(request)
                if (response) return response
                if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
                    return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
                }
                const doc = await docs.getDocByCategorySlug(category, normalizedSlug, false)
                if (!doc) return apiError('Doc not found', HTTP_STATUS.NOT_FOUND)
                return apiResponse(doc)
            }

            const doc = await docs.getDocByCategorySlug(category, normalizedSlug, true)
            if (!doc) return apiError('Doc not found', HTTP_STATUS.NOT_FOUND)
            return apiResponse(doc)
        }

        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = (page - 1) * limit
        const publishedOnly = !all

        if (all) {
            const { user, response } = await requireAuth(request)
            if (response) return response
            if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
                return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
            }
        }

        const list = await docs.listDocs({
            category: categoryParam || undefined,
            publishedOnly,
            limit,
            offset,
        })

        return apiResponse(list)
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to fetch docs',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}

export async function POST(request: Request) {
    try {
        const { user, response } = await requireAuth(request)
        if (response) return response

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
            return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
        }

        const body = await request.json()
        const { category, slug, title, content, excerpt, status, publishedAt, sortOrder } = body

        const parsedCategory = parseCategory(category)
        if (!parsedCategory) return apiError('Invalid category', HTTP_STATUS.BAD_REQUEST)
        if (!slug || !title || !content) {
            return apiError('Missing required fields', HTTP_STATUS.BAD_REQUEST)
        }

        const created = await docs.createDoc({
            category: parsedCategory,
            slug,
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
            error instanceof Error ? error.message : 'Failed to create doc',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}
