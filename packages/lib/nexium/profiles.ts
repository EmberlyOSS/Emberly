import type { NexiumAvailability, Prisma } from '@/prisma/generated/prisma/client'

import { prisma } from '@/packages/lib/database/prisma'

// ── Shared User select for Nexium profiles ────────────────────────────────────

const nexiumUserSelect = {
  name: true,
  fullName: true,
  image: true,
  urlId: true,
  vanityId: true,
  bio: true,
  website: true,
  twitter: true,
  github: true,
  discord: true,
  showLinkedAccounts: true,
  linkedAccounts: {
    select: { provider: true, providerUsername: true },
  },
} satisfies Prisma.UserSelect

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProfileWithRelations = Prisma.NexiumProfileGetPayload<{
  include: {
    skills: true
    signals: true
    user: { select: typeof nexiumUserSelect }
  }
}>

export type ProfileSummary = Prisma.NexiumProfileGetPayload<{
  include: {
    skills: { take: 6 }
    user: { select: typeof nexiumUserSelect }
  }
}>

// ── Read ──────────────────────────────────────────────────────────────────────

/** Get the full profile for a user (owner view) */
export async function getProfile(userId: string): Promise<ProfileWithRelations | null> {
  return prisma.nexiumProfile.findUnique({
    where: { userId },
    include: {
      skills: { orderBy: { sortOrder: 'asc' } },
      signals: { orderBy: [{ verified: 'desc' }, { sortOrder: 'asc' }] },
      user: { select: nexiumUserSelect },
    },
  })
}

/** Get a public Nexium profile by username (vanityId or urlId) */
export async function getProfileByUsername(username: string): Promise<ProfileWithRelations | null> {
  return prisma.nexiumProfile.findFirst({
    where: {
      user: {
        OR: [
          { vanityId: { equals: username, mode: 'insensitive' } },
          { urlId: { equals: username, mode: 'insensitive' } },
        ],
      },
    },
    include: {
      skills: { orderBy: { sortOrder: 'asc' } },
      signals: { orderBy: [{ verified: 'desc' }, { sortOrder: 'asc' }] },
      user: { select: nexiumUserSelect },
    },
  })
}

/** Paginated discovery listing (only visible profiles) */
export async function listProfiles(opts: {
  page?: number
  limit?: number
  availability?: NexiumAvailability
  skill?: string
  lookingFor?: string
}) {
  const page = Math.max(1, opts.page ?? 1)
  const limit = Math.min(50, opts.limit ?? 20)
  const skip = (page - 1) * limit

  const where: Prisma.NexiumProfileWhereInput = { isVisible: true }
  if (opts.availability) where.availability = opts.availability
  if (opts.lookingFor) where.lookingFor = { has: opts.lookingFor }
  if (opts.skill) {
    where.skills = { some: { name: { contains: opts.skill, mode: 'insensitive' } } }
  }

  const [profiles, total] = await Promise.all([
    prisma.nexiumProfile.findMany({
      where,
      include: {
        skills: { orderBy: { sortOrder: 'asc' }, take: 6 },
        user: { select: nexiumUserSelect },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.nexiumProfile.count({ where }),
  ])

  return { profiles, total, page, limit, pageCount: Math.ceil(total / limit) }
}

// ── Write ─────────────────────────────────────────────────────────────────────

export type CreateProfileInput = {
  title?: string
  headline?: string
  availability?: NexiumAvailability
  lookingFor?: string[]
  timezone?: string | null
  location?: string | null
  activeHours?: string | null
}

export async function createProfile(userId: string, input: CreateProfileInput) {
  return prisma.nexiumProfile.create({
    data: {
      userId,
      title: input.title,
      headline: input.headline,
      availability: input.availability ?? 'OPEN',
      lookingFor: input.lookingFor ?? [],
      timezone: input.timezone,
      location: input.location,
      activeHours: input.activeHours,
    },
    include: {
      skills: { orderBy: { sortOrder: 'asc' } },
      signals: { orderBy: [{ verified: 'desc' }, { sortOrder: 'asc' }] },
      user: { select: nexiumUserSelect },
    },
  })
}

export type UpdateProfileInput = Partial<CreateProfileInput> & { isVisible?: boolean }

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const data: Prisma.NexiumProfileUpdateInput = {}

  if (input.title !== undefined) data.title = input.title
  if (input.headline !== undefined) data.headline = input.headline
  if (input.availability !== undefined) data.availability = input.availability
  if (input.lookingFor !== undefined) data.lookingFor = input.lookingFor
  if (input.timezone !== undefined) data.timezone = input.timezone
  if (input.location !== undefined) data.location = input.location
  if (input.activeHours !== undefined) data.activeHours = input.activeHours
  if (input.isVisible !== undefined) data.isVisible = input.isVisible

  return prisma.nexiumProfile.update({
    where: { userId },
    data,
    include: {
      skills: { orderBy: { sortOrder: 'asc' } },
      signals: { orderBy: [{ verified: 'desc' }, { sortOrder: 'asc' }] },
      user: { select: nexiumUserSelect },
    },
  })
}

export async function deleteProfile(userId: string) {
  return prisma.nexiumProfile.delete({ where: { userId } })
}
