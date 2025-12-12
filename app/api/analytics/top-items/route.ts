import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        // allow anonymous viewing, but only return user-owned items when authenticated
        let userId: string | undefined
        if (session?.user) {
            userId = (session.user as any).id
            if (!userId && session.user.email) {
                const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
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
