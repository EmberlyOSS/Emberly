/**
 * Password Reuse Prevention
 * 
 * Prevents users from reusing previous passwords
 * Stores encrypted password hashes in PasswordHistory
 */

import { compare } from 'bcryptjs'
import { prisma } from '@/packages/lib/database/prisma'

export interface PasswordReuseCheckResult {
  isReused: boolean
  reusedCount?: number
  error?: string
}

/**
 * Check if a password has been used before by this user
 * Compares against last N passwords (default: 5)
 * 
 * @param userId - The user ID
 * @param newPassword - The new password to check
 * @param checkCount - How many previous passwords to check (default: 5)
 * @returns Object with isReused flag
 */
export async function checkPasswordReuse(
  userId: string,
  newPassword: string,
  checkCount: number = 5
): Promise<PasswordReuseCheckResult> {
  try {
    // Get last N password hashes from history
    const passwordHistory = await prisma.passwordHistory.findMany({
      where: { userId },
      select: { password: true },
      orderBy: { createdAt: 'desc' },
      take: checkCount,
    })

    if (!passwordHistory.length) {
      return { isReused: false }
    }

    // Check if new password matches any historical password
    for (const history of passwordHistory) {
      const matches = await compare(newPassword, history.password)
      if (matches) {
        return {
          isReused: true,
          reusedCount: passwordHistory.length,
        }
      }
    }

    return { isReused: false }
  } catch (error) {
    console.error('Password reuse check failed:', error)
    return {
      isReused: false,
      error: error instanceof Error ? error.message : 'Check failed',
    }
  }
}

/**
 * Record current password in history before updating to new one
 * This should be called BEFORE changing the password
 * 
 * @param userId - The user ID
 * @param currentPasswordHash - The current password hash to store
 */
export async function recordPasswordHistory(
  userId: string,
  currentPasswordHash: string
): Promise<void> {
  try {
    await prisma.passwordHistory.create({
      data: {
        userId,
        password: currentPasswordHash,
      },
    })

    // Optionally clean up old entries (keep only last 12)
    // This prevents the table from growing unbounded
    const oldEntries = await prisma.passwordHistory.findMany({
      where: { userId },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      skip: 12,
    })

    if (oldEntries.length > 0) {
      await prisma.passwordHistory.deleteMany({
        where: {
          id: { in: oldEntries.map(e => e.id) },
        },
      })
    }
  } catch (error) {
    console.error('Failed to record password history:', error)
    // Don't throw - this shouldn't block password changes
  }
}

/**
 * Ensure user's current password is in history
 * For backward compatibility with users created before password history system
 * Should be called on login to catch legacy accounts
 * 
 * @param userId - The user ID
 * @param currentPasswordHash - The current password hash from User.password
 * @returns true if password was added, false if already existed
 */
export async function ensurePasswordInHistory(
  userId: string,
  currentPasswordHash: string
): Promise<boolean> {
  try {
    // Check if any password history exists for this user
    const existingHistory = await prisma.passwordHistory.findFirst({
      where: { userId },
      select: { id: true },
    })

    // If history exists, current password is already tracked
    if (existingHistory) {
      return false
    }

    // No history exists, so this is a legacy user
    // Add their current password to history
    await prisma.passwordHistory.create({
      data: {
        userId,
        password: currentPasswordHash,
      },
    })

    return true
  } catch (error) {
    console.error('Failed to ensure password in history:', error)
    // Don't throw - this shouldn't block login
    return false
  }
}
