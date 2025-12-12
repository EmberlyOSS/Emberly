import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'

function planKeyForProduct(product: { id?: string | null; slug?: string | null; stripeProductId?: string | null } | null) {
    if (!product) return 'free'
    const p = (product.slug || product.stripeProductId || '').toLowerCase()
    if (p.includes('pro')) return 'pro'
    if (p.includes('starter')) return 'starter'
    if (p.includes('free')) return 'free'
    return 'starter'
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // find latest subscription (if any) and its product
        const subscription = await prisma.subscription.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: { product: true },
        })

        const plan = planKeyForProduct(subscription?.product ?? null)

        // Basic aggregates
        // Basic aggregates
        const [totalFiles, fileSums, totalUrls, urlClicksSum, domainsCount, verifiedDomains] = await Promise.all([
            prisma.file.count({ where: { userId: user.id } }),
            prisma.file.aggregate({ where: { userId: user.id }, _sum: { size: true }, _sum2: undefined as any }),
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
        const storageUsed = (fileSums as any)?._sum?.size ?? user.storageUsed ?? 0

        // Additional aggregates: total views and downloads across all files
        const viewsAgg = await prisma.file.aggregate({ where: { userId: user.id }, _sum: { views: true } })
        const downloadsAgg = await prisma.file.aggregate({ where: { userId: user.id }, _sum: { downloads: true } })
        const totalViews = (viewsAgg as any)?._sum?.views ?? 0
        const totalDownloads = (downloadsAgg as any)?._sum?.downloads ?? 0

        const response: any = {
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
                topFiles: plan === 'starter' || plan === 'pro',
                topUrls: plan === 'starter' || plan === 'pro',
                recentUploads: true, // available to all
                detailedList: plan === 'pro',
            },
        }

        // Add optional lists depending on plan
        if (response.allowed.recentUploads) {
            const recentUploads = await prisma.file.findMany({
                where: { userId: user.id },
                orderBy: { uploadedAt: 'desc' },
                take: 5,
                select: { id: true, name: true, size: true, uploadedAt: true, views: true, downloads: true },
            })
            response.recentUploads = recentUploads
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

            response.uploadsPerDay = Object.keys(counts).map((k) => ({ date: k, count: counts[k] }))
        } catch (e) {
            // ignore timeseries failure
            response.uploadsPerDay = []
        }

        if (response.allowed.topFiles) {
            const topFiles = await prisma.file.findMany({
                where: { userId: user.id },
                orderBy: { views: 'desc' },
                take: 5,
                select: { id: true, name: true, size: true, uploadedAt: true, views: true, downloads: true },
            })
            response.topFiles = topFiles
        }

        // top files by storage (largest files)
        try {
            const topStorageFiles = await prisma.file.findMany({
                where: { userId: user.id },
                orderBy: { size: 'desc' },
                take: 5,
                select: { id: true, name: true, size: true, uploadedAt: true, views: true, downloads: true },
            })
            response.topStorageFiles = topStorageFiles
        } catch (e) {
            // ignore
        }

        if (response.allowed.topUrls) {
            const topUrls = await prisma.shortenedUrl.findMany({ where: { userId: user.id }, orderBy: { clicks: 'desc' }, take: 5 })
            response.topUrls = topUrls
        }

        if (response.allowed.detailedList) {
            const files = await prisma.file.findMany({ where: { userId: user.id }, orderBy: { uploadedAt: 'desc' }, take: 100, select: { id: true, name: true, size: true, uploadedAt: true, views: true, downloads: true } })
            response.files = files
        }

        return NextResponse.json(response)
    } catch (err) {
        console.error('analytics summary error', err)
        return NextResponse.json({ error: 'Internal' }, { status: 500 })
    }
}
