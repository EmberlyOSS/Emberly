import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // ensure we know the user's role - some session setups omit role, so lookup by email if necessary
        let isAdmin = (session.user as any).role === 'ADMIN'
        if (!isAdmin && session.user?.email) {
            const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { role: true } })
            if (u && u.role === 'ADMIN') isAdmin = true
        }
        if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        // aggregate downloads per user from files (include all users so scoring is accurate)
        const downloads = await prisma.file.groupBy({ by: ['userId'], _sum: { downloads: true } })
        const clicks = await prisma.shortenedUrl.groupBy({ by: ['userId'], _sum: { clicks: true } })
        const fileCounts = await prisma.file.groupBy({ by: ['userId'], _count: { _all: true } })

        // merge by userId
        const map = new Map<string, { downloads: number; clicks: number; filesCount: number }>()
        downloads.forEach((d) => map.set(d.userId, { downloads: d._sum.downloads ?? 0, clicks: 0, filesCount: 0 }))
        clicks.forEach((c) => {
            const cur = map.get(c.userId) || { downloads: 0, clicks: 0, filesCount: 0 }
            cur.clicks = c._sum.clicks ?? 0
            map.set(c.userId, cur)
        })
        fileCounts.forEach((f) => {
            const cur = map.get(f.userId) || { downloads: 0, clicks: 0, filesCount: 0 }
            cur.filesCount = f._count._all ?? 0
            map.set(f.userId, cur)
        })

        // compute primary score (popularity) and a composite score that slightly rewards file count
        const FILE_COUNT_WEIGHT = 0.2
        const items = Array.from(map.entries()).map(([userId, v]) => {
            const downloads = Number(v.downloads || 0)
            const clicks = Number(v.clicks || 0)
            const filesCount = Number(v.filesCount || 0)
            const primaryScore = downloads + clicks
            const compositeScore = primaryScore + filesCount * FILE_COUNT_WEIGHT
            return { userId, downloads, clicks, filesCount, primaryScore, compositeScore }
        })
        // sort by composite score descending (break ties by primaryScore, then filesCount)
        items.sort((a, b) => {
            if (b.compositeScore !== a.compositeScore) return b.compositeScore - a.compositeScore
            if (b.primaryScore !== a.primaryScore) return b.primaryScore - a.primaryScore
            return b.filesCount - a.filesCount
        })
        const top = items.slice(0, 10)

        const userIds = top.map((t) => t.userId)
        const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, image: true, email: true } })
        const usersById = new Map(users.map((u) => [u.id, u]))

        // prepare enriched items with avgPerFile and include both primary and composite scores
        const enriched = top.map((t) => ({
            userId: t.userId,
            downloads: t.downloads,
            clicks: t.clicks,
            filesCount: t.filesCount || 0,
            primaryScore: t.primaryScore,
            compositeScore: t.compositeScore,
            avgPerFile: t.filesCount ? (t.primaryScore / t.filesCount) : t.primaryScore,
        }))

        // prepare totals and me info for everyone (admins also get these)
        const totalUsers = items.length

        // Resolve current user id from session (if present)
        let currentUserId: string | undefined = (session.user as any).id
        if (!currentUserId && session.user?.email) {
            const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
            if (u) currentUserId = u.id
        }

        const meEntry = items.find((it) => it.userId === currentUserId) || { userId: currentUserId || 'unknown', downloads: 0, clicks: 0, filesCount: 0, primaryScore: 0, compositeScore: 0 }
        // rank based on compositeScore (the ranking users see)
        const rank = items.filter((it) => it.compositeScore > meEntry.compositeScore).length + 1
        const me = {
            userId: meEntry.userId,
            downloads: meEntry.downloads || 0,
            clicks: meEntry.clicks || 0,
            filesCount: meEntry.filesCount || 0,
            primaryScore: meEntry.primaryScore || 0,
            compositeScore: meEntry.compositeScore || 0,
            avgPerFile: meEntry.filesCount ? (meEntry.primaryScore / meEntry.filesCount) : meEntry.primaryScore,
        }

        // build anonymized distribution (deciles) for privacy
        const bucketsCount = 10
        const groupSize = Math.max(1, Math.ceil(items.length / bucketsCount))
        const buckets: Array<{ label: string; count: number; avgScore: number }> = []
        for (let i = 0; i < bucketsCount; i++) {
            const start = i * groupSize
            const end = Math.min(start + groupSize, items.length)
            const slice = items.slice(start, end)
            const count = slice.length
            const avgScore = count > 0 ? Math.round(slice.reduce((s, x) => s + x.compositeScore, 0) / count) : 0
            const label = `${i * 10 + 1}-${Math.min((i + 1) * 10, 100)}%`
            buckets.push({ label, count, avgScore })
        }

        let userBucketIndex = -1
        const myIndex = items.findIndex((it) => it.userId === currentUserId)
        if (myIndex >= 0) userBucketIndex = Math.floor(myIndex / groupSize)

        // if the requester is admin, return the full top users list (with avgPerFile) plus metadata
        if (isAdmin) {
            const result = enriched.map((t) => ({ user: usersById.get(t.userId) || { id: t.userId }, downloads: t.downloads, clicks: t.clicks, filesCount: t.filesCount, primaryScore: t.primaryScore, compositeScore: t.compositeScore, avgPerFile: t.avgPerFile }))
            return NextResponse.json({ topUsers: result, me, rank, totalUsers, distribution: { buckets, userBucketIndex } })
        }

        // For non-admins, return the requesting user's stats and the anonymized distribution
        return NextResponse.json({ me, rank, totalUsers, distribution: { buckets, userBucketIndex } })
    } catch (err) {
        console.error('analytics/top-users error', err)
        return NextResponse.json({ error: 'Failed to fetch top users' }, { status: 500 })
    }
}
