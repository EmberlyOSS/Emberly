/**
 * Grants system constants
 *
 * Grants are visible role badges awarded to users via approved applications
 * or manually by superadmins. Unlike perk roles (which affect quotas),
 * grants are purely cosmetic/social — they show on the public profile as
 * coloured badge pills and may carry supplemental permissions.
 *
 * A user can hold multiple grants simultaneously.
 */

export const GRANTS = {
  // Staff application grants
  STAFF:     'STAFF',
  SUPPORT:   'SUPPORT',
  DEVELOPER: 'DEVELOPER',
  MODERATOR: 'MODERATOR',
  DESIGNER:  'DESIGNER',
  // Partner application grant
  PARTNER:   'PARTNER',
} as const

export type Grant = (typeof GRANTS)[keyof typeof GRANTS]

export const ALL_GRANTS: Grant[] = Object.values(GRANTS)

/**
 * Display metadata for each grant
 */
export interface GrantMeta {
  /** Human-readable label shown on badge */
  label: string
  /** Short description for admin UIs */
  description: string
  /** Tailwind utility classes for text + border colour (dark-mode friendly) */
  className: string
  /** Tailwind bg gradient classes */
  gradient: string
  /** Lucide icon name (resolved at render time to avoid bundling all icons here) */
  icon: 'HeartHandshake' | 'Headset' | 'Code2' | 'ShieldCheck' | 'Palette' | 'Handshake'
  /**
   * Which ApplicationType (Prisma enum) automatically awards this grant
   * when the application is APPROVED. null = manual only.
   */
  applicationTypeSource: string | null
}

export const GRANT_META: Record<Grant, GrantMeta> = {
  [GRANTS.STAFF]: {
    label: 'Staff',
    description: 'General Emberly team member',
    className: 'text-violet-400 dark:text-violet-300 border-violet-400/40',
    gradient: 'from-violet-600/25 via-violet-500/15 to-indigo-400/5',
    icon: 'HeartHandshake',
    applicationTypeSource: null, // STAFF applications can award more specific grants; this is manual
  },
  [GRANTS.SUPPORT]: {
    label: 'Support',
    description: 'Community support team member',
    className: 'text-sky-400 dark:text-sky-300 border-sky-400/40',
    gradient: 'from-sky-600/25 via-sky-500/15 to-cyan-400/5',
    icon: 'Headset',
    applicationTypeSource: 'STAFF',
  },
  [GRANTS.DEVELOPER]: {
    label: 'Developer',
    description: 'Emberly developer / engineer',
    className: 'text-emerald-400 dark:text-emerald-300 border-emerald-400/40',
    gradient: 'from-emerald-600/25 via-emerald-500/15 to-green-400/5',
    icon: 'Code2',
    applicationTypeSource: 'STAFF',
  },
  [GRANTS.MODERATOR]: {
    label: 'Moderator',
    description: 'Community moderator',
    className: 'text-rose-400 dark:text-rose-300 border-rose-400/40',
    gradient: 'from-rose-600/25 via-rose-500/15 to-pink-400/5',
    icon: 'ShieldCheck',
    applicationTypeSource: 'STAFF',
  },
  [GRANTS.DESIGNER]: {
    label: 'Designer',
    description: 'Creative / design team member',
    className: 'text-fuchsia-400 dark:text-fuchsia-300 border-fuchsia-400/40',
    gradient: 'from-fuchsia-600/25 via-purple-500/15 to-pink-400/5',
    icon: 'Palette',
    applicationTypeSource: 'STAFF',
  },
  [GRANTS.PARTNER]: {
    label: 'Partner',
    description: 'Official Emberly partner',
    className: 'text-amber-400 dark:text-amber-300 border-amber-400/40',
    gradient: 'from-amber-600/25 via-yellow-500/15 to-orange-400/5',
    icon: 'Handshake',
    applicationTypeSource: 'PARTNER',
  },
}

/**
 * Grants that carry supplemental panel permissions.
 * Used by hasGrantPermission() to gate staff-only features.
 */
export const GRANT_PERMISSIONS = {
  /** Access the staff-facing support panel */
  ACCESS_SUPPORT_PANEL: [GRANTS.SUPPORT, GRANTS.STAFF, GRANTS.MODERATOR],
  /** Access the staff portal in general */
  ACCESS_STAFF_PORTAL: [
    GRANTS.STAFF,
    GRANTS.SUPPORT,
    GRANTS.DEVELOPER,
    GRANTS.MODERATOR,
    GRANTS.DESIGNER,
  ],
} as const

export type GrantPermission = keyof typeof GRANT_PERMISSIONS
