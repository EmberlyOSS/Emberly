import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'

export async function GET(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const userId = user.id

    // total storage used (sum of File.size, which is stored in MB)
    const totalAgg = await prisma.file.aggregate({
      where: { userId },
      _sum: { size: true },
    })
    const totalMB = totalAgg._sum.size ?? 0

    // daily uploads (sum of sizes per day) for last 14 days
    const days = 14
    const now = new Date()
    const daily: Array<{ date: string; mb: number }> = []
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      start.setDate(now.getDate() - i)
      const end = new Date(start)
      end.setDate(start.getDate() + 1)

      const sum = await prisma.file.aggregate({
        where: { userId, uploadedAt: { gte: start, lt: end } },
        _sum: { size: true },
      })
      daily.push({
        date: start.toISOString().slice(0, 10),
        mb: sum._sum.size ?? 0,
      })
    }

    // breakdown by mime type from files table (current state)
    const byType = await prisma.file.groupBy({
      by: ['mimeType'],
      where: { userId },
      _sum: { size: true },
      orderBy: { _sum: { size: 'desc' } },
      take: 10,
    })
    const breakdown = byType.map((b) => ({
      mimeType: b.mimeType,
      mb: b._sum.size ?? 0,
    }))

    return NextResponse.json({ totalMB, daily, breakdown })
  } catch (err) {
    console.error('analytics/storage error', err)
    return NextResponse.json(
      { error: 'Failed to fetch storage metrics' },
      { status: 500 }
    )
  }
}
