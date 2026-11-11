/**
 * Referral/Affiliate system utilities
 */

import type { Prisma } from '@emberly/db'
import { prisma } from '@emberly/db'
import { addPerkRole } from '@/lib/perks'

/**
 * Constants for referral rewards
 */
export const REFERRAL_CONFIG = {
  REFERRER_CREDIT: 10, // $10 credit for each successful referral
  REFERREE_CREDIT: 10, // $10 credit for new users who sign up via referral
  REFERRAL_CODE_LENGTH: 8,
  MAX_CREDITED_REFERRALS: 10,
} as const

interface ReferralStatsData {
  count?: number
  credited?: number
  lastCreditedAt?: string | null
  pendingSignupCredit?: boolean
  pendingReferrerReward?: boolean
}

function readStats(value: unknown): ReferralStatsData {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value
  return (parsed ?? {}) as ReferralStatsData
}

/** Treats plus-addressing, and Gmail's ignored dots, as the same inbox. */
function normalizeMailbox(email: string) {
  const [local, domain] = email.trim().toLowerCase().split('@')
  const name = local.split('+')[0]
  const gmail = domain === 'gmail.com' || domain === 'googlemail.com'
  return `${gmail ? name.replace(/\./g, '') : name}@${gmail ? 'gmail.com' : domain}`
}

export function isSameMailbox(a?: string | null, b?: string | null) {
  return !!a && !!b && normalizeMailbox(a) === normalizeMailbox(b)
}

export function referrerReward(amountPaidCents: number) {
  return Math.min(REFERRAL_CONFIG.REFERRER_CREDIT, amountPaidCents / 100)
}

async function lockUsers(tx: Prisma.TransactionClient, ids: string[]) {
  for (const id of [...ids].sort()) {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${id} FOR UPDATE`
  }
}

/**
 * Generate a unique referral code for a user
 */
export async function generateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  })

  // If user already has a referral code, return it
  if (user?.referralCode) {
    return user.referralCode
  }

  // Generate a unique referral code
  let code: string
  let isUnique = false
  let attempts = 0
  const maxAttempts = 10

  while (!isUnique && attempts < maxAttempts) {
    code = generateRandomCode(REFERRAL_CONFIG.REFERRAL_CODE_LENGTH)

    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    })

    isUnique = !existing
    attempts++
  }

  if (!isUnique) {
    throw new Error(
      'Failed to generate unique referral code after multiple attempts'
    )
  }

  // Save the referral code
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { referralCode: code! },
    select: { referralCode: true },
  })

  return updatedUser.referralCode!
}

/**
 * Get referral code for a user (return existing or null)
 */
export async function getReferralCode(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  })

  return user?.referralCode || null
}

/**
 * Set a custom referral code for a user
 */
export async function setCustomReferralCode(
  userId: string,
  code: string
): Promise<{ referralCode: string }> {
  // Validate code format
  const validatedCode = validateReferralCode(code)

  // Check if code is unique
  const existing = await prisma.user.findUnique({
    where: { referralCode: validatedCode },
    select: { id: true },
  })

  if (existing && existing.id !== userId) {
    throw new Error(
      'This referral code is already taken. Please choose another.'
    )
  }

  // Update user's referral code
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { referralCode: validatedCode },
    select: { referralCode: true },
  })

  return { referralCode: updated.referralCode! }
}

/**
 * Validate and sanitize referral code
 */
function validateReferralCode(code: string): string {
  const sanitized = code.trim().toLowerCase()

  if (sanitized.length < 3) {
    throw new Error('Referral code must be at least 3 characters long')
  }

  if (sanitized.length > 30) {
    throw new Error('Referral code must be at most 30 characters long')
  }

  if (!/^[a-z0-9-_]+$/.test(sanitized)) {
    throw new Error(
      'Referral code can only contain letters, numbers, dashes, and underscores'
    )
  }

  // Prevent reserved codes
  const reserved = [
    'admin',
    'api',
    'auth',
    'dashboard',
    'settings',
    'profile',
    'billing',
    'null',
  ]
  if (reserved.includes(sanitized)) {
    throw new Error('This referral code is reserved. Please choose another.')
  }

  // Block brand-related or trademarked terms (case-insensitive, checks substrings)
  const bannedBrands = ['emberly', 'embrly']
  for (const b of bannedBrands) {
    if (sanitized.includes(b)) {
      throw new Error(
        'Referral code may not contain brand or trademarked names. Please choose another.'
      )
    }
  }

  return sanitized
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      referralCredits: true,
      referralStats: true,
      _count: {
        select: { referrals: true },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const stats =
    typeof user.referralStats === 'string'
      ? JSON.parse(user.referralStats)
      : user.referralStats

  return {
    referralCode: user.referralCode,
    totalCredits: user.referralCredits,
    referralCount: user._count.referrals,
    creditedCount: stats.credited || 0,
    lastCreditedAt: stats.lastCreditedAt
      ? new Date(stats.lastCreditedAt)
      : null,
  }
}

/**
 * Records who referred a new signup. Nothing is credited yet: the new account
 * earns its credit by verifying its email, and the referrer earns theirs when
 * that account first pays.
 */
export async function processReferralSignup(
  newUserId: string,
  referralCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    const [referrer, newUser] = await Promise.all([
      prisma.user.findUnique({
        where: { referralCode },
        select: { id: true, email: true },
      }),
      prisma.user.findUnique({
        where: { id: newUserId },
        select: { email: true, referralStats: true },
      }),
    ])

    if (!referrer || !newUser) {
      return { success: false, message: 'Invalid referral code' }
    }

    if (
      referrer.id === newUserId ||
      isSameMailbox(referrer.email, newUser.email)
    ) {
      return { success: false, message: 'You cannot refer yourself' }
    }

    await prisma.user.update({
      where: { id: newUserId },
      data: {
        referrerUserId: referrer.id,
        referralStats: {
          ...readStats(newUser.referralStats),
          pendingSignupCredit: true,
          pendingReferrerReward: true,
        },
      },
    })

    return { success: true, message: 'Referral recorded' }
  } catch (error) {
    console.error('Failed to process referral signup:', error)
    return { success: false, message: 'Failed to process referral' }
  }
}

/** Gives a referred account its credit, once, after its email is verified. */
export async function creditVerifiedReferral(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await lockUsers(tx, [userId])
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
        referrerUserId: true,
        referralStats: true,
      },
    })
    if (!user?.emailVerified || !user.referrerUserId) return

    const { pendingSignupCredit, ...stats } = readStats(user.referralStats)
    if (!pendingSignupCredit) return

    await tx.user.update({
      where: { id: userId },
      data: {
        referralCredits: { increment: REFERRAL_CONFIG.REFERREE_CREDIT },
        referralStats: stats,
      },
    })
    await tx.creditTransaction.create({
      data: {
        userId,
        type: 'earned_referral',
        amountCents: REFERRAL_CONFIG.REFERREE_CREDIT * 100,
        description: 'Signed up with a referral link',
        relatedUserId: user.referrerUserId,
      },
    })
  })
}

/**
 * Pays the referrer, once, when the account they referred first pays. The
 * reward never exceeds what was actually paid, and is capped per referrer.
 */
export async function rewardReferrerForPayment(
  userId: string,
  amountPaidCents: number,
  relatedOrderId?: string
): Promise<void> {
  if (amountPaidCents <= 0) return

  const link = await prisma.user.findUnique({
    where: { id: userId },
    select: { referrerUserId: true },
  })
  const referrerId = link?.referrerUserId
  if (!referrerId) return

  const firstReward = await prisma.$transaction(async (tx) => {
    await lockUsers(tx, [userId, referrerId])
    const [user, referrer] = await Promise.all([
      tx.user.findUnique({
        where: { id: userId },
        select: { referralStats: true },
      }),
      tx.user.findUnique({
        where: { id: referrerId },
        select: { emailVerified: true, referralStats: true },
      }),
    ])
    if (!user || !referrer) return false

    const { pendingReferrerReward, ...stats } = readStats(user.referralStats)
    if (!pendingReferrerReward || !referrer.emailVerified) return false

    await tx.user.update({
      where: { id: userId },
      data: { referralStats: stats },
    })

    const referrerStats = readStats(referrer.referralStats)
    const credited = referrerStats.credited || 0
    if (credited >= REFERRAL_CONFIG.MAX_CREDITED_REFERRALS) return false

    const reward = referrerReward(amountPaidCents)
    await tx.user.update({
      where: { id: referrerId },
      data: {
        referralCredits: { increment: reward },
        referralStats: {
          ...referrerStats,
          count: (referrerStats.count || 0) + 1,
          credited: credited + 1,
          lastCreditedAt: new Date().toISOString(),
        },
      },
    })
    await tx.creditTransaction.create({
      data: {
        userId: referrerId,
        type: 'earned_referral',
        amountCents: Math.round(reward * 100),
        description: 'A referred account made its first payment',
        relatedUserId: userId,
        relatedOrderId,
      },
    })
    return credited === 0
  })

  if (firstReward) await addPerkRole(referrerId, 'AFFILIATE')
}

/**
 * Get referral history for a user
 */
export async function getReferralHistory(userId: string) {
  const referrals = await prisma.user.findMany({
    where: { referrerUserId: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return referrals
}

/**
 * Helper function to generate random code
 */
function generateRandomCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
