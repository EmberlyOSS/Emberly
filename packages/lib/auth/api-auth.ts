import { createHash } from 'crypto'

import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { sessionCache } from '@/packages/lib/cache/session-cache'
import { prisma } from '@/packages/lib/database/prisma'
import { hasPermission, Permission } from '@/packages/lib/permissions'

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

/** A squad authenticated via its upload token or a named API key */
export type AuthenticatedSquad = {
  squadId: string
  slug: string
  ownerUserId: string
  /** Storage used in bytes */
  storageUsed: number
  storageQuotaMB: number | null
  /** How the request was authenticated */
  authMethod: 'upload_token' | 'api_key'
  /** ID of the NexiumSquadApiKey record (null for upload token auth) */
  apiKeyId: string | null
}

/**
 * Try to authenticate the request as a Nexium squad via:
 *   1. Squad upload token  (Bearer <token>)
 *   2. Squad API key       (Bearer nsk_…)
 *
 * Returns null if the bearer token doesn't match any squad credential.
 */
export async function getSquadFromBearerToken(
  req: Request
): Promise<AuthenticatedSquad | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)

  // ── 1. Squad upload token ────────────────────────────────────────────────
  // Upload tokens are cuid/uuid strings (no prefix), API keys start with nsk_
  if (!token.startsWith('nsk_')) {
    const squad = await prisma.nexiumSquad.findUnique({
      where: { uploadToken: token },
      select: {
        id: true,
        slug: true,
        ownerUserId: true,
        storageUsed: true,
        storageQuotaMB: true,
      },
    })
    if (squad) {
      return {
        squadId: squad.id,
        slug: squad.slug,
        ownerUserId: squad.ownerUserId,
        storageUsed: squad.storageUsed,
        storageQuotaMB: squad.storageQuotaMB,
        authMethod: 'upload_token',
        apiKeyId: null,
      }
    }
  }

  // ── 2. Squad API key (nsk_…) ─────────────────────────────────────────────
  if (token.startsWith('nsk_')) {
    const hash = createHash('sha256').update(token).digest('hex')
    const keyRecord = await prisma.nexiumSquadApiKey.findUnique({
      where: { keyHash: hash },
      select: {
        id: true,
        squad: {
          select: {
            id: true,
            slug: true,
            ownerUserId: true,
            storageUsed: true,
            storageQuotaMB: true,
          },
        },
      },
    })
    if (keyRecord) {
      // Non-blocking last-used update
      void prisma.nexiumSquadApiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() },
      })
      return {
        squadId: keyRecord.squad.id,
        slug: keyRecord.squad.slug,
        ownerUserId: keyRecord.squad.ownerUserId,
        storageUsed: keyRecord.squad.storageUsed,
        storageQuotaMB: keyRecord.squad.storageQuotaMB,
        authMethod: 'api_key',
        apiKeyId: keyRecord.id,
      }
    }
  }

  return null
}

/**
 * Require the request to be authenticated as a Nexium squad.
 * Returns `{ squad, response: null }` on success or `{ squad: null, response }` on failure.
 */
export async function requireSquadAuth(req: Request) {
  const squad = await getSquadFromBearerToken(req)
  if (!squad) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      squad: null,
    }
  }
  return { squad, response: null }
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

  if (!session?.user || !hasPermission(session.user.role as any, Permission.ACCESS_ADMIN_PANEL)) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    }
  }

  return { user: session.user, response: null }
}

export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !hasPermission(session.user.role as any, Permission.PERFORM_SUPERADMIN_ACTIONS)) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    }
  }

  return { user: session.user, response: null }
}

/**
 * Generic role requirement checker
 * More flexible than requireAdmin/requireSuperAdmin - pass the min role needed
 * 
 * Usage:
 *   const { user, response } = await requireRole('ADMIN')
 *   if (response) return response
 */
export async function requireRole(minRole: 'USER' | 'ADMIN' | 'SUPERADMIN') {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    }
  }

  const userRole = session.user.role as 'USER' | 'ADMIN' | 'SUPERADMIN'
  const roleHierarchy = { USER: 0, ADMIN: 10, SUPERADMIN: 100 }

  if (roleHierarchy[userRole] < roleHierarchy[minRole]) {
    return {
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      user: null,
    }
  }

  return { user: session.user, response: null }
}

/**
 * Granular permission requirement checker
 * Use this when you need to check for specific permissions beyond role hierarchy
 * 
 * Usage:
 *   const { user, response } = await requirePermission(Permission.DELETE_USERS)
 *   if (response) return response
 */
export async function requirePermission(permission: Permission) {
  const session = await getServerSession(authOptions)

  if (!session?.user || !hasPermission(session.user.role as any, permission)) {
    return {
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      user: null,
    }
  }

  return { user: session.user, response: null }
}

/**
 * ============================================================================
 * SQUAD AUTHENTICATION HELPERS
 * ============================================================================
 */

/**
 * Get authenticated user's role in a specific squad
 * Returns null if user is not a member of the squad
 */
export async function getUserSquadRole(
  userId: string,
  squadId: string
): Promise<string | null> {
  const member = await prisma.nexiumSquadMember.findUnique({
    where: {
      squadId_userId: {
        squadId,
        userId,
      },
    },
    select: {
      role: true,
    },
  })

  return member?.role || null
}

/**
 * Check if user is a member of a squad (any role)
 */
export async function isSquadMember(
  userId: string,
  squadId: string
): Promise<boolean> {
  const role = await getUserSquadRole(userId, squadId)
  return !!role
}

/**
 * Check if user is squad owner
 */
export async function isSquadOwner(userId: string, squadId: string): Promise<boolean> {
  const squad = await prisma.nexiumSquad.findUnique({
    where: { id: squadId },
    select: { ownerUserId: true },
  })
  return squad?.ownerUserId === userId
}

/**
 * Require squad membership for a route
 * Checks that user has any role in the squad
 * 
 * Usage:
 *   const { user, response, squadRole } = await requireSquadMembership(userId, squadId)
 *   if (response) return response
 */
export async function requireSquadMembership(userId: string, squadId: string) {
  const squad = await prisma.nexiumSquad.findUnique({
    where: { id: squadId },
    select: { id: true },
  })

  if (!squad) {
    return {
      response: NextResponse.json({ error: 'Squad not found' }, { status: 404 }),
      user: null,
      squadRole: null,
    }
  }

  const squadRole = await getUserSquadRole(userId, squadId)

  if (!squadRole) {
    return {
      response: NextResponse.json({ error: 'Not a squad member' }, { status: 403 }),
      user: null,
      squadRole: null,
    }
  }

  const session = await getServerSession(authOptions)
  return {
    user: session?.user || null,
    response: null,
    squadRole,
  }
}

/**
 * Require squad owner role for a route
 * 
 * Usage:
 *   const { user, response } = await requireSquadOwner(userId, squadId)
 *   if (response) return response
 */
export async function requireSquadOwner(userId: string, squadId: string) {
  const squad = await prisma.nexiumSquad.findUnique({
    where: { id: squadId },
    select: { id: true, ownerUserId: true },
  })

  if (!squad) {
    return {
      response: NextResponse.json({ error: 'Squad not found' }, { status: 404 }),
      user: null,
    }
  }

  if (squad.ownerUserId !== userId) {
    return {
      response: NextResponse.json({ error: 'Only squad owner can perform this action' }, { status: 403 }),
      user: null,
    }
  }

  const session = await getServerSession(authOptions)
  return {
    user: session?.user || null,
    response: null,
  }
}

/**
 * Require specific squad permission for a route
 * More flexible than requireSquadOwner - can check for any squad permission
 * 
 * Usage:
 *   import { SquadPermission } from '@/packages/lib/permissions'
 *   const { user, response } = await requireSquadPermission(userId, squadId, SquadPermission.MANAGE_FILES)
 *   if (response) return response
 */
export async function requireSquadPermission(
  userId: string,
  squadId: string,
  permission: string // SquadPermission
) {
  const { user, response, squadRole } = await requireSquadMembership(userId, squadId)

  if (response) return { user: null, response }

  // Import at runtime to avoid circular dependencies
  const { hasSquadPermission } = await import('@/packages/lib/permissions')

  const hasPermissionFlag = hasSquadPermission(squadRole as any, permission as any)

  if (!hasPermissionFlag) {
    return {
      response: NextResponse.json(
        { error: `Missing permission: ${permission}` },
        { status: 403 }
      ),
      user: null,
    }
  }

  return {
    user,
    response: null,
  }
}

// ── System API key authentication ──────────────────────────────────────────

/**
 * Verify a system API key from a Bearer token (esk_…).
 * The key hash is stored in the Config table under key 'system_api_key'.
 * Returns true if the token matches, false otherwise.
 */
export async function isSystemKeyAuth(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer esk_')) return false

  const token = authHeader.substring(7)
  const hash = createHash('sha256').update(token).digest('hex')

  const row = await prisma.config.findUnique({
    where: { key: 'system_api_key' },
  })
  if (!row) return false

  const data = row.value as { keyHash?: string }
  return !!data.keyHash && data.keyHash === hash
}

/**
 * Require a valid system API key. Returns a 401 response if invalid.
 */
export async function requireSystemKey(req: Request) {
  const valid = await isSystemKeyAuth(req)
  if (!valid) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      authenticated: false as const,
    }
  }
  return { response: null, authenticated: true as const }
}
