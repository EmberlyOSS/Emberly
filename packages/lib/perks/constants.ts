/**
 * Perk system constants and configuration
 */

export const PERK_ROLES = {
  CONTRIBUTOR: 'CONTRIBUTOR',
  DISCORD_BOOSTER: 'DISCORD_BOOSTER',
} as const

export type PerkRole = (typeof PERK_ROLES)[keyof typeof PERK_ROLES]

/**
 * Storage bonuses in GB per perk role
 */
export const PERK_STORAGE_BONUS_GB: Record<PerkRole, number> = {
  [PERK_ROLES.CONTRIBUTOR]: 1, // +1GB per 1000 lines of code
  [PERK_ROLES.DISCORD_BOOSTER]: 5, // +5GB one-time for Discord boosters
}

/**
 * Domain slot bonuses per perk role
 */
export const PERK_DOMAIN_BONUS: Record<PerkRole, number> = {
  [PERK_ROLES.CONTRIBUTOR]: 0, // No domain bonus for contributors
  [PERK_ROLES.DISCORD_BOOSTER]: 1, // +1 domain slot for Discord boosters
}

/**
 * Perk check intervals
 */
export const PERK_CHECK_INTERVALS = {
  ON_LOGIN: 'on_login',
  DAILY: 24 * 60 * 60 * 1000, // 24 hours in ms
  WEEKLY: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
} as const

/**
 * Redis key prefixes for perk caching
 */
export const PERK_CACHE_KEYS = {
  CONTRIBUTOR_LINES: (userId: string) => `perk:contributor:lines:${userId}`,
  CONTRIBUTOR_CHECKED: (userId: string) => `perk:contributor:checked:${userId}`,
  BOOSTER_STATUS: (userId: string) => `perk:booster:${userId}`,
  BOOSTER_CHECKED: (userId: string) => `perk:booster:checked:${userId}`,
} as const

/**
 * GitHub contribution thresholds
 */
export const GITHUB_CONTRIBUTION_THRESHOLD = 1000 // lines of code per 1GB bonus
