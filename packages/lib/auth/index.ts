import { Prisma, UserRole } from '@/prisma/generated/prisma/client'
import { compare } from 'bcryptjs'
import { NextAuthOptions, Session } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'

import { prisma } from '@/packages/lib/database/prisma'
import { sendTemplateEmail, NewLoginEmail } from '@/packages/lib/emails'
import { detectNewLogin, recordLogin } from './login-detection'
import { RedisSessionAdapter } from './redis-session-adapter'

const userSelect = {
  id: true,
  email: true,
  emailVerified: true,
  createdAt: true,
  name: true,
  password: true,
  role: true,
  image: true,
  preferredUploadDomain: true,
  sessionVersion: true,
  alphaUser: true,
  twoFactorEnabled: true,
  twoFactorSecret: true,
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
  }
}

// Adapter for cross-domain session sharing via Redis
const sessionAdapter = RedisSessionAdapter()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        token: { label: 'Magic Link Token', type: 'text' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        // 1. Fetch user by email first
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: userSelect,
        })

        if (!user) {
          return null
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
             const isValidCode = authenticator.check(credentials.twoFactorCode, validUser.twoFactorSecret)
             if (!isValidCode) {
               return null
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
          return null
        }

        if (!user.password) {
          return null
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

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
          const isValidCode = authenticator.check(credentials.twoFactorCode, user.twoFactorSecret)
          if (!isValidCode) {
            return null
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
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Fire-and-forget new login email + last login metadata
      const email = user?.email
      if (email) {
        // Get context from middleware-stored headers
        const email_key = `login_context:${email}:${Date.now()}`
        const storedContext = globalThis.__nextAuthLoginContext?.[email_key] || {}
        
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
    async session({ session, user }): Promise<Session> {
      if (user) {
        session.user.id = user.id
        // Fetch fresh user data from database
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: userSelect,
          })

          if (freshUser) {
            session.user.id = freshUser.id
            session.user.role = freshUser.role
            session.user.image = freshUser.image || null
            session.user.name = freshUser.name || ''
            session.user.email = freshUser.email || ''
            session.user.alphaUser = freshUser.alphaUser
            session.user.twoFactorEnabled = freshUser.twoFactorEnabled
          }
        } catch (error) {
          // If DB is unavailable, continue with basic user info from session
          console.warn('[Session] Database unavailable, using session user data:', error instanceof Error ? error.message : error)
        }
      }
      return session
    },
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
  },
  adapter: sessionAdapter,
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60,
  },
}
