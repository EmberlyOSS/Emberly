/**
 * Nexium – Talent Discovery Platform constants
 */

// ── Looking-for tags ──────────────────────────────────────────────────────────

export const NEXIUM_LOOKING_FOR = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACT',
  COLLAB: 'COLLAB',
  BOUNTY: 'BOUNTY',
} as const

export type NexiumLookingFor = (typeof NEXIUM_LOOKING_FOR)[keyof typeof NEXIUM_LOOKING_FOR]

export const NEXIUM_LOOKING_FOR_LABELS: Record<NexiumLookingFor, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  COLLAB: 'Collaboration',
  BOUNTY: 'Bounties',
}

// ── Availability ──────────────────────────────────────────────────────────────

export const NEXIUM_AVAILABILITY_LABELS = {
  OPEN: 'Open to opportunities',
  LIMITED: 'Limited availability',
  CLOSED: 'Not available',
} as const

// ── Skill categories ──────────────────────────────────────────────────────────

export const NEXIUM_SKILL_CATEGORIES = [
  'Frontend',
  'Backend',
  'Full-Stack',
  'Mobile',
  'DevOps / Cloud',
  'Security',
  'Design / UI',
  'Community',
  'Marketing',
  'Content',
  'Game Dev',
  'Data / ML',
  'Other',
] as const

export type NexiumSkillCategory = (typeof NEXIUM_SKILL_CATEGORIES)[number]

export const NEXIUM_SKILL_LEVEL_LABELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
} as const

// ── Signal types ──────────────────────────────────────────────────────────────

export const NEXIUM_SIGNAL_TYPE_LABELS = {
  GITHUB_REPO: 'GitHub Repository',
  DEPLOYED_APP: 'Deployed App',
  OPEN_SOURCE_CONTRIBUTION: 'Open Source Contribution',
  SHIPPED_PRODUCT: 'Shipped Product',
  COMMUNITY_IMPACT: 'Community Impact',
  ASSET_PACK: 'Asset Pack',
  CERTIFICATION: 'Certification',
  OTHER: 'Other',
} as const

// ── Opportunity types ─────────────────────────────────────────────────────────

export const NEXIUM_OPPORTUNITY_TYPE_LABELS = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  COLLAB: 'Collaboration',
  BOUNTY: 'Bounty',
} as const

export const NEXIUM_OPPORTUNITY_STATUS_LABELS = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  FILLED: 'Filled',
  CLOSED: 'Closed',
} as const

// ── Application statuses ──────────────────────────────────────────────────────

export const NEXIUM_APPLICATION_STATUS_LABELS = {
  PENDING: 'Pending',
  VIEWED: 'Viewed',
  SHORTLISTED: 'Shortlisted',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
} as const

// ── Squad statuses ────────────────────────────────────────────────────────────

export const NEXIUM_SQUAD_STATUS_LABELS = {
  FORMING: 'Forming',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  DISBANDED: 'Disbanded',
} as const

// ── Limits ────────────────────────────────────────────────────────────────────

export const NEXIUM_MAX_SKILLS = 30
export const NEXIUM_MAX_SIGNALS = 20
export const NEXIUM_MAX_SQUAD_SIZE = 20
