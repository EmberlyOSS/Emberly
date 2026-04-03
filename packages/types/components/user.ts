import { ExpiryAction } from '@/packages/types/events'
import type { DiscordPreferences, EmailPreferences } from '@/packages/types/dto/profile'

export type { EmailPreferences }

export interface User {
  id: string
  name: string | null
  fullName?: string | null
  email: string | null
  image: string | null
  storageUsed: number
  role: 'SUPERADMIN' | 'ADMIN' | 'USER'
  randomizeFileUrls: boolean
  enableRichEmbeds: boolean
  urlId: string
  vanityId?: string | null
  bio?: string | null
  website?: string | null
  twitter?: string | null
  github?: string | null
  discord?: string | null
  isProfilePublic?: boolean
  showLinkedAccounts?: boolean
  fileCount: number
  shortUrlCount: number
  defaultFileExpiration: 'DISABLED' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | null
  defaultFileExpirationAction: 'DELETE' | 'SET_PRIVATE' | null
  // Optional billing info
  stripeCustomerId?: string | null
  subscription?: {
    id: string
    productId: string
    productName?: string | null
    status: string
    currentPeriodEnd?: string | null
  } | null
  // Optional per-user quota (MB). When null, system default applies.
  storageQuotaMB?: number | null
  // Email notification preferences
  emailNotificationsEnabled?: boolean
  emailPreferences?: EmailPreferences
  // Discord webhook notification preferences
  discordWebhookUrl?: string | null
  discordNotificationsEnabled?: boolean
  discordPreferences?: DiscordPreferences
  // Password breach detection
  passwordBreachDetectedAt?: string | null
}

export interface ProfileClientProps {
  user: User
  quotasEnabled: boolean
  formattedQuota: string
  formattedUsed: string
  usagePercentage: number
  isAdmin: boolean
}

export interface PaginationData {
  current: number
  total: number
  totalPages: number
  perPage: number
}

export interface UsersResponse {
  users: User[]
  pagination: PaginationData
}

export interface UserFormData {
  name: string
  email: string
  role: 'ADMIN' | 'USER'
  quota?: number
}
