import { Prisma, UserRole } from '@/prisma/generated/prisma/client'
import { compare } from 'bcryptjs'
import { NextAuthOptions, Session } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'

import { prisma } from '@/packages/lib/database/prisma'
import { sendTemplateEmail, NewLoginEmail } from '@/packages/lib/emails'
import { detectNewLogin, recordLogin } from './login-detection'
import { validateAndConsumeRecoveryCode } from './recovery-codes'
import { ensurePasswordInHistory } from '@/packages/lib/security/password-reuse-checker'
import { checkPasswordBreach } from '@/packages/lib/security/password-breach-checker'

const userSelect = {
  id: true,
  email: true,
  name: true,
  emailVerified: true,
  createdAt: true,
  password: true,
  role: true,
  image: true,
  preferredUploadDomain: true,
  sessionVersion: true,
  alphaUser: true,
  twoFactorEnabled: true,
  twoFactorSecret: true,
  passwordBreachDetectedAt: true,
} as const

// Optional: allow configuring a shared cookie domain for NextAuth via
// the environment. This is only safe when your custom upload domains are
// subdomains of a single registrable domain (for example, *.example.com).
// Do NOT set this to a different registrable domain.
const NEXTAUTH_COOKIE_DOMAIN = process.env.NEXTAUTH_COOKIE_DOMAIN || undefined

// Parse trusted origins for multi-domain support
// Format: comma-separated list of origins (e.g. "https://emberly.site,https://embrly.ca")
const NEXTAUTH_TRUSTED_ORIGINS = (process.env.NEXTAUTH_TRUSTED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0)

type UserWithSession = Prisma.UserGetPayload<{ select: typeof userSelect }>

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image: string | null
      role: UserRole
      alphaUser?: boolean
      twoFactorEnabled?: boolean
      emailVerified?: boolean
      passwordBreachDetectedAt?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    sessionVersion: number
    name?: string | null
    email?: string | null
    image?: string | null
    alphaUser?: boolean
    createdAt?: string
    emailVerified?: boolean
    twoFactorEnabled?: boolean
    passwordBreachDetectedAt?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        emailOrUsername: { label: 'Email or Username', type: 'text' },
        email: { label: 'Email', type: 'email' }, // For backward compatibility with magic links
        password: { label: 'Password', type: 'password' },
        token: { label: 'Magic Link Token', type: 'text' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        // Support both emailOrUsername (password auth) and email (magic link auth)
        const identifier = credentials?.emailOrUsername || credentials?.email
        if (!identifier) {
          return null
        }

        // 1. Fetch user by email or username (name field)
        // Try direct email match first, then case-insensitive username match
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: identifier, mode: 'insensitive' } },
              { name: { equals: identifier, mode: 'insensitive' } },
            ]
          },
          select: userSelect,
        })

        if (!user) {
          console.log(`[Auth] User not found for identifier: ${identifier}`)
          return null
        }

        // Safety check: warn if username looks like an email
        if (user.name && user.name.includes('@')) {
          console.warn(`[Auth] WARNING: User ${user.id} has email-like username: "${user.name}". This should not happen in production.`)
        }

        // Magic link auth: requires valid token
        if (credentials.token) {
           const hashedToken = (await import('crypto')).createHash('sha256').update(credentials.token).digest('hex')

           // Verify token and expiry, and ensure it matches the user
           const validUser = await prisma.user.findFirst({
             where: {
               id: user.id,
               magicLinkToken: hashedToken,
               magicLinkExpires: { gt: new Date() }
             },
             select: userSelect
           })
           
           if (!validUser) {
             return null
           }

           // Check if user has 2FA enabled and code not provided
           if (validUser.twoFactorEnabled && !credentials.twoFactorCode) {
             // Throw error to fail auth and prompt for 2FA
             const error = new Error('TwoFactorRequired')
             error.name = 'TwoFactorRequired'
             throw error
           }

           // Verify 2FA code if provided
           if (validUser.twoFactorEnabled && credentials.twoFactorCode) {
             if (!validUser.twoFactorSecret) {
               return null
             }
             const { authenticator } = await import('otplib')
             
             // Try TOTP code first
             const isValidCode = authenticator.check(credentials.twoFactorCode, validUser.twoFactorSecret)
             if (!isValidCode) {
               // Try recovery code
               const isValidRecoveryCode = await validateAndConsumeRecoveryCode(
                 validUser.id,
                 credentials.twoFactorCode
               )
               if (!isValidRecoveryCode) {
                 return null
               }
             }
           }

           // Consume the token atomically and get the updated user with new sessionVersion
           const updatedUser = await prisma.user.update({
             where: { id: user.id },
             data: {
               magicLinkToken: null,
               magicLinkExpires: null,
               sessionVersion: { increment: 1 } // Invalidate old sessions
             },
             select: userSelect
           })

           // Return user session data with the NEW sessionVersion
           return {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            image: updatedUser.image,
            sessionVersion: updatedUser.sessionVersion, // Use updated version from DB
            alphaUser: updatedUser.alphaUser,
            twoFactorEnabled: updatedUser.twoFactorEnabled,
          }
        }

        // Password auth: validate password
        if (!credentials?.password) {
          console.log(`[Auth] No password provided for user: ${user.email}`)
          return null
        }

        if (!user.password) {
          console.log(`[Auth] User ${user.email} has no password set`)
          return null
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          console.log(`[Auth] Invalid password for user: ${user.email}`)
          return null
        }

        // Check for password breach in background (non-blocking)
        void (async () => {
          try {
            const breachResult = await checkPasswordBreach(credentials.password)
            if (breachResult.isCompromised) {
              // Mark user as having detected breach
              await prisma.user.update({
                where: { id: user.id },
                data: { passwordBreachDetectedAt: new Date() },
              })
              console.log(`[Auth] Password breach detected for user ${user.email}`)
            }
          } catch (err) {
            console.error('Failed to check password breach', err)
          }
        })()

        // Check if user has 2FA enabled and code not provided
        if (user.twoFactorEnabled && !credentials.twoFactorCode) {
          // Throw error to fail auth and prompt for 2FA
          const error = new Error('TwoFactorRequired')
          error.name = 'TwoFactorRequired'
          throw error
        }

        // Verify 2FA code if provided
        if (user.twoFactorEnabled && credentials.twoFactorCode) {
          if (!user.twoFactorSecret) {
            return null
          }
          const { authenticator } = await import('otplib')
          
          // Try TOTP code first
          const isValidCode = authenticator.check(credentials.twoFactorCode, user.twoFactorSecret)
          if (!isValidCode) {
            // Try recovery code
            const isValidRecoveryCode = await validateAndConsumeRecoveryCode(
              user.id,
              credentials.twoFactorCode
            )
            if (!isValidRecoveryCode) {
              return null
            }
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          sessionVersion: user.sessionVersion,
          alphaUser: user.alphaUser,
          twoFactorEnabled: user.twoFactorEnabled,
          passwordBreachDetectedAt: user.passwordBreachDetectedAt?.toISOString() || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Populate JWT with user data on sign in
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.sessionVersion = (user as any).sessionVersion
        token.alphaUser = (user as any).alphaUser
        token.twoFactorEnabled = (user as any).twoFactorEnabled
        token.emailVerified = (user as any).emailVerified // Pass DateTime (or null) directly
        token.name = user.name
        token.email = user.email
        token.image = user.image
        token.passwordBreachDetectedAt = (user as any).passwordBreachDetectedAt
        console.log(`[JWT] User signed in: ${token.email}, emailVerified: ${token.emailVerified}`)
      }
      
      // On subsequent requests, if emailVerified isn't set, fetch from database
      // This ensures verified users don't get redirected on token refresh
      if (token.id && !('emailVerified' in token)) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: { emailVerified: true },
          })
          if (dbUser) {
            token.emailVerified = dbUser.emailVerified
            console.log(`[JWT] Refreshed emailVerified from DB for ${token.email}: ${token.emailVerified}`)
          }
        } catch (error) {
          console.warn('[JWT] Failed to fetch emailVerified from DB:', error instanceof Error ? error.message : error)
        }
      }
      
      return token
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Support both social and credentials-based signins
      // Fire-and-forget new login email + last login metadata
      const userEmail = user?.email
      if (userEmail) {
        // Get context from middleware-stored headers
        const storedContext = globalThis.__nextAuthLoginContext || {}
        
        const ip = storedContext.ip
        const userAgent = storedContext.userAgent
        const country = storedContext.geo?.country
        const city = storedContext.geo?.city

        const time = new Date().toISOString()
        const manageUrl = `${process.env.APP_BASE_URL ||
          process.env.NEXTAUTH_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
          }/profile?tab=security`

        const loginContext = {
          ip,
          userAgent,
          geo: (country || city) ? { country, city } : null
        }

        void prisma.user
          .update({
            where: { id: user.id as string },
            data: {
              lastLoginAt: new Date(time),
              lastLoginIp: ip || null,
              lastLoginUserAgent: userAgent || null,
            },
          })
          .catch((err) => console.error('Failed to update last login metadata', err))

        // For password auth, ensure current password is in history (backward compatibility)
        if (credentials?.password) {
          void (async () => {
            try {
              const dbUser = await prisma.user.findUnique({
                where: { id: user.id as string },
                select: { password: true },
              })
              if (dbUser?.password) {
                const wasAdded = await ensurePasswordInHistory(
                  user.id as string,
                  dbUser.password
                )
                if (wasAdded) {
                  console.log(`[Auth] Password history initialized for user ${user.id} on login`)
                }
              }
            } catch (err) {
              console.error('Failed to ensure password in history', err)
            }
          })()
        }

        // Record login and check if this is a new device/suspicious login
        void (async () => {
          try {
            const detection = await detectNewLogin(user.id as string, loginContext)

            // Record this login in history
            await recordLogin(user.id as string, loginContext, true)

            // Only send alert if detection says we should
            if (detection.shouldAlert) {
              await sendTemplateEmail({
                to: email,
                subject: '⚠️ New device sign-in to your Emberly account',
                template: NewLoginEmail,
                props: {
                  userName: user.name || undefined,
                  time,
                  location: detection.reason,
                  ipAddress: ip,
                  device: userAgent,
                  manageUrl,
                },
              })
            }
          } catch (err) {
            console.error('Failed to process login detection', err)
          }
        })()
      }
      return true
    },
    async session({ session, token }): Promise<Session> {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.image = token.image || null
        session.user.name = token.name || ''
        session.user.email = token.email || ''
        session.user.alphaUser = token.alphaUser
        session.user.twoFactorEnabled = token.twoFactorEnabled
        session.user.emailVerified = token.emailVerified ? true : false // Convert DateTime/null to boolean for session
        session.user.passwordBreachDetectedAt = token.passwordBreachDetectedAt as string | null | undefined
        
        // Periodically refresh user data from database (on each request for now)
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: userSelect,
          })

          if (freshUser) {
            // Update session with fresh data
            session.user.role = freshUser.role
            session.user.image = freshUser.image || null
            session.user.name = freshUser.name || ''
            session.user.email = freshUser.email || ''
            session.user.alphaUser = freshUser.alphaUser
            session.user.twoFactorEnabled = freshUser.twoFactorEnabled
            session.user.emailVerified = freshUser.emailVerified ? true : false // Convert DateTime/null to boolean
            session.user.passwordBreachDetectedAt = freshUser.passwordBreachDetectedAt?.toISOString() || null
            
            // Update token for next request if sessionVersion changed
            if (freshUser.sessionVersion !== token.sessionVersion) {
              token.sessionVersion = freshUser.sessionVersion
            }
          }
        } catch (error) {
          // If DB is unavailable, continue with JWT data
          console.warn('[Session] Database unavailable, using JWT data:', error instanceof Error ? error.message : error)
        }
      }
      return session
    },
  },
  // JWT session strategy (required for CredentialsProvider)
  // Session callback fetches fresh user data from database on each request
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update JWT every 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Trust multiple origins for cross-domain auth
  // Use NEXTAUTH_TRUSTED_ORIGINS env var to specify allowed origins
  // Format: "https://emberly.site,https://embrly.ca"
  trustHost: NEXTAUTH_TRUSTED_ORIGINS.length > 0 || process.env.NEXTAUTH_URL?.includes('localhost'),
  // Configure cookie domain only when NEXTAUTH_COOKIE_DOMAIN is provided.
  // This makes the session cookie valid across subdomains (e.g. uploads.example.com)
  // but cannot be used to share cookies across unrelated registrable domains.
  ...(NEXTAUTH_COOKIE_DOMAIN
    ? {
      cookies: {
        sessionToken: {
          name: process.env.NEXTAUTH_COOKIE_NAME || 'next-auth.session-token',
          options: {
            domain: NEXTAUTH_COOKIE_DOMAIN,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          },
        },
      },
    }
    : {}),
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/register',
    error: '/auth/error',
  },
}
