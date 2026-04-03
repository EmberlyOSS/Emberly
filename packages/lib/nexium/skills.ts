import type { NexiumSkillLevel, Prisma } from '@/prisma/generated/prisma/client'

import { prisma } from '@/packages/lib/database/prisma'

import { NEXIUM_MAX_SKILLS } from './constants'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SkillInput = {
  name: string
  level?: NexiumSkillLevel
  yearsExperience?: number
  category?: string
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function addSkill(profileId: string, input: SkillInput) {
  const count = await prisma.nexiumSkill.count({ where: { profileId } })
  if (count >= NEXIUM_MAX_SKILLS) {
    throw new Error(`Maximum of ${NEXIUM_MAX_SKILLS} skills per profile`)
  }
  return prisma.nexiumSkill.create({
    data: {
      profileId,
      name: input.name,
      level: input.level ?? 'INTERMEDIATE',
      yearsExperience: input.yearsExperience,
      category: input.category,
      sortOrder: count,
    },
  })
}

export async function updateSkill(id: string, profileId: string, input: Partial<SkillInput>) {
  const result = await prisma.nexiumSkill.updateMany({
    where: { id, profileId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.level !== undefined && { level: input.level }),
      ...(input.yearsExperience !== undefined && { yearsExperience: input.yearsExperience }),
      ...(input.category !== undefined && { category: input.category }),
    },
  })
  if (result.count === 0) throw new Error('Skill not found')
  return result
}

export async function removeSkill(id: string, profileId: string) {
  const result = await prisma.nexiumSkill.deleteMany({ where: { id, profileId } })
  if (result.count === 0) throw new Error('Skill not found')
  return result
}

/** Reorder skills by providing the full ordered array of IDs */
export async function reorderSkills(profileId: string, orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.nexiumSkill.updateMany({ where: { id, profileId }, data: { sortOrder: index } })
    )
  )
}

// ── Bulk replace ──────────────────────────────────────────────────────────────

/** Replace all skills on a profile atomically */
export async function replaceSkills(profileId: string, skills: SkillInput[]) {
  if (skills.length > NEXIUM_MAX_SKILLS) {
    throw new Error(`Maximum of ${NEXIUM_MAX_SKILLS} skills per profile`)
  }
  await prisma.$transaction([
    prisma.nexiumSkill.deleteMany({ where: { profileId } }),
    prisma.nexiumSkill.createMany({
      data: skills.map((s, i) => ({
        profileId,
        name: s.name,
        level: s.level ?? 'INTERMEDIATE',
        yearsExperience: s.yearsExperience,
        category: s.category,
        sortOrder: i,
      })),
    }),
  ])
}
