/**
 * Grants system utilities
 *
 * Grants are cosmetic role badges awarded via approved applications or
 * manually by superadmins. Users can hold multiple grants simultaneously.
 */

import { prisma } from '@emberly/db'
import {
  ALL_GRANTS,
  GRANT_META,
  GRANT_PERMISSIONS,
  GRANTS,
  type Grant,
  type GrantMeta,
  type GrantPermission,
} from './constants'

export { GRANTS, GRANT_META, ALL_GRANTS } from './constants'
export type { Grant, GrantMeta, GrantPermission }

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Return true if a string is a recognised grant value.
 */
export function isValidGrant(value: string): value is Grant {
  return ALL_GRANTS.includes(value as Grant)
}

/**
 * Filter an array of raw strings down to only valid grants.
 */
export function sanitizeGrants(values: string[]): Grant[] {
  return values.filter(isValidGrant)
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Add a single grant to a user (idempotent — does nothing if already present).
 */
export async function addGrant(userId: string, grant: Grant): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { grants: true },
  })
  if (!user) return
  if (user.grants.includes(grant)) return

  await prisma.user.update({
    where: { id: userId },
    data: { grants: [...user.grants, grant] },
  })
}

/**
 * Remove a grant from a user (idempotent — does nothing if not present).
 */
export async function removeGrant(userId: string, grant: Grant): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { grants: true },
  })
  if (!user) return

  await prisma.user.update({
    where: { id: userId },
    data: {
      grants: [...new Set(user.grants.filter((g) => g !== grant))],
    },
  })
}

/**
 * Replace all grants for a user in one write.
 */
export async function setGrants(userId: string, grants: Grant[]): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { grants: sanitizeGrants(grants) },
  })
}

// ─── Permission helpers ───────────────────────────────────────────────────────

/**
 * Check whether a user's grants include at least one that carries the given
 * grant-level permission.
 *
 * @param userGrants - the grants array from the user record
 * @param permission - the GRANT_PERMISSIONS key to check
 */
export function hasGrantPermission(
  userGrants: string[],
  permission: GrantPermission
): boolean {
  const required = GRANT_PERMISSIONS[permission] as readonly string[]
  return userGrants.some((g) => required.includes(g))
}

/**
 * Derive which grant (if any) should be auto-awarded when an application of
 * the given type is APPROVED.
 *
 * Returns null for application types with no default auto-award (e.g. STAFF
 * applications need a more specific grant chosen by the admin at review time).
 */
export function getDefaultGrantForApplicationType(
  applicationType: string
): Grant | null {
  // PARTNER → PARTNER grant automatically
  if (applicationType === 'PARTNER') return GRANTS.PARTNER
  // VERIFICATION, BAN_APPEAL → no cosmetic grant
  return null
}
