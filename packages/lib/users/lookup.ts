/**
 * User lookup service
 * Centralizes all user query patterns to avoid duplication across routes
 * Provides consistent user lookup by multiple identifiers
 */

import { Prisma } from '@/prisma/generated/prisma/client'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.users

/**
 * Find a user by any identifier (urlId, email, username, name)
 * Returns full user object
 * Used for public profile lookups
 */
export async function findUserByIdentifier(identifier: string) {
  if (!identifier) return null

  return prisma.user.findFirst({
    where: {
      OR: [
        { urlId: identifier },
        { email: identifier },
        { name: identifier },
        { vanityId: identifier },
      ],
    },
  })
}

/**
 * Find user with custom select fields
 * Used when you only need specific fields to avoid over-fetching
 */
export async function findUserWithSelect<T extends Prisma.UserSelect>(
  identifier: string,
  select: T
) {
  if (!identifier) return null

  return prisma.user.findFirst({
    where: {
      OR: [
        { urlId: identifier },
        { email: identifier },
        { name: identifier },
        { vanityId: identifier },
      ],
    },
    select,
  })
}

/**
 * Find multiple users by identifiers
 * Useful for batch lookups (e.g., collaborators)
 */
export async function findUsersByIdentifiers(identifiers: string[]) {
  if (!identifiers.length) return []

  return prisma.user.findMany({
    where: {
      OR: identifiers.map((id) => ({
        OR: [
          { urlId: id },
          { email: id },
          { name: id },
          { vanityId: id },
        ],
      })),
    },
  })
}

/**
 * Find user by email (common operation)
 */
export async function findUserByEmail(email: string) {
  if (!email) return null

  return prisma.user.findUnique({
    where: { email },
  })
}

/**
 * Find user by urlId (user profile slug)
 */
export async function findUserByUrlId(urlId: string) {
  if (!urlId) return null

  return prisma.user.findUnique({
    where: { urlId },
  })
}

/**
 * Find user by vanity/username
 */
export async function findUserByVanityId(vanityId: string) {
  if (!vanityId) return null

  return prisma.user.findUnique({
    where: { vanityId },
  })
}

/**
 * Find user by ID
 */
export async function findUserById(id: string) {
  if (!id) return null

  return prisma.user.findUnique({
    where: { id },
  })
}

/**
 * Find user by ID with custom select
 */
export async function findUserByIdWithSelect<T extends Prisma.UserSelect>(
  id: string,
  select: T
) {
  if (!id) return null

  return prisma.user.findUnique({
    where: { id },
    select,
  })
}

/**
 * Check if a user exists
 */
export async function userExists(identifier: string): Promise<boolean> {
  const user = await findUserByIdentifier(identifier)
  return !!user
}

/**
 * Check if email is already taken (excluding a specific user)
 */
export async function emailIsTaken(
  email: string,
  excludeUserId?: string
): Promise<boolean> {
  const where: Prisma.UserWhereInput = {
    email,
    NOT: excludeUserId ? { id: excludeUserId } : undefined,
  }

  const count = await prisma.user.count({ where })
  return count > 0
}

/**
 * Check if urlId is unique
 */
export async function urlIdIsUnique(urlId: string): Promise<boolean> {
  const count = await prisma.user.count({
    where: { urlId },
  })
  return count === 0
}

/**
 * Check if vanityId is unique
 */
export async function vanityIdIsUnique(vanityId: string): Promise<boolean> {
  const count = await prisma.user.count({
    where: { vanityId },
  })
  return count === 0
}
