import { z } from 'zod'

// Email preferences schema
export const EmailPreferencesSchema = z.object({
  security: z.boolean().default(true),    // Login alerts, password changes, 2FA
  account: z.boolean().default(true),     // Welcome, verification, profile changes
  billing: z.boolean().default(true),     // Payments, subscriptions, invoices
  marketing: z.boolean().default(false),  // Promotions, newsletters
  productUpdates: z.boolean().default(true), // Feature announcements, changelogs
})

export type EmailPreferences = z.infer<typeof EmailPreferencesSchema>
export type DiscordPreferences = z.infer<typeof EmailPreferencesSchema>

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  fullName: z.string().max(100).nullable().optional(),
  email: z.string().email('Invalid email address').max(255, 'Email too long').trim().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  image: z.string().optional(),
  randomizeFileUrls: z.boolean().optional(),
  enableRichEmbeds: z.boolean().optional(),
  theme: z.string().optional(),
  customColors: z.record(z.string()).optional(),
  defaultFileExpiration: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH']).optional(),
  defaultFileExpirationAction: z.enum(['DELETE', 'SET_PRIVATE']).optional(),
  // Email notification preferences
  emailNotificationsEnabled: z.boolean().optional(),
  emailPreferences: EmailPreferencesSchema.partial().optional(),
  // Discord webhook notification preferences
  discordWebhookUrl: z.string().url().nullable().optional(),
  discordNotificationsEnabled: z.boolean().optional(),
  discordPreferences: EmailPreferencesSchema.partial().optional(),
  // Public profile fields
  bio: z.string().max(500).nullable().optional(),
  website: z.string().url().nullable().optional(),
  twitter: z.string().max(100).nullable().optional(),
  github: z.string().max(100).nullable().optional(),
  discord: z.string().max(100).nullable().optional(),
  isProfilePublic: z.boolean().optional(),
  showLinkedAccounts: z.boolean().optional(),
  profileVisibility: z.string().optional(),
})

export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>

export interface ProfileResponse {
  id: string
  name: string | null
  email: string | null
  image: string | null
  randomizeFileUrls: boolean
  enableRichEmbeds: boolean
  theme?: string | null
  emailNotificationsEnabled?: boolean
  emailPreferences?: EmailPreferences
  discordWebhookUrl?: string | null
  discordNotificationsEnabled?: boolean
  discordPreferences?: DiscordPreferences
}
