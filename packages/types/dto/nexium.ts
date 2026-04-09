import { z } from 'zod'

import {
  NEXIUM_MAX_SKILLS,
  NEXIUM_MAX_SIGNALS,
  NEXIUM_MAX_SQUAD_SIZE,
} from '@/packages/lib/nexium/constants'

// ── Shared enums ──────────────────────────────────────────────────────────────

export const NexiumAvailabilitySchema = z.enum(['OPEN', 'LIMITED', 'CLOSED'])
export const NexiumSkillLevelSchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
export const NexiumSignalTypeSchema = z.enum([
  'GITHUB_REPO',
  'DEPLOYED_APP',
  'OPEN_SOURCE_CONTRIBUTION',
  'SHIPPED_PRODUCT',
  'COMMUNITY_IMPACT',
  'ASSET_PACK',
  'CERTIFICATION',
  'OTHER',
])
export const NexiumOpportunityTypeSchema = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'COLLAB',
  'BOUNTY',
])
export const NexiumOpportunityStatusSchema = z.enum(['DRAFT', 'OPEN', 'FILLED', 'CLOSED'])
export const NexiumApplicationStatusSchema = z.enum([
  'PENDING',
  'VIEWED',
  'SHORTLISTED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
])
export const NexiumSquadStatusSchema = z.enum(['FORMING', 'ACTIVE', 'COMPLETED', 'DISBANDED'])
export const NexiumSquadRoleSchema = z.enum(['OWNER', 'MEMBER', 'OBSERVER'])

// ── Profile ───────────────────────────────────────────────────────────────────

export const CreateProfileSchema = z.object({
  title: z.string().max(120).optional(),
  availability: NexiumAvailabilitySchema.optional(),
  lookingFor: z.array(z.string().max(50)).max(10).optional(),
  headline: z.string().max(120).optional(),
  isVisible: z.boolean().optional(),
  location: z.string().max(100).nullable().optional(),
  timezone: z.string().max(60).nullable().optional(),
  activeHours: z.string().max(100).nullable().optional(),
})

export const UpdateProfileSchema = CreateProfileSchema.partial()

export type CreateProfileRequest = z.infer<typeof CreateProfileSchema>
export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>

// ── Skills ────────────────────────────────────────────────────────────────────

export const SkillInputSchema = z.object({
  name: z.string().min(1).max(60),
  level: NexiumSkillLevelSchema,
  category: z.string().max(60).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
})

export const UpdateSkillSchema = SkillInputSchema.partial()

export const ReplaceSkillsSchema = z.object({
  skills: z.array(SkillInputSchema).max(NEXIUM_MAX_SKILLS),
})

export const ReorderSkillsSchema = z.object({
  orderedIds: z.array(z.string()),
})

export type SkillInput = z.infer<typeof SkillInputSchema>
export type ReplaceSkillsRequest = z.infer<typeof ReplaceSkillsSchema>

// ── Signals ───────────────────────────────────────────────────────────────────

export const SignalInputSchema = z.object({
  type: NexiumSignalTypeSchema,
  title: z.string().min(1).max(120),
  url: z.string().url().optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  skills: z.array(z.string()).max(10).optional(),
})

export const UpdateSignalSchema = SignalInputSchema.partial()

export const ReorderSignalsSchema = z.object({
  orderedIds: z.array(z.string()),
})

export type SignalInput = z.infer<typeof SignalInputSchema>

// ── Opportunities ─────────────────────────────────────────────────────────────

export const CreateOpportunitySchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  type: NexiumOpportunityTypeSchema,
  requiredSkills: z.array(z.string()).max(20).optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
  remote: z.boolean().default(true),
  location: z.string().max(100).optional(),
  tags: z.array(z.string().max(40)).max(10).optional(),
  status: NexiumOpportunityStatusSchema.optional(),
})

export const UpdateOpportunitySchema = CreateOpportunitySchema.partial()

export type CreateOpportunityRequest = z.infer<typeof CreateOpportunitySchema>
export type UpdateOpportunityRequest = z.infer<typeof UpdateOpportunitySchema>

// ── Applications ──────────────────────────────────────────────────────────────

export const ApplySchema = z.object({
  message: z.string().max(2000).optional(),
})

export const UpdateApplicationStatusSchema = z.object({
  status: NexiumApplicationStatusSchema,
})

export type ApplyRequest = z.infer<typeof ApplySchema>

// ── Squads ────────────────────────────────────────────────────────────────────

export const CreateSquadSchema = z.object({
  name: z.string().min(3).max(60),
  description: z.string().max(500).optional(),
  skills: z.array(z.string()).max(20).optional(),
  maxSize: z.number().int().min(2).max(NEXIUM_MAX_SQUAD_SIZE).optional(),
  isPublic: z.boolean().optional(),
})

export const UpdateSquadSchema = CreateSquadSchema.partial().extend({
  status: NexiumSquadStatusSchema.optional(),
})

export const SetMemberRoleSchema = z.object({
  userId: z.string(),
  role: NexiumSquadRoleSchema,
})

export type CreateSquadRequest = z.infer<typeof CreateSquadSchema>
export type UpdateSquadRequest = z.infer<typeof UpdateSquadSchema>
