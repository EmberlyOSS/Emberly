import { createHash, randomBytes } from 'crypto'
import { randomUUID } from 'crypto'

import type { NexiumSquadRole, NexiumSquadStatus, Prisma } from '@/prisma/generated/prisma/client'

import { prisma } from '@/packages/lib/database/prisma'

import { NEXIUM_MAX_SQUAD_SIZE } from './constants'

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(name: string, suffix?: string): string {
  const base = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 50)
  return suffix ? `${base}-${suffix}` : base
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type CreateSquadInput = {
  name: string
  description?: string
  skills?: string[]
  maxSize?: number
  isPublic?: boolean
}

export type UpdateSquadInput = Partial<CreateSquadInput> & { status?: NexiumSquadStatus }

// ── Read ──────────────────────────────────────────────────────────────────────

const SQUAD_INCLUDE = {
  owner: { select: { name: true, image: true, urlId: true } },
  members: {
    include: { user: { select: { name: true, image: true, urlId: true } } },
    orderBy: { joinedAt: 'asc' } as const,
  },
  _count: { select: { members: true } },
} satisfies Prisma.NexiumSquadInclude

export async function getSquad(slugOrId: string) {
  const bySlug = await prisma.nexiumSquad.findUnique({
    where: { slug: slugOrId },
    include: SQUAD_INCLUDE,
  })
  if (bySlug) return bySlug

  return prisma.nexiumSquad.findUnique({
    where: { id: slugOrId },
    include: SQUAD_INCLUDE,
  })
}

export async function listSquads(opts: {
  page?: number
  limit?: number
  skill?: string
  status?: NexiumSquadStatus
}) {
  const page = Math.max(1, opts.page ?? 1)
  const limit = Math.min(50, opts.limit ?? 20)
  const skip = (page - 1) * limit

  const where: Prisma.NexiumSquadWhereInput = { isPublic: true }
  if (opts.status) where.status = opts.status
  if (opts.skill) where.skills = { has: opts.skill }

  const [squads, total] = await Promise.all([
    prisma.nexiumSquad.findMany({
      where,
      include: {
        owner: { select: { name: true, image: true, urlId: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.nexiumSquad.count({ where }),
  ])

  return { squads, total, page, limit, pageCount: Math.ceil(total / limit) }
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function createSquad(userId: string, input: CreateSquadInput) {
  let slug = slugify(input.name)
  const exists = await prisma.nexiumSquad.findUnique({ where: { slug }, select: { id: true } })
  if (exists) slug = slugify(input.name, Date.now().toString(36))

  return prisma.$transaction(async (tx) => {
    const squad = await tx.nexiumSquad.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        ownerUserId: userId,
        skills: input.skills ?? [],
        maxSize: Math.min(input.maxSize ?? 5, NEXIUM_MAX_SQUAD_SIZE),
        isPublic: input.isPublic ?? true,
      },
    })
    await tx.nexiumSquadMember.create({
      data: { squadId: squad.id, userId, role: 'OWNER' },
    })
    return squad
  })
}

export async function updateSquad(id: string, userId: string, input: UpdateSquadInput) {
  const result = await prisma.nexiumSquad.updateMany({
    where: { id, ownerUserId: userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.skills !== undefined && { skills: input.skills }),
      ...(input.maxSize !== undefined && { maxSize: Math.min(input.maxSize, NEXIUM_MAX_SQUAD_SIZE) }),
      ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
      ...(input.status !== undefined && { status: input.status }),
    },
  })
  if (result.count === 0) throw new Error('Squad not found')
  return result
}

export async function disbandSquad(id: string, userId: string) {
  const result = await prisma.nexiumSquad.updateMany({
    where: { id, ownerUserId: userId },
    data: { status: 'DISBANDED' },
  })
  if (result.count === 0) throw new Error('Squad not found')
  return result
}

// ── Membership ────────────────────────────────────────────────────────────────

export async function joinSquad(squadId: string, userId: string) {
  const squad = await prisma.nexiumSquad.findUnique({
    where: { id: squadId },
    include: { _count: { select: { members: true } } },
  })
  if (!squad) throw new Error('Squad not found')
  if (!squad.isPublic) throw new Error('This squad is invite-only')
  if (squad.status !== 'FORMING' && squad.status !== 'ACTIVE') throw new Error('Squad is not open')
  if (squad._count.members >= squad.maxSize) throw new Error('Squad is full')

  return prisma.nexiumSquadMember.create({
    data: { squadId, userId, role: 'MEMBER' },
  })
}

export async function leaveSquad(squadId: string, userId: string) {
  const membership = await prisma.nexiumSquadMember.findUnique({
    where: { squadId_userId: { squadId, userId } },
    select: { role: true },
  })
  if (!membership) throw new Error('You are not a member of this squad')
  if (membership.role === 'OWNER') throw new Error('Owner cannot leave — disband the squad instead')

  return prisma.nexiumSquadMember.deleteMany({ where: { squadId, userId } })
}

/** Owner can set a member's role (e.g. to OBSERVER) or remove them */
export async function setMemberRole(
  squadId: string,
  ownerUserId: string,
  targetUserId: string,
  role: NexiumSquadRole
) {
  const squad = await prisma.nexiumSquad.findFirst({
    where: { id: squadId, ownerUserId },
    select: { id: true },
  })
  if (!squad) throw new Error('Squad not found')

  return prisma.nexiumSquadMember.updateMany({
    where: { squadId, userId: targetUserId },
    data: { role },
  })
}

export async function kickMember(squadId: string, ownerUserId: string, targetUserId: string) {
  if (targetUserId === ownerUserId) throw new Error('Owner cannot be kicked')
  const squad = await prisma.nexiumSquad.findFirst({
    where: { id: squadId, ownerUserId },
    select: { id: true },
  })
  if (!squad) throw new Error('Squad not found')

  return prisma.nexiumSquadMember.deleteMany({ where: { squadId, userId: targetUserId } })
}

// ── Upload Token ──────────────────────────────────────────────────────────────

/** Return (or generate) the squad's upload token — only the owner can access this */
export async function getOrCreateUploadToken(squadId: string, ownerUserId: string) {
  const squad = await prisma.nexiumSquad.findFirst({
    where: { id: squadId, ownerUserId },
    select: { id: true, uploadToken: true },
  })
  if (!squad) throw new Error('Squad not found')

  if (squad.uploadToken) return squad.uploadToken

  const token = randomUUID()
  await prisma.nexiumSquad.update({ where: { id: squadId }, data: { uploadToken: token } })
  return token
}

/** Regenerate (rotate) the upload token — invalidates the old one */
export async function rotateUploadToken(squadId: string, ownerUserId: string) {
  const result = await prisma.nexiumSquad.updateMany({
    where: { id: squadId, ownerUserId },
    data: { uploadToken: randomUUID() },
  })
  if (result.count === 0) throw new Error('Squad not found')

  const updated = await prisma.nexiumSquad.findUnique({
    where: { id: squadId },
    select: { uploadToken: true },
  })
  return updated!.uploadToken!
}

// ── API Keys ──────────────────────────────────────────────────────────────────

const KEY_PREFIX = 'nsk_'
const MAX_API_KEYS = 10

function generateApiKey(): { full: string; hash: string; prefix: string } {
  const raw = randomBytes(24).toString('base64url') // 32 chars
  const full = `${KEY_PREFIX}${raw}`
  const hash = createHash('sha256').update(full).digest('hex')
  const prefix = full.slice(0, 12) // "nsk_xxxxxxxx"
  return { full, hash, prefix }
}

export async function listApiKeys(squadId: string, memberUserId: string) {
  // Any squad member can list keys (they only see prefix + metadata, never the hash)
  const member = await prisma.nexiumSquadMember.findUnique({
    where: { squadId_userId: { squadId, userId: memberUserId } },
    select: { role: true },
  })
  if (!member) throw new Error('Not a squad member')

  return prisma.nexiumSquadApiKey.findMany({
    where: { squadId },
    select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
}

/** Create a new API key. Returns the full key — it will NOT be retrievable again. */
export async function createApiKey(squadId: string, ownerUserId: string, name: string) {
  const squad = await prisma.nexiumSquad.findFirst({
    where: { id: squadId, ownerUserId },
    include: { _count: { select: { apiKeys: true } } },
  })
  if (!squad) throw new Error('Squad not found')
  if (squad._count.apiKeys >= MAX_API_KEYS) throw new Error(`Maximum of ${MAX_API_KEYS} API keys reached`)

  const { full, hash, prefix } = generateApiKey()
  await prisma.nexiumSquadApiKey.create({
    data: { squadId, name, keyHash: hash, prefix },
  })
  return { key: full, prefix, name }
}

/** Revoke an API key by id — only owner can revoke */
export async function revokeApiKey(squadId: string, ownerUserId: string, keyId: string) {
  const squad = await prisma.nexiumSquad.findFirst({
    where: { id: squadId, ownerUserId },
    select: { id: true },
  })
  if (!squad) throw new Error('Squad not found')

  const result = await prisma.nexiumSquadApiKey.deleteMany({ where: { id: keyId, squadId } })
  if (result.count === 0) throw new Error('API key not found')
}

/** Authenticate a squad API key and return the squad (used in upload/API middleware) */
export async function authenticateApiKey(rawKey: string) {
  const hash = createHash('sha256').update(rawKey).digest('hex')
  const keyRecord = await prisma.nexiumSquadApiKey.findUnique({
    where: { keyHash: hash },
    include: { squad: { select: { id: true, slug: true, ownerUserId: true, storageQuotaMB: true, storageUsed: true } } },
  })
  if (!keyRecord) return null

  // Update lastUsedAt without blocking the response
  void prisma.nexiumSquadApiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsedAt: new Date() },
  })

  return keyRecord.squad
}

// ── Quota ─────────────────────────────────────────────────────────────────────

export type SquadQuotaInfo = {
  storageQuotaMB: number | null // null = unlimited
  uploadSizeCapMB: number | null
  planName: string
  storageUsedMB: number
  percentUsed: number | null
}

/** Get effective quota for a squad, taking into account its active subscription or per-squad override */
export async function getSquadQuota(squadId: string): Promise<SquadQuotaInfo> {
  const squad = await prisma.nexiumSquad.findUnique({
    where: { id: squadId },
    select: {
      storageUsed: true,
      storageQuotaMB: true,
      subscriptions: {
        where: { status: 'active' },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
  if (!squad) throw new Error('Squad not found')

  const storageUsedMB = squad.storageUsed / (1024 * 1024)

  // Per-squad override takes priority
  if (squad.storageQuotaMB !== null && squad.storageQuotaMB !== undefined) {
    const quotaMB = squad.storageQuotaMB
    return {
      storageQuotaMB: quotaMB,
      uploadSizeCapMB: null,
      planName: 'Custom',
      storageUsedMB,
      percentUsed: quotaMB > 0 ? (storageUsedMB / quotaMB) * 100 : null,
    }
  }

  // Active subscription plan
  const sub = squad.subscriptions[0]
  if (sub?.product) {
    const quotaMB = sub.product.storageQuotaGB != null ? sub.product.storageQuotaGB * 1024 : null
    return {
      storageQuotaMB: quotaMB,
      uploadSizeCapMB: sub.product.uploadSizeCapMB ?? null,
      planName: sub.product.name,
      storageUsedMB,
      percentUsed: quotaMB != null && quotaMB > 0 ? (storageUsedMB / quotaMB) * 100 : null,
    }
  }

  // Free default
  const defaultMB = 5 * 1024 // 5 GB for squads
  return {
    storageQuotaMB: defaultMB,
    uploadSizeCapMB: 500,
    planName: 'Free',
    storageUsedMB,
    percentUsed: (storageUsedMB / defaultMB) * 100,
  }
}

// ── Custom Domains ────────────────────────────────────────────────────────────

/** Max custom domains for squads on free tier — same as user free plan */
const SQUAD_FREE_DOMAIN_LIMIT = 3

/**
 * Check how many more domains a squad can add based on its active plan.
 * Mirrors the logic in packages/lib/storage/quota.ts for users.
 */
export async function getSquadDomainLimit(squadId: string): Promise<{ limit: number | null; used: number; canAdd: boolean }> {
  const squad = await prisma.nexiumSquad.findUnique({
    where: { id: squadId },
    select: {
      _count: { select: { customDomains: true } },
      subscriptions: {
        where: { status: 'active' },
        include: { product: { select: { customDomainsLimit: true } } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
  if (!squad) throw new Error('Squad not found')

  const used = squad._count.customDomains
  const sub = squad.subscriptions[0]
  const limit = sub?.product?.customDomainsLimit ?? SQUAD_FREE_DOMAIN_LIMIT // null = unlimited

  return { limit, used, canAdd: limit === null || used < limit }
}

export async function listSquadDomains(squadId: string, memberUserId: string) {
  const member = await prisma.nexiumSquadMember.findUnique({
    where: { squadId_userId: { squadId, userId: memberUserId } },
    select: { role: true },
  })
  if (!member) throw new Error('Not a squad member')

  return prisma.customDomain.findMany({
    where: { squadId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function addSquadDomain(squadId: string, ownerUserId: string, domain: string) {
  const squad = await prisma.nexiumSquad.findFirst({
    where: { id: squadId, ownerUserId },
    select: { id: true },
  })
  if (!squad) throw new Error('Squad not found')

  const { canAdd } = await getSquadDomainLimit(squadId)
  if (!canAdd) throw new Error('Custom domain limit reached for this squad')

  // Check not already registered anywhere
  const existing = await prisma.customDomain.findUnique({ where: { domain } })
  if (existing) throw new Error('Domain already registered')

  // Register with Cloudflare
  const { createCustomHostname } = await import('@/packages/lib/cloudflare/client')
  const cfRes = await createCustomHostname(domain).catch(() => null)

  return prisma.customDomain.create({
    data: {
      domain,
      squadId,
      userId: null,
      verified: false,
      cfHostnameId: cfRes?.id ?? null,
      cfStatus: cfRes ? String(cfRes.status || cfRes.state || '') : null,
      cfMeta: cfRes ?? undefined,
    },
  })
}

export async function removeSquadDomain(squadId: string, ownerUserId: string, domainId: string) {
  const squad = await prisma.nexiumSquad.findFirst({
    where: { id: squadId, ownerUserId },
    select: { id: true },
  })
  if (!squad) throw new Error('Squad not found')

  const result = await prisma.customDomain.deleteMany({
    where: { id: domainId, squadId },
  })
  if (result.count === 0) throw new Error('Domain not found')
}

