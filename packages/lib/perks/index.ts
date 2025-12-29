/**
 * Perk system utilities for checking and applying user perks
 */

import { prisma } from '@/packages/lib/database/prisma'
import {
  PERK_ROLES,
  PERK_STORAGE_BONUS_GB,
  PERK_DOMAIN_BONUS,
  PERK_CACHE_KEYS,
  PERK_CHECK_INTERVALS,
  GITHUB_CONTRIBUTION_THRESHOLD,
  type PerkRole,
} from './constants'

/**
 * Calculate total storage bonus in GB for a user based on their perk roles
 */
export function calculateStorageBonusGB(perkRoles: string[]): number {
  return perkRoles.reduce((total, role) => {
    if (role.startsWith('CONTRIBUTOR:')) {
      // Format: CONTRIBUTOR:5 means 5 contributor levels = 5GB bonus
      const levels = parseInt(role.split(':')[1] || '1')
      return total + levels * PERK_STORAGE_BONUS_GB[PERK_ROLES.CONTRIBUTOR]
    }
    return total + (PERK_STORAGE_BONUS_GB[role as PerkRole] || 0)
  }, 0)
}

/**
 * Calculate total domain slot bonus for a user based on their perk roles
 */
export function calculateDomainSlotBonus(perkRoles: string[]): number {
  return perkRoles.reduce((total, role) => {
    return total + (PERK_DOMAIN_BONUS[role as PerkRole] || 0)
  }, 0)
}

/**
 * Check if a user should have their perks rechecked
 */
export function shouldRecheckPerks(lastCheckAt: Date | null): boolean {
  if (!lastCheckAt) return true
  const hoursSinceCheck = (Date.now() - lastCheckAt.getTime()) / (1000 * 60 * 60)
  return hoursSinceCheck >= 24 // Recheck daily
}

/**
 * Update user's perk roles
 */
export async function updateUserPerks(userId: string, newPerkRoles: string[]) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      perkRoles: newPerkRoles,
      lastPerkCheckAt: new Date(),
    },
  })
}

/**
 * Get all perk roles for a user
 */
export async function getUserPerks(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { perkRoles: true },
  })
  return user?.perkRoles || []
}

/**
 * Check if user has a specific perk role
 */
export async function hasPermission(userId: string, perkRole: PerkRole): Promise<boolean> {
  const perks = await getUserPerks(userId)
  return perks.some((p) => p.startsWith(perkRole))
}

/**
 * Add perk role to user (deduplicates)
 */
export async function addPerkRole(userId: string, perkRole: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { perkRoles: true },
  })

  const currentPerks = user?.perkRoles || []
  if (!currentPerks.includes(perkRole)) {
    await updateUserPerks(userId, [...currentPerks, perkRole])
  }
}

/**
 * Remove perk role from user
 */
export async function removePerkRole(userId: string, perkRole: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { perkRoles: true },
  })

  const currentPerks = user?.perkRoles || []
  const filtered = currentPerks.filter((p) => !p.startsWith(perkRole))
  await updateUserPerks(userId, filtered)
}

/**
 * Recalculate contributor levels based on code contributions
 * Called periodically or on manual trigger
 */
export async function recalculateContributorLevel(
  userId: string,
  totalLinesOfCode: number
): Promise<void> {
  const levels = Math.floor(totalLinesOfCode / GITHUB_CONTRIBUTION_THRESHOLD)

  if (levels > 0) {
    const perkRole = `CONTRIBUTOR:${levels}`
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { perkRoles: true },
    })

    const currentPerks = user?.perkRoles || []
    const filtered = currentPerks.filter((p) => !p.startsWith('CONTRIBUTOR'))
    await updateUserPerks(userId, [...filtered, perkRole])
  } else {
    // Remove contributor perk if below threshold
    await removePerkRole(userId, 'CONTRIBUTOR')
  }
}
