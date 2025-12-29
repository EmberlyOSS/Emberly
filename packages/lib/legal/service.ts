import { Prisma } from '@/prisma/generated/prisma/client'

import { prisma } from '@/packages/lib/database/prisma'

export type CreateLegalInput = {
    slug: string
    title: string
    content: string
    excerpt?: string | null
    status?: Prisma.LegalStatus | string
    publishedAt?: Date | null
    sortOrder?: number | null
    authorId?: string | null
}

export type ListLegalOptions = {
    publishedOnly?: boolean
    limit?: number
    offset?: number
}

export async function getLegalBySlug(slug: string, publishedOnly = true) {
    const normalized = slug.trim().toLowerCase()
    const where: Prisma.LegalPageWhereInput = { slug: normalized }
    if (publishedOnly) where.status = 'PUBLISHED'

    return prisma.legalPage.findFirst({
        where,
        include: {
            author: { select: { id: true, name: true, urlId: true, image: true } },
        },
    })
}

export async function getLegalById(id: string) {
    return prisma.legalPage.findUnique({
        where: { id },
        include: {
            author: { select: { id: true, name: true, urlId: true, image: true } },
        },
    })
}

export async function listLegal(opts?: ListLegalOptions) {
    const { publishedOnly = true, limit = 50, offset = 0 } = opts || {}

    const where: Prisma.LegalPageWhereInput = {}
    if (publishedOnly) where.status = 'PUBLISHED'

    return prisma.legalPage.findMany({
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

export async function createLegal(data: CreateLegalInput) {
    return prisma.legalPage.create({
        data: {
            slug: data.slug,
            title: data.title,
            content: data.content,
            excerpt: data.excerpt ?? null,
            status: (data.status as Prisma.LegalStatus) ?? 'DRAFT',
            publishedAt: data.publishedAt ?? null,
            sortOrder: data.sortOrder ?? null,
            author: data.authorId ? { connect: { id: data.authorId } } : undefined,
        },
    })
}

export async function updateLegal(id: string, data: Partial<CreateLegalInput>) {
    const updateData: Prisma.LegalPageUpdateInput = {}

    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt
    if (data.status !== undefined) updateData.status = data.status as Prisma.LegalStatus
    if (data.publishedAt !== undefined) updateData.publishedAt = data.publishedAt
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
    if (data.authorId !== undefined) {
        updateData.author = data.authorId ? { connect: { id: data.authorId } } : { disconnect: true }
    }

    return prisma.legalPage.update({ where: { id }, data: updateData })
}

export async function deleteLegal(id: string) {
    return prisma.legalPage.delete({ where: { id } })
}

export default {
    getLegalBySlug,
    getLegalById,
    listLegal,
    createLegal,
    updateLegal,
    deleteLegal,
}
