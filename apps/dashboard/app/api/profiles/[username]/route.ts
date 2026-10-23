import { NextResponse } from 'next/server'
import { prisma } from '@emberly/db'
import { loggers } from '@/lib/logger'

const logger = loggers.api

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  let username = 'unknown'

  try {
    ;({ username } = await params)
    logger.info('Fetching public profile', { username })

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { urlId: username },
          { vanityId: username },
          { name: { equals: username, mode: 'insensitive' } },
        ],
        // Only show if profile is public
        isProfilePublic: true,
      },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        website: true,
        createdAt: true,
        perkRoles: true,
        urlId: true,
        vanityId: true,
        _count: {
          select: {
            files: {
              where: { visibility: 'PUBLIC' },
            },
          },
        },
      },
    })

    if (!user) {
      logger.warn('User profile not found', { username })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    logger.info('User profile fetched', { userId: user.id, username })
    return NextResponse.json(user)
  } catch (error) {
    logger.error('Error fetching public profile:', error as Error, {
      username,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
