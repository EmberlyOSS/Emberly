import { NextResponse } from 'next/server'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { planKeyForProduct, hasAnalytics, hasAdvancedAnalytics } from '@/packages/lib/plans'

export async function GET(req: Request) {
    try {
        const { user, response } = await requireAuth(req)
    if (response) return response

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // find latest subscription (if any) and its product
        const subscription = await prisma.subscription.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: { product: true },
        })

        const plan = planKeyForProduct(subscription?.product ?? null)

        // Basic aggregates
        const [totalFiles, fileSums, totalUrls, urlClicksSum, domainsCount, verifiedDomains] = await Promise.all([
            prisma.file.count({ where: { userId: user.id } }),
            prisma.file.aggregate({ where: { userId: user.id }, _sum: { size: true } }),
            prisma.shortenedUrl.count({ where: { userId: user.id } }),
            prisma.shortenedUrl.aggregate({ where: { userId: user.id }, _sum: { clicks: true } }),
            prisma.customDomain.count({ where: { userId: user.id } }),
            prisma.customDomain.count({ where: { userId: user.id, verified: true } }),
        ]).catch(async (e) => {
            // Some Prisma versions might not support combined _sum fields in TS inference above; fallback to individual queries
            const totalFiles = await prisma.file.count({ where: { userId: user.id } })
            const sizeAgg = await prisma.file.aggregate({ where: { userId: user.id }, _sum: { size: true } })
            const totalUrls = await prisma.shortenedUrl.count({ where: { userId: user.id } })
            const urlClicks = await prisma.shortenedUrl.aggregate({ where: { userId: user.id }, _sum: { clicks: true } })
            const domainsCount = await prisma.customDomain.count({ where: { userId: user.id } })
            const verifiedDomains = await prisma.customDomain.count({ where: { userId: user.id, verified: true } })
            return [totalFiles, sizeAgg, totalUrls, urlClicks, domainsCount, verifiedDomains]
        })

        // fileSums._sum.size may be null
        const storageUsed = (fileSums as any)?._sum?.size ?? dbUser.storageUsed ?? 0

        // Additional aggregates: total views and downloads across all files
        const viewsAgg = await prisma.file.aggregate({ where: { userId: user.id }, _sum: { views: true } })
        const downloadsAgg = await prisma.file.aggregate({ where: { userId: user.id }, _sum: { downloads: true } })
        const totalViews = (viewsAgg as any)?._sum?.views ?? 0
        const totalDownloads = (downloadsAgg as any)?._sum?.downloads ?? 0

        const result: any = {
            plan,
            basic: {
                totalFiles,
                storageUsed,
                totalUrls,
                totalUrlClicks: (urlClicksSum as any)?._sum?.clicks ?? 0,
                totalViews,
                totalDownloads,
                domainsCount,
                verifiedDomains,
            },
            allowed: {
                topFiles: hasAnalytics(plan),
                topUrls: hasAnalytics(plan),
                recentUploads: true, // available to all
                detailedList: hasAdvancedAnalytics(plan),
            },
        }

        // Add optional lists depending on plan
        if (result.allowed.recentUploads) {
            const recentUploads = await prisma.file.findMany({
                where: { userId: user.id },
                orderBy: { uploadedAt: 'desc' },
                take: 5,
                select: { id: true, name: true, size: true, uploadedAt: true, views: true, downloads: true },
            })
            result.recentUploads = recentUploads
        }

        // uploads per day (last 14 days)
        try {
            const days = 14
            const now = new Date()
            const since = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
            const uploads = await prisma.file.findMany({
                where: { userId: user.id, uploadedAt: { gte: since } },
                select: { uploadedAt: true },
            })

            const counts: Record<string, number> = {}
            for (let i = 0; i < days; i++) {
                const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000)
                const k = d.toISOString().slice(0, 10)
                counts[k] = 0
            }
            uploads.forEach((u) => {
                const k = new Date(u.uploadedAt).toISOString().slice(0, 10)
                counts[k] = (counts[k] || 0) + 1
            })

            result.uploadsPerDay = Object.keys(counts).map((k) => ({ date: k, count: counts[k] }))
        } catch (e) {
            // ignore timeseries failure
            result.uploadsPerDay = []
        }

        if (result.allowed.topFiles) {
            const topFiles = await prisma.file.findMany({
                where: { userId: user.id },
                orderBy: { views: 'desc' },
                take: 5,
                select: { id: true, name: true, size: true, uploadedAt: true, views: true, downloads: true },
            })
            result.topFiles = topFiles
        }

        // top files by storage (largest files)
        try {
            const topStorageFiles = await prisma.file.findMany({
                where: { userId: user.id },
                orderBy: { size: 'desc' },
                take: 5,
                select: { id: true, name: true, size: true, uploadedAt: true, views: true, downloads: true },
            })
            result.topStorageFiles = topStorageFiles
        } catch (e) {
            // ignore
        }

        if (result.allowed.topUrls) {
            const topUrls = await prisma.shortenedUrl.findMany({ where: { userId: user.id }, orderBy: { clicks: 'desc' }, take: 5 })
            result.topUrls = topUrls
        }

        if (result.allowed.detailedList) {
            const files = await prisma.file.findMany({ where: { userId: user.id }, orderBy: { uploadedAt: 'desc' }, take: 100, select: { id: true, name: true, size: true, uploadedAt: true, views: true, downloads: true } })
            result.files = files
        }

        return NextResponse.json(result)
    } catch (err) {
        console.error('analytics summary error', err)
        return NextResponse.json({ error: 'Internal' }, { status: 500 })
    }
}
