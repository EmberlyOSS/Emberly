import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'
import {
  planKeyForProduct,
  hasAnalytics,
  hasAdvancedAnalytics,
} from '@/lib/plans'
import { getFeaturePlan } from '@/lib/plans/features'
import { calculateDomainSlotBonus } from '@/lib/perks'
import {
  getEffectiveQuotaMB,
  getPlanLimits,
  getPurchasedDomainSlots,
} from '@/lib/storage/quota'

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    // Without a user every query below would aggregate (and list) all users' files
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId = user.id
    // some session setups don't include `id` on `user`; fallback to lookup by email
    if (!userId && user?.email) {
      const u = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      })
      if (u) userId = u.id
    }

    const where = userId ? { userId } : undefined

    const [
      totalFiles,
      totalUrls,
      storageAgg,
      topUrls,
      topFiles,
      recentUploads,
      topStorageFiles,
      totalsAgg,
      urlClicksAgg,
      domainsCount,
      verifiedDomainsCount,
    ] = await Promise.all([
      prisma.file.count({ where }),
      prisma.shortenedUrl.count({ where }),
      prisma.file.aggregate({ where, _sum: { size: true } }),
      prisma.shortenedUrl.findMany({
        where,
        orderBy: { clicks: 'desc' },
        take: 5,
        select: { id: true, shortCode: true, targetUrl: true, clicks: true },
      }),
      prisma.file.findMany({
        where,
        orderBy: { views: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          views: true,
          downloads: true,
          uploadedAt: true,
        },
      }),
      prisma.file.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        take: 10,
        select: { id: true, name: true, size: true, uploadedAt: true },
      }),
      prisma.file.findMany({
        where,
        orderBy: { size: 'desc' },
        take: 10,
        select: { id: true, name: true, size: true },
      }),
      prisma.file.aggregate({ where, _sum: { views: true, downloads: true } }),
      prisma.shortenedUrl.aggregate({ where, _sum: { clicks: true } }),
      prisma.customDomain.count({ where: { ...(userId ? { userId } : {}) } }),
      prisma.customDomain.count({
        where: {
          ...(userId ? { userId, verified: true } : { verified: true }),
        },
      }),
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

      const count = await prisma.file.count({
        where: { ...(where || {}), uploadedAt: { gte: start, lt: end } },
      })
      uploadsPerDay.push({ date: start.toISOString().slice(0, 10), count })
    }

    const storageUsedMB = storageAgg._sum?.size ?? 0
    const totalViews = totalsAgg._sum?.views ?? 0
    const totalDownloads = totalsAgg._sum?.downloads ?? 0

    // compute allowed features and quota info for the viewer (plan-based gating)
    const allowed = { topFiles: false, topUrls: false, exportCSV: false }
    let quotaInfo: {
      quotaMB: number
      usedMB: number
      remainingMB: number
      percentageUsed: number
    } | null = null
    let planInfo: {
      planName: string
      uploadSizeCapMB: number | null
      customDomainsLimit: number | null
      /** Plan limit plus granted/purchased slots and perk bonuses; null = unlimited */
      customDomainsAllowed: number | null
      storageQuotaGB: number | null
    } | null = null

    if (user) {
      const subs = await prisma.subscription.findMany({
        where: { userId: user?.id, status: 'active' },
        include: { product: true },
      })
      const bestPlan = await getFeaturePlan(
        subs.map((s) => planKeyForProduct(s.product)).sort()[0] || 'free'
      )
      allowed.topFiles = hasAnalytics(bestPlan)
      allowed.topUrls = hasAnalytics(bestPlan)
      allowed.exportCSV = hasAdvancedAnalytics(bestPlan)

      // Fetch quota and plan limit info (non-critical)
      if (userId) {
        try {
          const [quota, limits, extraDomainSlots, perkUser] = await Promise.all(
            [
              getEffectiveQuotaMB(userId),
              getPlanLimits(userId),
              getPurchasedDomainSlots(userId),
              prisma.user.findUnique({
                where: { id: userId },
                select: { perkRoles: true },
              }),
            ]
          )
          quotaInfo = {
            quotaMB: quota.quotaMB,
            usedMB: quota.usedMB,
            remainingMB: quota.remainingMB,
            percentageUsed: quota.percentageUsed,
          }
          planInfo = {
            planName: limits.planName,
            uploadSizeCapMB: limits.uploadSizeCapMB,
            customDomainsLimit: limits.customDomainsLimit,
            customDomainsAllowed:
              limits.customDomainsLimit === null
                ? null
                : limits.customDomainsLimit +
                  extraDomainSlots +
                  calculateDomainSlotBonus(perkUser?.perkRoles || []),
            storageQuotaGB: limits.storageQuotaGB,
          }
        } catch (e) {
          // non-critical — continue without quota info
        }
      }
    }

    const totalUrlClicks = urlClicksAgg._sum?.clicks ?? 0

    return NextResponse.json({
      basic: {
        totalFiles,
        totalUrls,
        totalUrlClicks,
        storageUsed: storageUsedMB,
        totalViews,
        totalDownloads,
        domainsCount: domainsCount,
        verifiedDomains: verifiedDomainsCount,
      },
      uploadsPerDay,
      // Only include gated data when the plan allows it
      topUrls: allowed.topUrls ? topUrls : [],
      topFiles: allowed.topFiles ? topFiles : [],
      recentUploads,
      topStorageFiles,
      allowed,
      quotaInfo,
      planInfo,
    })
  } catch (err) {
    console.error('analytics/overview error', err)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
