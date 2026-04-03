/**
 * User service layer
 * Standardized user data operations with consistent field selects.
 * Builds on lookup.ts primitives — use this for business-logic operations,
 * and lookup.ts for raw query helpers.
 */

import { Prisma, UserRole } from '@/prisma/generated/prisma/client'

import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

import { findUserByIdWithSelect } from './lookup'

const logger = loggers.users

/**
 * Standard select used across all admin user views.
 * Used in: GET /api/users, POST /api/users, PUT /api/users
 */
export const USER_ADMIN_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  urlId: true,
  storageUsed: true,
  storageQuotaMB: true,
  emailNotificationsEnabled: true,
  isVerified: true,
  bannedAt: true,
  banReason: true,
  banType: true,
  banExpiresAt: true,
  subscriptions: {
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: {
      status: true,
      product: {
        select: {
          name: true,
          slug: true,
          storageQuotaGB: true,
          uploadSizeCapMB: true,
          customDomainsLimit: true,
        },
      },
    },
  },
  _count: {
    select: {
      files: true,
      shortenedUrls: true,
    },
  },
} satisfies Prisma.UserSelect

export type UserAdminView = Prisma.UserGetPayload<{
  select: typeof USER_ADMIN_SELECT
}>

/**
 * Fetch a single user by ID using the standard admin profile select.
 * Returns null if the user is not found.
 */
export async function getUserProfile(userId: string) {
  return findUserByIdWithSelect(userId, USER_ADMIN_SELECT)
}

export interface UpdateProfileData {
  name?: string
  email?: string
  role?: UserRole
  urlId?: string
  storageQuotaMB?: number | null
  image?: string | null
}

/**
 * Update a user's profile fields and return the updated admin view.
 * For complex admin operations (grants, plan changes, folder rename) use the
 * PUT /api/users handler directly — this covers simple scalar field updates.
 */
export async function updateUserProfile(
  userId: string,
  data: UpdateProfileData
): Promise<UserAdminView> {
  logger.info('Updating user profile', { userId })
  return prisma.user.update({
    where: { id: userId },
    data,
    select: USER_ADMIN_SELECT,
  })
}
