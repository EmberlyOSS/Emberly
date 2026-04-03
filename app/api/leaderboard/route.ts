import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/packages/lib/database/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category') ?? 'contributors'

  try {
    if (category === 'discovery') {
      const profiles = await prisma.nexiumProfile.findMany({
        where: { isVisible: true },
        select: {
          id: true,
          title: true,
          availability: true,
          user: { select: { id: true, name: true, image: true, urlId: true, role: true, alphaUser: true } },
          _count: { select: { skills: true, signals: true } },
        },
        orderBy: { skills: { _count: 'desc' } },
        take: 10,
      })

      const leaderboard = profiles.map((p, i) => ({
        id: p.user.id,
        name: p.user.name,
        image: p.user.image,
        urlId: p.user.urlId,
        role: p.user.role,
        alphaUser: p.user.alphaUser,
        title: p.title,
        availability: p.availability,
        skillCount: p._count.skills,
        signalCount: p._count.signals,
        rank: i + 1,
      }))

      return NextResponse.json(leaderboard)
    }

    if (category === 'squads') {
      const squads = await prisma.nexiumSquad.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          _count: { select: { members: true } },
        },
        orderBy: { members: { _count: 'desc' } },
        take: 10,
      })

      const leaderboard = squads.map((s, i) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        slug: s.slug,
        memberCount: s._count.members,
        rank: i + 1,
      }))

      return NextResponse.json(leaderboard)
    }

    // Default: contributors (top file uploaders)
    const users = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u.name, 
        u.image, 
        u."urlId", 
        u.role,
        u."alphaUser",
        COUNT(f.id) as file_count
      FROM "User" u
      LEFT JOIN "File" f ON u.id = f."userId" AND f.visibility = 'PUBLIC'
      WHERE u."isProfilePublic" = true
      GROUP BY u.id
      ORDER BY file_count DESC
      LIMIT 10
    ` as any[]

    const leaderboard = users.map((user, index) => ({
      id: user.id,
      name: user.name,
      image: user.image,
      urlId: user.urlId,
      role: user.role,
      alphaUser: user.alphaUser,
      fileCount: Number(user.file_count),
      rank: index + 1,
    }))

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error('Leaderboard API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
