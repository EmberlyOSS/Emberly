import { NextResponse } from 'next/server'
import { prisma } from '@/packages/lib/database/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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
      LIMIT 5
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
