import type { NexiumSignalType, Prisma } from '@/prisma/generated/prisma/client'

import { prisma } from '@/packages/lib/database/prisma'

import { NEXIUM_MAX_SIGNALS } from './constants'

// ── Types ─────────────────────────────────────────────────────────────────────

export type CreateSignalInput = {
  type: NexiumSignalType
  title: string
  description?: string
  url?: string
  imageUrl?: string
  skills?: string[]
  metadata?: Record<string, unknown>
}

export type UpdateSignalInput = Partial<CreateSignalInput>

// ── Write ─────────────────────────────────────────────────────────────────────

export async function addSignal(profileId: string, input: CreateSignalInput) {
  const count = await prisma.nexiumSignal.count({ where: { profileId } })
  if (count >= NEXIUM_MAX_SIGNALS) {
    throw new Error(`Maximum of ${NEXIUM_MAX_SIGNALS} signals per profile`)
  }
  return prisma.nexiumSignal.create({
    data: {
      profileId,
      type: input.type,
      title: input.title,
      description: input.description,
      url: input.url,
      imageUrl: input.imageUrl,
      skills: input.skills ?? [],
      metadata: input.metadata as Prisma.InputJsonValue,
      sortOrder: count,
    },
  })
}

export async function updateSignal(id: string, profileId: string, input: UpdateSignalInput) {
  const result = await prisma.nexiumSignal.updateMany({
    where: { id, profileId },
    data: {
      ...(input.type !== undefined && { type: input.type }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.url !== undefined && { url: input.url }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.skills !== undefined && { skills: input.skills }),
      ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.InputJsonValue }),
    },
  })
  if (result.count === 0) throw new Error('Signal not found')
  return result
}

export async function removeSignal(id: string, profileId: string) {
  const result = await prisma.nexiumSignal.deleteMany({ where: { id, profileId } })
  if (result.count === 0) throw new Error('Signal not found')
  return result
}

/** Reorder signals by providing the full ordered array of IDs */
export async function reorderSignals(profileId: string, orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.nexiumSignal.updateMany({ where: { id, profileId }, data: { sortOrder: index } })
    )
  )
}

// ── Admin / system ────────────────────────────────────────────────────────────

/** Mark a signal as manually verified (admin/system use) */
export async function verifySignal(id: string) {
  return prisma.nexiumSignal.update({
    where: { id },
    data: { verified: true, verifiedAt: new Date() },
  })
}
