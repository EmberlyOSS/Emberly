import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.files || console

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const all = url.searchParams.get('all') === 'true'

        if (all) {
            const { response } = await requireAdmin()
            if (response) return response
            const partners = await prisma.partner.findMany({ orderBy: { sortOrder: 'asc' } })
            return apiResponse(partners)
        }

        const partners = await prisma.partner.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } })
        return apiResponse(partners)
    } catch (error) {
        logger.error('Error fetching partners', error as Error)
        return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}

export async function POST(req: Request) {
    try {
        const { response } = await requireAdmin()
        if (response) return response

        const json = await req.json()
        const { name, tagline, url, imagePath, active, sortOrder } = json

        if (!name) return apiError('Name is required', HTTP_STATUS.BAD_REQUEST)

        const partner = await prisma.partner.create({
            data: {
                name,
                tagline: tagline || null,
                url: url || null,
                imagePath: imagePath || null,
                active: active !== undefined ? Boolean(active) : true,
                sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
            },
        })

        return apiResponse(partner)
    } catch (error) {
        logger.error('Error creating partner', error as Error)
        return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}
