/**
 * Backfill Password History for Existing Users
 * 
 * This utility is for retroactively adding existing users' current passwords to their
 * password history. This is useful for users who were created before the password
 * history system was implemented.
 * 
 * Usage:
 *   - Can be called via an admin endpoint
 *   - Or run manually via a script
 *   - Or triggered in a cronjob to gradually backfill
 * 
 * Safety:
 *   - Only adds password if no history exists
 *   - Non-blocking: won't affect user experience
 *   - Idempotent: safe to run multiple times
 */

'use server'

import { prisma } from '@/packages/lib/database/prisma'

export interface BackfillResult {
  totalUsers: number
  usersProcessed: number
  passwordsAdded: number
  errors: Array<{ userId: string; error: string }>
}

/**
 * Backfill password history for all users without any password history
 * 
 * @param limit - Process up to N users at a time (default: 100)
 * @returns Result object with counts
 */
export async function backfillPasswordHistory(limit: number = 100): Promise<BackfillResult> {
  const result: BackfillResult = {
    totalUsers: 0,
    usersProcessed: 0,
    passwordsAdded: 0,
    errors: [],
  }

  try {
    // Find users without any password history
    const usersWithoutHistory = await prisma.user.findMany({
      where: {
        password: { not: null }, // Only users with passwords
        passwordHistory: { none: {} }, // No password history yet
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
      take: limit,
    })

    result.totalUsers = usersWithoutHistory.length

    // Process each user
    for (const user of usersWithoutHistory) {
      try {
        if (!user.password) {
          continue
        }

        // Add current password to history
        await prisma.passwordHistory.create({
          data: {
            userId: user.id,
            password: user.password,
          },
        })

        result.passwordsAdded++
      } catch (error) {
        result.errors.push({
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }

      result.usersProcessed++
    }
  } catch (error) {
    console.error('Backfill password history failed:', error)
    throw error
  }

  return result
}

/**
 * Backfill password history for a single user
 * Useful when you want to ensure a specific user has their password in history
 * 
 * @param userId - The user ID to backfill
 * @returns true if password was added, false if already existed
 */
export async function backfillUserPasswordHistory(userId: string): Promise<boolean> {
  try {
    // Check if user has any password history
    const existingHistory = await prisma.passwordHistory.findFirst({
      where: { userId },
      select: { id: true },
    })

    if (existingHistory) {
      return false // Already has history
    }

    // Get user's current password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user?.password) {
      throw new Error('User not found or has no password')
    }

    // Add current password to history
    await prisma.passwordHistory.create({
      data: {
        userId,
        password: user.password,
      },
    })

    return true
  } catch (error) {
    console.error(`Failed to backfill password history for user ${userId}:`, error)
    throw error
  }
}

/**
 * Get stats about password history coverage
 * 
 * @returns Object with coverage statistics
 */
export async function getPasswordHistoryCoverageStats(): Promise<{
  totalUsers: number
  usersWithPassword: number
  usersWithHistory: number
  usersWithoutHistory: number
  coveragePercentage: number
}> {
  const [totalUsers, usersWithPassword, usersWithHistory] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { password: { not: null } },
    }),
    prisma.user.count({
      where: { passwordHistory: { some: {} } },
    }),
  ])

  const usersWithoutHistory = usersWithPassword - usersWithHistory
  const coveragePercentage = usersWithPassword > 0
    ? Math.round((usersWithHistory / usersWithPassword) * 100)
    : 100

  return {
    totalUsers,
    usersWithPassword,
    usersWithHistory,
    usersWithoutHistory,
    coveragePercentage,
  }
}
