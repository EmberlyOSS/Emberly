/**
 * Centralized Validation Schemas
 * 
 * All Zod schemas used across routes consolidated in one place
 * Organized by domain for easy maintenance
 * 
 * Import pattern:
 * import { auth, files, users, domains } from '@/packages/lib/validation'
 */

import { z } from 'zod'
import { isSafeUrl } from '@/packages/lib/security/ssrf'

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const auth = {
  register: z.object({
    name: z
      .string()
      .min(2, 'Username must be at least 2 characters')
      .max(50, 'Username must be at most 50 characters')
      .refine((name) => !name.includes('@'), 'Username cannot contain @ symbol'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),

  login: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password required'),
    twoFactorCode: z.string().optional(),
  }),

  desktopAuth: z.object({
    emailOrUsername: z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required'),
    twoFactorCode: z.string().optional(),
  }),

  passwordReset: z.object({
    email: z.string().email('Invalid email'),
  }),

  passwordResetVerify: z.object({
    token: z.string().min(10),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),

  passwordForgot: z.object({
    email: z.string().email('Invalid email'),
  }),

  passwordChange: z.object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }),

  twoFactorEnable: z.object({
    code: z.string().length(6, 'Code must be 6 digits'),
  }),

  twoFactorDisable: z.object({
    password: z.string().min(1, 'Password required'),
  }),

  twoFactorVerify: z.object({
    code: z.string().min(1, 'Code required'),
  }),

  resendVerification: z.object({
    email: z.string().email('Invalid email'),
  }),

  verifyEmail: z.object({
    email: z.string().email('Invalid email'),
    code: z.string().min(1, 'Code required'),
  }),

  magicLinkRequest: z.object({
    email: z.string().email('Invalid email'),
  }),

  magicLinkVerify: z.object({
    token: z.string().min(10),
    email: z.string().email('Invalid email'),
  }),
}

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const users = {
  create: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email'),
    password: z.string().min(8).optional(),
    role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']),
    storageQuotaMB: z.number().min(0).optional(),
    grantStorageGB: z.number().min(0).optional(),
    grantCustomDomains: z.number().min(0).optional(),
  }),

  update: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email('Invalid email').optional(),
    role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
    storageQuotaMB: z.number().min(0).optional(),
  }),

  impersonate: z.object({
    userId: z.string().min(1, 'User ID required'),
  }),
}

// ============================================================================
// FILE SCHEMAS
// ============================================================================

export const files = {
  upload: z.object({
    visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
    password: z.string().optional().nullable(),
    domain: z.string().optional(),
  }),

  update: z.object({
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
    password: z.string().optional().nullable(),
    name: z.string().max(255).optional(),
  }),

  setPassword: z.object({
    password: z.string().min(1, 'Password required'),
  }),

  setExpiry: z.object({
    expiresAt: z.string().datetime().nullable(),
  }),

  collaboratorAdd: z.object({
    email: z.string().email('Invalid email'),
    permission: z.enum(['view', 'suggest', 'edit']),
  }),

  collaboratorUpdate: z.object({
    permission: z.enum(['view', 'suggest', 'edit']),
  }),

  uploadChunk: z.object({
    uploadId: z.string().min(1),
    chunkIndex: z.number().min(0),
    totalChunks: z.number().min(1),
  }),

  completeUpload: z.object({
    uploadId: z.string().min(1),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
    password: z.string().optional().nullable(),
  }),
}

// ============================================================================
// DOMAIN SCHEMAS
// ============================================================================

export const domains = {
  create: z.object({
    domain: z.string().min(3, 'Domain must be at least 3 characters'),
  }),

  update: z.object({
    domain: z.string().min(3).optional(),
  }),

  verify: z.object({
    code: z.string().min(1, 'Verification code required'),
  }),
}

// ============================================================================
// EMAIL SCHEMAS
// ============================================================================

export const email = {
  broadcast: z.object({
    subject: z.string().min(1, 'Subject required').max(200),
    body: z.string().min(1, 'Body required').max(5000),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    ctaLabel: z.string().optional(),
    ctaHref: z.string().url().optional(),
    recipientFilter: z.enum(['all', 'verified', 'unverified', 'admin']).default('all'),
    dryRun: z.boolean().default(false),
  }),

  send: z.object({
    to: z.string().email('Invalid email'),
    subject: z.string().min(1),
    body: z.string().min(1),
    template: z.string().optional(),
  }),
}

// ============================================================================
// PROFILE SCHEMAS
// ============================================================================

export const profile = {
  update: z.object({
    name: z.string().min(2).max(100).optional(),
    fullName: z.string().max(100).nullable().optional(),
    email: z.string().email('Invalid email').optional(),
    bio: z.string().max(500).nullable().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).optional(),
    image: z.string().optional(),
    emailPreferences: z
      .object({
        security: z.boolean().optional(),
        account: z.boolean().optional(),
        billing: z.boolean().optional(),
        marketing: z.boolean().optional(),
        productUpdates: z.boolean().optional(),
      })
      .optional(),
  }),

  emailPreferences: z.object({
    security: z.boolean().default(true),
    account: z.boolean().default(true),
    billing: z.boolean().default(true),
    marketing: z.boolean().default(false),
    productUpdates: z.boolean().default(true),
  }),
}

// ============================================================================
// URL SHORTENER SCHEMAS
// ============================================================================

export const urls = {
  create: z.object({
    url: z
      .string()
      .url('Invalid URL')
      .refine(isSafeUrl, 'URL is not allowed (internal or private address)'),
  }),

  update: z.object({
    url: z
      .string()
      .url('Invalid URL')
      .refine(isSafeUrl, 'URL is not allowed')
      .optional(),
  }),
}

// ============================================================================
// SETUP SCHEMAS
// ============================================================================

export const setup = z.object({
  admin: z.object({
    name: z
      .string()
      .min(2, 'Username must be at least 2 characters')
      .max(50, 'Username must be at most 50 characters')
      .refine((name) => !name.includes('@'), 'Username cannot contain @ symbol')
      .refine(
        (name) => name.trim().length >= 2,
        'Username cannot be only whitespace'
      ),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
  siteSettings: z
    .object({
      siteName: z.string().min(1).max(100).optional(),
      siteDescription: z.string().max(500).optional(),
      allowRegistration: z.boolean().optional(),
    })
    .optional(),
})

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

export const pagination = {
  query: z.object({
    page: z
      .string()
      .transform((val) => parseInt(val) || 1)
      .optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val) || 24)
      .optional(),
  }),
}

// ============================================================================
// NEXIUM SCHEMAS
// ============================================================================

export const nexium = {
  profileCreate: z.object({
    title: z.string().min(1, 'Title required').max(100),
    bio: z.string().max(500).optional(),
    availability: z.enum(['AVAILABLE', 'UNAVAILABLE', 'PASSIVE']).optional(),
    hourlyRate: z.number().min(0).optional(),
  }),

  profileUpdate: z.object({
    title: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional(),
    availability: z.enum(['AVAILABLE', 'UNAVAILABLE', 'PASSIVE']).optional(),
    hourlyRate: z.number().min(0).optional(),
  }),

  skillAdd: z.object({
    name: z.string().min(1, 'Skill name required').max(100),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
    yearsOfExperience: z.number().min(0).optional(),
  }),

  signalAdd: z.object({
    title: z.string().min(1, 'Title required').max(200),
    description: z.string().max(1000).optional(),
    link: z.string().url('Invalid URL').optional(),
    category: z
      .enum(['PORTFOLIO', 'GITHUB', 'DEPLOYMENT', 'CERTIFICATION', 'OTHER'])
      .optional(),
  }),

  opportunityCreate: z.object({
    title: z.string().min(1, 'Title required').max(200),
    description: z.string().min(1, 'Description required').max(2000),
    detailsUrl: z.string().url('Invalid URL').optional(),
    budget: z.number().min(0).optional(),
  }),

  applicationCreate: z.object({
    opportunityId: z.string().min(1, 'Opportunity ID required'),
    message: z.string().min(1, 'Message required').max(1000),
  }),
}
