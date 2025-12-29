import { Prisma } from '@/prisma/generated/prisma/client'

import { prisma } from '@/packages/lib/database/prisma'

export type CreateDocInput = {
    category: Prisma.DocCategory | string
    slug: string
    title: string
    content: string
    excerpt?: string | null
    status?: Prisma.DocStatus | string
    publishedAt?: Date | null
    sortOrder?: number | null
    authorId?: string | null
}

export type ListDocsOptions = {
    category?: Prisma.DocCategory
    publishedOnly?: boolean
    limit?: number
    offset?: number
}

export type ResolvedDocSlug = {
    category: Prisma.DocCategory
    slug: string
}

export function inferCategoryAndSlug(slugInput: string | string[] | null | undefined): ResolvedDocSlug | null {
    if (!slugInput) return null
    const segments = Array.isArray(slugInput)
        ? slugInput
        : String(slugInput)
            .split('/')
            .map((s) => s.trim())
            .filter(Boolean)

    if (!segments.length) return null

    const [first, ...rest] = segments
    const lower = first.toLowerCase()

    if (lower === 'user' || lower === 'users') {
        return { category: 'USERS', slug: (rest.length ? rest : ['user']).join('/').toLowerCase() }
    }

    if (lower === 'hosting') {
        return { category: 'HOSTING', slug: (rest.length ? rest : ['index']).join('/').toLowerCase() }
    }

    if (lower === 'integrations' || lower === 'integration') {
        return { category: 'INTEGRATIONS', slug: (rest.length ? rest : ['index']).join('/').toLowerCase() }
    }

    if (lower === 'main') {
        return { category: 'MAIN', slug: (rest.length ? rest : ['index']).join('/').toLowerCase() }
    }

    return { category: 'MAIN', slug: segments.join('/').toLowerCase() }
}

function normalizeCategory(category: Prisma.DocCategory | string): Prisma.DocCategory {
    const upper = String(category).toUpperCase() as Prisma.DocCategory
    return upper
}

export async function getDocByCategorySlug(
    category: Prisma.DocCategory,
    slug: string,
    publishedOnly = true
) {
    const where: Prisma.DocPageWhereInput = { category, slug }
    if (publishedOnly) where.status = 'PUBLISHED'

    return prisma.docPage.findFirst({
        where,
        include: {
            author: { select: { id: true, name: true, urlId: true, image: true } },
        },
    })
}

export async function getDocById(id: string) {
    return prisma.docPage.findUnique({
        where: { id },
        include: {
            author: { select: { id: true, name: true, urlId: true, image: true } },
        },
    })
}

export async function listDocs(opts?: ListDocsOptions) {
    const { category, publishedOnly = true, limit = 50, offset = 0 } = opts || {}

    const where: Prisma.DocPageWhereInput = {}
    if (category) where.category = category
    if (publishedOnly) where.status = 'PUBLISHED'

    return prisma.docPage.findMany({
        where,
        orderBy: [
            { sortOrder: 'asc' },
            { publishedAt: 'desc' },
            { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
        include: {
            author: { select: { id: true, name: true, urlId: true, image: true } },
        },
    })
}

export async function createDoc(data: CreateDocInput) {
    const doc = await prisma.docPage.create({
        data: {
            category: normalizeCategory(data.category),
            slug: data.slug,
            title: data.title,
            content: data.content,
            excerpt: data.excerpt ?? null,
            status: (data.status as Prisma.DocStatus) ?? 'DRAFT',
            publishedAt: data.publishedAt ?? null,
            sortOrder: data.sortOrder ?? null,
            author: data.authorId ? { connect: { id: data.authorId } } : undefined,
        },
    })

    return doc
}

export async function updateDoc(id: string, data: Partial<CreateDocInput>) {
    const updateData: Prisma.DocPageUpdateInput = {}

    if (data.category !== undefined)
        updateData.category = normalizeCategory(data.category)
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt
    if (data.status !== undefined) updateData.status = data.status as Prisma.DocStatus
    if (data.publishedAt !== undefined) updateData.publishedAt = data.publishedAt
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
    if (data.authorId !== undefined)
        updateData.author = data.authorId
            ? { connect: { id: data.authorId } }
            : { disconnect: true }

    return prisma.docPage.update({ where: { id }, data: updateData })
}

export async function deleteDoc(id: string) {
    return prisma.docPage.delete({ where: { id } })
}

export default {
    getDocByCategorySlug,
    getDocById,
    listDocs,
    createDoc,
    updateDoc,
    deleteDoc,
}
