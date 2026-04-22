import { NextResponse } from 'next/server'

import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.api

export async function GET(req: Request) {
  try {
    const { user: adminUser, response } = await requireAdmin(req)
    if (response) return response

    const user = await prisma.user.findUnique({
      where: { id: adminUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        urlId: true,
        vanityId: true,
        image: true,
        bio: true,
        website: true,
        isProfilePublic: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Also try to look up the user using the search logic from the public profile endpoint
    const searchResults = await prisma.user.findFirst({
      where: {
        OR: [
          { urlId: user.name || '' },
          { vanityId: user.name || '' },
          { name: { equals: user.name || '', mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        urlId: true,
        vanityId: true,
      },
    })

    return NextResponse.json({
      currentUser: user,
      publicProfileUrl: user.urlId 
        ? `/user/${user.urlId}`
        : user.vanityId
        ? `/user/${user.vanityId}`
        : user.name
        ? `/user/${user.name}`
        : 'No public profile available',
      canBeFound: searchResults ? true : false,
      searchQuery: {
        lookingFor: user.name,
        foundUser: searchResults,
      },
    })
  } catch (error) {
    logger.error('Debug profile lookup error:', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
