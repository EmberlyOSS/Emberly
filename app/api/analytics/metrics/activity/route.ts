import { NextResponse } from 'next/server'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'

export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  try {
    const days = 30
    const now = new Date()
    const uploads: Array<{ date: string; count: number }> = []
    const urls: Array<{ date: string; count: number }> = []

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      start.setDate(now.getDate() - i)
      const end = new Date(start)
      end.setDate(start.getDate() + 1)

      const ucount = await prisma.file.count({
        where: { userId: user.id, uploadedAt: { gte: start, lt: end } },
      })

      const rcount = await prisma.shortenedUrl.count({
        where: { userId: user.id, createdAt: { gte: start, lt: end } },
      })
      uploads.push({ date: start.toISOString().slice(0, 10), count: ucount })
      urls.push({ date: start.toISOString().slice(0, 10), count: rcount })
    }

    // Note: downloads/views time series are not available from the current schema
    // because downloads/views are stored as counters on records rather than per-event rows.
    // Return flags to indicate unavailability and provide creation time-series as a fallback.
    return NextResponse.json({
      dailyUploads: uploads,
      dailyUrlCreations: urls,
      downloadsTimeSeriesAvailable: false,
      viewsTimeSeriesAvailable: false,
    })
  } catch (err) {
    console.error('analytics/metrics/activity error', err)
    return NextResponse.json(
      { error: 'Failed to fetch activity metrics' },
      { status: 500 }
    )
  }
}
