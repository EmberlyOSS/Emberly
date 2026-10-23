/**
 * Perk system constants and configuration
 */

export const PERK_ROLES = {
  CONTRIBUTOR: 'CONTRIBUTOR',
  DISCORD_BOOSTER: 'DISCORD_BOOSTER',
  AFFILIATE: 'AFFILIATE',
} as const

export type PerkRole = (typeof PERK_ROLES)[keyof typeof PERK_ROLES]

/**
 * Storage bonuses in GB per perk role
 */
export const PERK_STORAGE_BONUS_GB: Record<PerkRole, number> = {
  [PERK_ROLES.CONTRIBUTOR]: 0, // Calculated via milestones (see CONTRIBUTOR_MILESTONES)
  [PERK_ROLES.DISCORD_BOOSTER]: 0, // Calculated via milestones (see DISCORD_BOOSTER_MILESTONES)
  [PERK_ROLES.AFFILIATE]: 0, // Affiliates earn billing credits, not storage
}

/**
 * GitHub Contributor milestone tiers
 * Storage bonuses are capped at the highest achieved milestone
 */
export const CONTRIBUTOR_MILESTONES = [
  { loc: 1000, storageGB: 0.1, domainSlots: 1, tier: 'Bronze', icon: '🥉' },      // 100MB + 1 domain
  { loc: 5000, storageGB: 0.5, domainSlots: 2, tier: 'Silver', icon: '🥈' },      // 500MB + 2 domains
  { loc: 10000, storageGB: 1, domainSlots: 3, tier: 'Gold', icon: '🥇' },         // 1GB + 3 domains
  { loc: 25000, storageGB: 2, domainSlots: 4, tier: 'Platinum', icon: '💎' },     // 2GB + 4 domains
  { loc: 50000, storageGB: 3, domainSlots: 5, tier: 'Diamond', icon: '💠' },      // 3GB + 5 domains (capped)
] as const

/**
 * Discord Booster milestone tiers
 * Based on boosting duration (months since first boost)
 * Benefits are permanent once earned
 */
export const DISCORD_BOOSTER_MILESTONES = [
  { months: 1, storageGB: 1, domainSlots: 1, tier: 'Bronze', icon: '🥉' },        // 1GB + 1 domain
  { months: 3, storageGB: 2, domainSlots: 1, tier: 'Silver', icon: '🥈' },        // 2GB + 1 domain
  { months: 6, storageGB: 3, domainSlots: 2, tier: 'Gold', icon: '🥇' },          // 3GB + 2 domains
  { months: 12, storageGB: 5, domainSlots: 2, tier: 'Platinum', icon: '💎' },     // 5GB + 2 domains
  { months: 24, storageGB: 7, domainSlots: 3, tier: 'Diamond', icon: '💠' },      // 7GB + 3 domains (capped)
] as const

/**
 * Domain slot bonuses per perk role
 */
export const PERK_DOMAIN_BONUS: Record<PerkRole, number> = {
  [PERK_ROLES.CONTRIBUTOR]: 0, // Calculated via milestones
  [PERK_ROLES.DISCORD_BOOSTER]: 0, // Calculated via milestones
  [PERK_ROLES.AFFILIATE]: 0, // Affiliates earn billing credits, not domains
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
export const GITHUB_CONTRIBUTION_THRESHOLD = 1000 // Minimum LOC to qualify as contributor
