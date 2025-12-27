import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { sessionCache } from '@/packages/lib/cache/session-cache'
import { prisma } from '@/packages/lib/database/prisma'

export type AuthenticatedUser = {
  id: string
  email: string
  name: string | null
  storageUsed: number
  storageQuotaMB?: number | null
  urlId: string
  role: string
  randomizeFileUrls: boolean
  preferredUploadDomain: string | null
}

export async function getAuthenticatedUser(
  req: Request
): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions)
  if (session?.user) {
    // Try cache first
    const cached = await sessionCache.getUserSession(session.user.id)
    if (cached) {
      return {
        id: cached.id,
        email: cached.email || '',
        name: cached.name,
        storageUsed: cached.storageUsed,
        storageQuotaMB: cached.storageQuotaMB,
        urlId: cached.urlId,
        role: cached.role,
        randomizeFileUrls: cached.randomizeFileUrls,
        preferredUploadDomain: cached.preferredUploadDomain,
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        storageUsed: true,
        storageQuotaMB: true,
        urlId: true,
        role: true,
        randomizeFileUrls: true,
        preferredUploadDomain: true,
        sessionVersion: true,
        image: true,
      },
    })

    if (user) {
      // Cache the session data
      await sessionCache.setUserSession(user.id, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
        sessionVersion: user.sessionVersion,
        urlId: user.urlId,
        storageUsed: user.storageUsed,
        storageQuotaMB: user.storageQuotaMB,
        randomizeFileUrls: user.randomizeFileUrls,
        preferredUploadDomain: user.preferredUploadDomain,
      })
    }

    return user
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)

    // Try cache first for token lookups
    const cachedUserId = await sessionCache.getUserByToken(token)
    if (cachedUserId) {
      const cached = await sessionCache.getUserSession(cachedUserId)
      if (cached) {
        return {
          id: cached.id,
          email: cached.email || '',
          name: cached.name,
          storageUsed: cached.storageUsed,
          storageQuotaMB: cached.storageQuotaMB,
          urlId: cached.urlId,
          role: cached.role,
          randomizeFileUrls: cached.randomizeFileUrls,
          preferredUploadDomain: cached.preferredUploadDomain,
        }
      }
    }

    const user = await prisma.user.findUnique({
      where: { uploadToken: token },
      select: {
        id: true,
        email: true,
        name: true,
        storageUsed: true,
        storageQuotaMB: true,
        urlId: true,
        role: true,
        randomizeFileUrls: true,
        preferredUploadDomain: true,
        sessionVersion: true,
        image: true,
      },
    })

    if (user) {
      // Cache token -> userId mapping
      await sessionCache.setUserByToken(token, user.id)

      // Cache the session data
      await sessionCache.setUserSession(user.id, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
        sessionVersion: user.sessionVersion,
        urlId: user.urlId,
        storageUsed: user.storageUsed,
        storageQuotaMB: user.storageQuotaMB,
        randomizeFileUrls: user.randomizeFileUrls,
        preferredUploadDomain: user.preferredUploadDomain,
      })
    }

    return user
  }

  return null
}

export async function requireAuth(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    }
  }
  return { user, response: null }
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (
    !session?.user ||
    (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')
  ) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    }
  }

  return { user: session.user, response: null }
}

export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'SUPERADMIN') {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    }
  }

  return { user: session.user, response: null }
}
