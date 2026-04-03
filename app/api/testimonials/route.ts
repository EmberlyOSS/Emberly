import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth, getAuthenticatedUser, requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const all = url.searchParams.get('all') === 'true'
        const mine = url.searchParams.get('mine') === 'true'

        if (mine) {
            const { user, response } = await requireAuth(req)
            if (response) return response
            const t = await prisma.testimonial.findUnique({ where: { userId: user.id } })
            return apiResponse(t ?? null)
        }

        if (all) {
            const { response } = await requireAdmin()
            if (response) return response
            const testimonials = await prisma.testimonial.findMany({
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, name: true, urlId: true } } },
            })
            return apiResponse(testimonials)
        }

        const testimonials = await prisma.testimonial.findMany({
            where: { approved: true, archived: false, hidden: false },
            orderBy: { createdAt: 'desc' },
            take: 6,
            include: { user: { select: { id: true, name: true, urlId: true, image: true } } },
        })

        const shaped = testimonials.map((t) => ({
            id: t.id,
            content: t.content,
            rating: t.rating ?? undefined,
            createdAt: t.createdAt,
            user: t.user,
        }))

        return apiResponse(shaped)
    } catch (error) {
        return apiError('Failed to load testimonials', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}

export async function POST(req: Request) {
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response
        if (!user) return apiError('Unauthorized', HTTP_STATUS.UNAUTHORIZED)

        const body = await req.json()
        const content = (body?.content ?? '').toString().trim()
        const rating = typeof body?.rating === 'number' ? Math.max(1, Math.min(5, Number(body.rating))) : null

        if (!content) return apiError('Content is required', HTTP_STATUS.BAD_REQUEST)
        if (content.length > 1000) return apiError('Content too long (max 1000 chars)', HTTP_STATUS.BAD_REQUEST)

        // Prevent more than one testimonial per user
        const existing = await prisma.testimonial.findUnique({ where: { userId: user.id } })
        if (existing) {
            return apiError('You have already submitted a testimonial. Edit or delete your existing one.', HTTP_STATUS.BAD_REQUEST)
        }

        const created = await prisma.testimonial.create({
            data: {
                userId: user.id,
                content,
                rating: rating ?? undefined,
                approved: false,
            },
            include: { user: { select: { id: true, name: true, urlId: true } } },
        })

        void events.emit('testimonial.submitted', {
            testimonialId: created.id,
            userId: user.id,
            userName: user.name || 'Unknown',
            userEmail: user.email || '',
            contentPreview: content.slice(0, 100),
        }).catch(() => {})

        return apiResponse(created)
    } catch (error) {
        return apiError('Failed to submit testimonial', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}

export async function PUT(req: Request) {
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response
        if (!user) return apiError('Unauthorized', HTTP_STATUS.UNAUTHORIZED)

        const body = await req.json()
        const content = typeof body?.content === 'string' ? body.content.trim() : undefined
        const rating = typeof body?.rating === 'number' ? Math.max(1, Math.min(5, Number(body.rating))) : undefined
        const archived = typeof body?.archived === 'boolean' ? body.archived : undefined

        const existing = await prisma.testimonial.findUnique({ where: { userId: user.id } })
        if (!existing) return apiError('Testimonial not found', HTTP_STATUS.NOT_FOUND)

        const updated = await prisma.testimonial.update({
            where: { id: existing.id },
            data: {
                ...(content !== undefined && { content }),
                ...(rating !== undefined && { rating }),
                ...(archived !== undefined && { archived }),
            },
        })

        void events.emit('testimonial.edited', {
            testimonialId: existing.id,
            userId: user.id,
            userName: user.name || 'Unknown',
            userEmail: user.email || '',
            contentPreview: (content ?? existing.content).slice(0, 100),
        }).catch(() => {})

        return apiResponse(updated)
    } catch (error) {
        return apiError('Failed to update testimonial', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}

export async function DELETE(req: Request) {
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response
        if (!user) return apiError('Unauthorized', HTTP_STATUS.UNAUTHORIZED)

        const existing = await prisma.testimonial.findUnique({ where: { userId: user.id } })
        if (!existing) return apiError('Testimonial not found', HTTP_STATUS.NOT_FOUND)

        await prisma.testimonial.delete({ where: { id: existing.id } })
        return apiResponse({ id: existing.id })
    } catch (error) {
        return apiError('Failed to delete testimonial', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}
