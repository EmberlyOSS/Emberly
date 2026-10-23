import { NextResponse } from 'next/server'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'

export async function GET(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response
    const userId = user.id

    const [topFiles, topUrls] = await Promise.all([
      prisma.file.findMany({
        where: { userId },
        orderBy: { downloads: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          downloads: true,
          urlPath: true,
          userId: true,
        },
      }),
      prisma.shortenedUrl.findMany({
        where: { userId },
        orderBy: { clicks: 'desc' },
        take: 10,
        select: {
          id: true,
          shortCode: true,
          targetUrl: true,
          clicks: true,
          userId: true,
        },
      }),
    ])

    return NextResponse.json({ topFiles, topUrls })
  } catch (err) {
    console.error('analytics/top-items error', err)
    return NextResponse.json(
      { error: 'Failed to fetch top items' },
      { status: 500 }
    )
  }
}
