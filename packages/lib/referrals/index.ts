/**
 * Referral/Affiliate system utilities
 */

import { prisma } from '@/packages/lib/database/prisma'
import { addPerkRole } from '@/packages/lib/perks'

/**
 * Constants for referral rewards
 */
export const REFERRAL_CONFIG = {
  REFERRER_CREDIT: 10, // $10 credit for each successful referral
  REFERREE_CREDIT: 10, // $10 credit for new users who sign up via referral
  REFERRAL_CODE_LENGTH: 8,
} as const

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
    throw new Error('Failed to generate unique referral code after multiple attempts')
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
export async function setCustomReferralCode(userId: string, code: string): Promise<{ referralCode: string }> {
  // Validate code format
  const validatedCode = validateReferralCode(code)

  // Check if code is unique
  const existing = await prisma.user.findUnique({
    where: { referralCode: validatedCode },
    select: { id: true },
  })

  if (existing && existing.id !== userId) {
    throw new Error('This referral code is already taken. Please choose another.')
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
    throw new Error('Referral code can only contain letters, numbers, dashes, and underscores')
  }

  // Prevent reserved codes
  const reserved = ['admin', 'api', 'auth', 'dashboard', 'settings', 'profile', 'billing', 'null']
  if (reserved.includes(sanitized)) {
    throw new Error('This referral code is reserved. Please choose another.')
  }

  // Block brand-related or trademarked terms (case-insensitive, checks substrings)
  const bannedBrands = ['emberly', 'embrly']
  for (const b of bannedBrands) {
    if (sanitized.includes(b)) {
      throw new Error('Referral code may not contain brand or trademarked names. Please choose another.')
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

  const stats = typeof user.referralStats === 'string' 
    ? JSON.parse(user.referralStats)
    : user.referralStats

  return {
    referralCode: user.referralCode,
    totalCredits: user.referralCredits,
    referralCount: user._count.referrals,
    creditedCount: stats.credited || 0,
    lastCreditedAt: stats.lastCreditedAt ? new Date(stats.lastCreditedAt) : null,
  }
}

/**
 * Process a referral signup
 * Called when a new user signs up with a referral code
 */
export async function processReferralSignup(
  newUserId: string,
  referralCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Find the referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true, referralCredits: true, referralStats: true },
    })

    if (!referrer) {
      return { success: false, message: 'Invalid referral code' }
    }

    // Update new user with referrer
    await prisma.user.update({
      where: { id: newUserId },
      data: {
        referrerUserId: referrer.id,
        referralCredits: REFERRAL_CONFIG.REFERREE_CREDIT,
      },
    })

    // Update referrer credits
    const stats = typeof referrer.referralStats === 'string'
      ? JSON.parse(referrer.referralStats)
      : referrer.referralStats

    const updatedStats = {
      count: (stats.count || 0) + 1,
      credited: (stats.credited || 0) + 1,
      lastCreditedAt: new Date().toISOString(),
    }

    await prisma.user.update({
      where: { id: referrer.id },
      data: {
        referralCredits: referrer.referralCredits + REFERRAL_CONFIG.REFERRER_CREDIT,
        referralStats: updatedStats,
      },
    })

    // Award AFFILIATE perk if this is their first referral
    if ((stats.credited || 0) === 0) {
      await addPerkRole(referrer.id, 'AFFILIATE')
    }

    return {
      success: true,
      message: `Referral credited! Both users receive $${REFERRAL_CONFIG.REFERREE_CREDIT} billing credit.`,
    }
  } catch (error) {
    console.error('Failed to process referral signup:', error)
    return { success: false, message: 'Failed to process referral' }
  }
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
