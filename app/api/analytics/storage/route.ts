import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let userId = (session.user as any).id
        if (!userId && session.user?.email) {
            const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
            if (u) userId = u.id
        }

        // total bytes (current)
        const totalAgg = await prisma.file.aggregate({ where: { userId }, _sum: { size: true } })
        const totalBytes = totalAgg._sum.size ?? 0

        // daily uploads (sum of sizes per day) for last 14 days
        const days = 14
        const now = new Date()
        const daily: Array<{ date: string; bytes: number }> = []
        for (let i = days - 1; i >= 0; i--) {
            const start = new Date(now)
            start.setHours(0, 0, 0, 0)
            start.setDate(now.getDate() - i)
            const end = new Date(start)
            end.setDate(start.getDate() + 1)

            // eslint-disable-next-line no-await-in-loop
            const sum = await prisma.file.aggregate({ where: { userId, uploadedAt: { gte: start, lt: end } }, _sum: { size: true } })
            daily.push({ date: start.toISOString().slice(0, 10), bytes: sum._sum.size ?? 0 })
        }

        // breakdown by mime type from files table (current state)
        const byType = await prisma.file.groupBy({ by: ['mimeType'], where: { userId }, _sum: { size: true }, orderBy: { _sum: { size: 'desc' } }, take: 10 })
        const breakdown = byType.map((b) => ({ mimeType: b.mimeType, bytes: b._sum.size ?? 0 }))

        return NextResponse.json({ totalBytes, daily, breakdown })
    } catch (err) {
        console.error('analytics/storage error', err)
        return NextResponse.json({ error: 'Failed to fetch storage metrics' }, { status: 500 })
    }
}
