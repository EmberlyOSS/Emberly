import { Prisma, UserRole } from '@/prisma/generated/prisma/client'
import { compare } from 'bcryptjs'
import { NextAuthOptions, Session } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'

import { prisma } from '@/packages/lib/database/prisma'
import { sendTemplateEmail, NewLoginEmail } from '@/packages/lib/emails'
import { detectNewLogin, recordLogin } from './login-detection'

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
} as const

// Optional: allow configuring a shared cookie domain for NextAuth via
// the environment. This is only safe when your custom upload domains are
// subdomains of a single registrable domain (for example, *.example.com).
// Do NOT set this to a different registrable domain.
const NEXTAUTH_COOKIE_DOMAIN = process.env.NEXTAUTH_COOKIE_DOMAIN || undefined

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
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        token: { label: 'Magic Link Token', type: 'text' },
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

           // Consume the token atomically
           await prisma.user.update({
             where: { id: user.id },
             data: {
               magicLinkToken: null,
               magicLinkExpires: null,
               sessionVersion: { increment: 1 } // Invalidate old sessions
             }
           })

           // Return user session data
           return {
            id: validUser.id,
            email: validUser.email,
            name: validUser.name,
            role: validUser.role,
            image: validUser.image,
            sessionVersion: validUser.sessionVersion, // Updated version
            alphaUser: validUser.alphaUser,
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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          sessionVersion: user.sessionVersion,
          alphaUser: user.alphaUser,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Fire-and-forget new login email + last login metadata
      const email = user?.email
      if (email) {
        // Note: req is not available in signIn callback in this version.
        // We'll skip IP logging for now or implement via middleware context later.
        const ip = undefined 
        const userAgent = undefined
        // const forwarded = req?.headers?.get('x-forwarded-for') || ''
        // const ip = forwarded.split(',')[0]?.trim() || req?.headers?.get('x-real-ip') || undefined
        // const userAgent = req?.headers?.get('user-agent') || undefined
        const time = new Date().toISOString()
        const manageUrl = `${process.env.APP_BASE_URL ||
          process.env.NEXTAUTH_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
          }/dashboard/security`

        // Extract geo info from various CDN headers (Vercel, Cloudflare, etc.)
        const country = null
        // const country = req?.headers?.get('x-vercel-ip-country') ||
        //   req?.headers?.get('cf-ipcountry') ||
        //   null
        const city = null
        // const city = req?.headers?.get('x-vercel-ip-city') ||
        //   req?.headers?.get('cf-ipcity') ||
        //   null

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
              lastLoginIp: ip,
              lastLoginUserAgent: userAgent,
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
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        const sessionUser = user as UserWithSession & { alphaUser?: boolean }
        token.id = sessionUser.id
        token.role = sessionUser.role
        token.image = sessionUser.image
        token.sessionVersion = sessionUser.sessionVersion
        token.name = sessionUser.name
        token.email = sessionUser.email
        token.alphaUser = sessionUser.alphaUser
        token.createdAt = sessionUser.createdAt?.toISOString()
        token.emailVerified = !!sessionUser.emailVerified
      }

      // Try to refresh user data from database, but don't fail the session if DB is temporarily unavailable
      try {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: userSelect,
        })

        if (!freshUser) {
          // User was deleted - invalidate session by returning empty token
          // This will cause the session to be cleared on next request
          console.warn('[JWT] User not found, invalidating session for token:', token.id)
          return {} as JWT
        }

        if (
          token.sessionVersion &&
          token.sessionVersion !== freshUser.sessionVersion
        ) {
          console.warn('[JWT] Session version mismatch, invalidating session for user:', token.id)
          return {} as JWT
        }

        token.role = freshUser.role
        token.image = freshUser.image
        token.name = freshUser.name
        token.email = freshUser.email
        token.sessionVersion = freshUser.sessionVersion
        token.alphaUser = freshUser.alphaUser
        token.createdAt = freshUser.createdAt.toISOString()
        token.emailVerified = !!freshUser.emailVerified
      } catch (error) {
        // For database connection errors, log and continue with cached token data
        console.warn('[JWT] Database unavailable, using cached token data:', error instanceof Error ? error.message : error)
      }

      return token
    },
    async session({ session, token }): Promise<Session> {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.image = token.image || null
        session.user.name = token.name || ''
        session.user.email = token.email || ''
        session.user.alphaUser = token.alphaUser
      }
      return session
    },
  },
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
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
}
