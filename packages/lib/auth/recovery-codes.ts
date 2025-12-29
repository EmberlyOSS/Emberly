/**
 * Two-Factor Authentication Recovery Codes
 * Provides utilities for generating, validating, and managing 2FA recovery codes
 */

import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.api

const CODES_PER_BATCH = 10
const CODE_LENGTH = 8 // 8 alphanumeric chars, will be displayed as XXXX-XXXX

/**
 * Generate a single recovery code
 * Format: XXXX-XXXX (8 characters with dash)
 */
function generateSingleCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789' // No I, L, O, 1, 0 to avoid confusion
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

/**
 * Generate a batch of recovery codes
 */
export function generateRecoveryCodes(count: number = CODES_PER_BATCH): string[] {
  const codes: string[] = []
  const usedCodes = new Set<string>()

  while (codes.length < count) {
    const code = generateSingleCode()
    if (!usedCodes.has(code)) {
      codes.push(code)
      usedCodes.add(code)
    }
  }

  return codes
}

/**
 * Create and store recovery codes for a user
 * Returns the codes to be displayed to the user (only time they'll see them)
 */
export async function createRecoveryCodes(userId: string): Promise<string[]> {
  const codes = generateRecoveryCodes(CODES_PER_BATCH)
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Store codes in database
  await prisma.twoFactorRecoveryCode.createMany({
    data: codes.map((code) => ({
      userId,
      code,
      batchId,
    })),
  })

  logger.info('Generated recovery codes for user', { userId, count: codes.length })

  return codes
}

/**
 * Validate and consume a recovery code
 */
export async function validateAndConsumeRecoveryCode(
  userId: string,
  code: string
): Promise<boolean> {
  const normalizedCode = code.toUpperCase().replace(/\s/g, '')

  try {
    const recoveryCode = await prisma.twoFactorRecoveryCode.findFirst({
      where: {
        userId,
        code: normalizedCode,
        used: false,
      },
    })

    if (!recoveryCode) {
      logger.warn('Invalid or already used recovery code attempt', { userId })
      return false
    }

    // Mark code as used
    await prisma.twoFactorRecoveryCode.update({
      where: { id: recoveryCode.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    })

    logger.info('Recovery code used', { userId })
    return true
  } catch (error) {
    logger.error('Error validating recovery code', error as Error, { userId })
    return false
  }
}

/**
 * Get recovery codes status for a user
 */
export async function getRecoveryCodesStatus(userId: string) {
  const codes = await prisma.twoFactorRecoveryCode.findMany({
    where: { userId },
    select: {
      used: true,
      createdAt: true,
      usedAt: true,
      batchId: true,
    },
  })

  const total = codes.length
  const used = codes.filter((c) => c.used).length
  const remaining = total - used
  const latestBatch = codes.length > 0 ? codes[0].batchId : null

  return {
    total,
    used,
    remaining,
    latestBatchId: latestBatch,
    generatedAt: codes.length > 0 ? codes[0].createdAt : null,
  }
}

/**
 * Get all unused recovery codes for a user
 * Returns the actual code values for display
 */
export async function getUnusedRecoveryCodes(userId: string): Promise<string[]> {
  const codes = await prisma.twoFactorRecoveryCode.findMany({
    where: { 
      userId,
      used: false,
    },
    select: {
      code: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return codes.map(c => c.code)
}

/**
 * Regenerate recovery codes (invalidate old ones, create new ones)
 */
export async function regenerateRecoveryCodes(userId: string): Promise<string[]> {
  // Delete all old recovery codes for this user
  await prisma.twoFactorRecoveryCode.deleteMany({
    where: { userId },
  })

  // Generate and store new codes
  return createRecoveryCodes(userId)
}

/**
 * Invalidate all recovery codes for a user
 * (Called when 2FA is disabled)
 */
export async function invalidateRecoveryCodes(userId: string): Promise<void> {
  await prisma.twoFactorRecoveryCode.deleteMany({
    where: { userId },
  })

  logger.info('Invalidated all recovery codes for user', { userId })
}
