import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'

export async function GET(req: Request) {
    try {
        const user = await getAuthenticatedUser(req)

        // allow anonymous viewing, but only return user-owned items when authenticated
        let userId: string | undefined
        if (user) {
            userId = user?.id
            if (!userId && user.email) {
                const u = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } })
                if (u) userId = u.id
            }
        }

        const [topFiles, topUrls] = await Promise.all([
            prisma.file.findMany({
                where: userId ? { userId } : undefined,
                orderBy: { downloads: 'desc' },
                take: 10,
                select: { id: true, name: true, downloads: true, urlPath: true, userId: true },
            }),
            prisma.shortenedUrl.findMany({
                where: userId ? { userId } : undefined,
                orderBy: { clicks: 'desc' },
                take: 10,
                select: { id: true, shortCode: true, targetUrl: true, clicks: true, userId: true },
            }),
        ])

        return NextResponse.json({ topFiles, topUrls })
    } catch (err) {
        console.error('analytics/top-items error', err)
        return NextResponse.json({ error: 'Failed to fetch top items' }, { status: 500 })
    }
}
