import { z } from 'zod'

import { isDiscordWebhookUrl } from '@/lib/events/utils/discord-webhook'

export const EmailPreferencesSchema = z.object({
  security: z.boolean().default(true),
  account: z.boolean().default(true),
  billing: z.boolean().default(true),
  marketing: z.boolean().default(false),
  productUpdates: z.boolean().default(true),
})

export type EmailPreferences = z.infer<typeof EmailPreferencesSchema>
export type DiscordPreferences = z.infer<typeof EmailPreferencesSchema>

export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2)
    .trim()
    .refine((name) => !name.includes(' '), 'Name cannot contain spaces')
    .optional(),
  fullName: z.string().max(100).nullable().optional(),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .trim()
    .optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  image: z.string().optional(),
  randomizeFileUrls: z.boolean().optional(),
  enableRichEmbeds: z.boolean().optional(),
  theme: z.string().nullable().optional(),
  customColors: z.record(z.string(), z.string()).nullable().optional(),
  defaultFileExpiration: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH']).optional(),
  defaultFileExpirationAction: z.enum(['DELETE', 'SET_PRIVATE']).optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  emailPreferences: EmailPreferencesSchema.partial().optional(),
  discordWebhookUrl: z
    .string()
    .trim()
    .refine((url) => url === '' || isDiscordWebhookUrl(url), {
      error:
        'Enter a Discord webhook URL (https://discord.com/api/webhooks/...)',
    })
    .transform((url) => url || null)
    .nullable()
    .optional(),
  discordNotificationsEnabled: z.boolean().optional(),
  discordPreferences: EmailPreferencesSchema.partial().optional(),
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
