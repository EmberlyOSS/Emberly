import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { planKeyForProduct, hasAnalytics, hasAdvancedAnalytics } from '@/packages/lib/plans'

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)

    // prefer per-user metrics when authenticated (dashboard context)
    let userId = user?.id
    // some session setups don't include `id` on `user`; fallback to lookup by email
    if (!userId && user?.email) {
      const u = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } })
      if (u) userId = u.id
    }

    const where = userId ? { userId } : undefined

    const [totalFiles, totalUrls, storageAgg, topUrls, topFiles, recentUploads, topStorageFiles, totalsAgg, urlClicksAgg, domainsCount, verifiedDomainsCount] = await Promise.all([
      prisma.file.count({ where }),
      prisma.shortenedUrl.count({ where }),
      prisma.file.aggregate({ where, _sum: { size: true } }),
      prisma.shortenedUrl.findMany({ where, orderBy: { clicks: 'desc' }, take: 5, select: { id: true, shortCode: true, targetUrl: true, clicks: true } }),
      prisma.file.findMany({ where, orderBy: { views: 'desc' }, take: 10, select: { id: true, name: true, views: true, downloads: true, uploadedAt: true } }),
      prisma.file.findMany({ where, orderBy: { uploadedAt: 'desc' }, take: 10, select: { id: true, name: true, size: true, uploadedAt: true } }),
      prisma.file.findMany({ where, orderBy: { size: 'desc' }, take: 10, select: { id: true, name: true, size: true } }),
      prisma.file.aggregate({ where, _sum: { views: true, downloads: true } }),
      prisma.shortenedUrl.aggregate({ where, _sum: { clicks: true } }),
      prisma.customDomain.count({ where: { ...(userId ? { userId } : {}) } }),
      prisma.customDomain.count({ where: { ...(userId ? { userId, verified: true } : { verified: true }) } }),
    ])

    // Daily file uploads (last 14 days)
    const days = 14
    const now = new Date()
    const uploadsPerDay = [] as Array<{ date: string; count: number }>
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      start.setDate(now.getDate() - i)
      const end = new Date(start)
      end.setDate(start.getDate() + 1)

      // eslint-disable-next-line no-await-in-loop
      const count = await prisma.file.count({ where: { ...(where || {}), uploadedAt: { gte: start, lt: end } } })
      uploadsPerDay.push({ date: start.toISOString().slice(0, 10), count })
    }

    const storageUsedBytes = storageAgg._sum?.size ?? 0
    const totalViews = totalsAgg._sum?.views ?? 0
    const totalDownloads = totalsAgg._sum?.downloads ?? 0

    // compute allowed features for the viewer (plan-based gating)
    const allowed = { topFiles: false, topUrls: false, exportCSV: false }
    if (user) {
      const subs = await prisma.subscription.findMany({ where: { userId: user?.id, status: 'active' }, include: { product: true } })
      if (subs.length > 0) {
        const bestPlan = subs.map(s => planKeyForProduct(s.product)).sort()[0] || 'free'
        allowed.topFiles = hasAnalytics(bestPlan)
        allowed.topUrls = hasAnalytics(bestPlan)
        allowed.exportCSV = hasAdvancedAnalytics(bestPlan)
      }
    }

    const totalUrlClicks = urlClicksAgg._sum?.clicks ?? 0

    return NextResponse.json({
      basic: {
        totalFiles,
        totalUrls,
        totalUrlClicks,
        storageUsed: storageUsedBytes,
        totalViews,
        totalDownloads,
        domainsCount: domainsCount,
        verifiedDomains: verifiedDomainsCount,
      },
      uploadsPerDay,
      topUrls,
      topFiles,
      recentUploads,
      topStorageFiles,
      allowed,
    })
  } catch (err) {
    console.error('analytics/overview error', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
