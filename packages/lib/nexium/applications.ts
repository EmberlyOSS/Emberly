import type { NexiumApplicationStatus } from '@/prisma/generated/prisma/client'

import { prisma } from '@/packages/lib/database/prisma'

// ── Apply / withdraw ──────────────────────────────────────────────────────────

export async function applyToOpportunity(
  opportunityId: string,
  profileId: string,
  message: string
) {
  const opp = await prisma.nexiumOpportunity.findUnique({
    where: { id: opportunityId },
    select: { status: true },
  })
  if (!opp) throw new Error('Opportunity not found')
  if (opp.status !== 'OPEN') throw new Error('This opportunity is no longer accepting applications')

  return prisma.nexiumApplication.create({
    data: { opportunityId, profileId, message },
  })
}

export async function withdrawApplication(opportunityId: string, profileId: string) {
  const result = await prisma.nexiumApplication.updateMany({
    where: { opportunityId, profileId, status: { in: ['PENDING', 'VIEWED'] } },
    data: { status: 'WITHDRAWN' },
  })
  if (result.count === 0) throw new Error('No active application found')
  return result
}

// ── Poster actions ────────────────────────────────────────────────────────────

export async function updateApplicationStatus(
  id: string,
  opportunityId: string,
  /** The opportunity must belong to the caller – enforced by listApplicationsForOpportunity first */
  status: NexiumApplicationStatus
) {
  return prisma.nexiumApplication.update({ where: { id }, data: { status } })
}

/** List applications for an opportunity (poster view). Verifies the opportunity belongs to userId. */
export async function listApplicationsForOpportunity(opportunityId: string, userId: string) {
  const opp = await prisma.nexiumOpportunity.findFirst({
    where: { id: opportunityId, postedByUserId: userId },
    select: { id: true },
  })
  if (!opp) throw new Error('Opportunity not found')

  return prisma.nexiumApplication.findMany({
    where: { opportunityId },
    include: {
      profile: {
        include: {
          skills: { orderBy: { sortOrder: 'asc' }, take: 6 },
          user: { select: { name: true, image: true, urlId: true } },
        },
      },
    },
    orderBy: { appliedAt: 'desc' },
  })
}

/** List all applications submitted by a profile (applicant view) */
export async function listMyApplications(profileId: string) {
  return prisma.nexiumApplication.findMany({
    where: { profileId },
    include: {
      opportunity: {
        include: {
          postedBy: { select: { name: true, image: true, urlId: true } },
        },
      },
    },
    orderBy: { appliedAt: 'desc' },
  })
}
