import type { NexiumOpportunityStatus, NexiumOpportunityType, Prisma } from '@/prisma/generated/prisma/client'

import { prisma } from '@/packages/lib/database/prisma'

// ── Types ─────────────────────────────────────────────────────────────────────

export type CreateOpportunityInput = {
  title: string
  description: string
  type: NexiumOpportunityType
  budgetMin?: number  // cents
  budgetMax?: number  // cents
  currency?: string
  remote?: boolean
  location?: string
  requiredSkills?: string[]
  tags?: string[]
  teamSize?: number
  timeCommitment?: string
  deadline?: Date | string
  status?: NexiumOpportunityStatus
}

export type UpdateOpportunityInput = Partial<CreateOpportunityInput>

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getOpportunity(id: string) {
  return prisma.nexiumOpportunity.findUnique({
    where: { id },
    include: {
      postedBy: { select: { name: true, image: true, urlId: true } },
      _count: { select: { applications: true } },
    },
  })
}

export async function listOpportunities(opts: {
  page?: number
  limit?: number
  type?: NexiumOpportunityType
  skill?: string
  remote?: boolean
  /** If set, returns only this user's postings (all statuses) */
  postedByUserId?: string
}) {
  const page = Math.max(1, opts.page ?? 1)
  const limit = Math.min(50, opts.limit ?? 20)
  const skip = (page - 1) * limit

  const where: Prisma.NexiumOpportunityWhereInput = opts.postedByUserId
    ? { postedByUserId: opts.postedByUserId }
    : { status: 'OPEN' }

  if (opts.type) where.type = opts.type
  if (opts.remote !== undefined) where.remote = opts.remote
  if (opts.skill) where.requiredSkills = { has: opts.skill }

  const [opportunities, total] = await Promise.all([
    prisma.nexiumOpportunity.findMany({
      where,
      include: {
        postedBy: { select: { name: true, image: true, urlId: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.nexiumOpportunity.count({ where }),
  ])

  return { opportunities, total, page, limit, pageCount: Math.ceil(total / limit) }
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function createOpportunity(userId: string, input: CreateOpportunityInput) {
  return prisma.nexiumOpportunity.create({
    data: {
      postedByUserId: userId,
      title: input.title,
      description: input.description,
      type: input.type,
      status: input.status ?? 'OPEN',
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      currency: input.currency ?? 'USD',
      remote: input.remote ?? true,
      location: input.location,
      requiredSkills: input.requiredSkills ?? [],
      tags: input.tags ?? [],
      teamSize: input.teamSize,
      timeCommitment: input.timeCommitment,
      deadline: input.deadline ? new Date(input.deadline) : undefined,
    },
  })
}

export async function updateOpportunity(
  id: string,
  userId: string,
  input: UpdateOpportunityInput
) {
  const result = await prisma.nexiumOpportunity.updateMany({
    where: { id, postedByUserId: userId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.budgetMin !== undefined && { budgetMin: input.budgetMin }),
      ...(input.budgetMax !== undefined && { budgetMax: input.budgetMax }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.remote !== undefined && { remote: input.remote }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.requiredSkills !== undefined && { requiredSkills: input.requiredSkills }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.teamSize !== undefined && { teamSize: input.teamSize }),
      ...(input.timeCommitment !== undefined && { timeCommitment: input.timeCommitment }),
      ...(input.deadline !== undefined && { deadline: new Date(input.deadline) }),
    },
  })
  if (result.count === 0) throw new Error('Opportunity not found')
  return result
}

export async function deleteOpportunity(id: string, userId: string) {
  const result = await prisma.nexiumOpportunity.deleteMany({
    where: { id, postedByUserId: userId },
  })
  if (result.count === 0) throw new Error('Opportunity not found')
  return result
}
