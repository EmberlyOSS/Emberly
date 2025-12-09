import { Prisma, UserRole } from '@prisma/client'
import { compare } from 'bcryptjs'
import { NextAuthOptions, Session } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'

import { prisma } from '@/lib/database/prisma'

const userSelect = {
  id: true,
  email: true,
  name: true,
  password: true,
  role: true,
  image: true,
  preferredUploadDomain: true,
  sessionVersion: true,
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
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: userSelect,
        })

        if (!user || !user.password) {
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
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        const sessionUser = user as UserWithSession
        token.id = sessionUser.id
        token.role = sessionUser.role
        token.image = sessionUser.image
        token.sessionVersion = sessionUser.sessionVersion
        token.name = sessionUser.name
        token.email = sessionUser.email
      }

      const freshUser = await prisma.user.findUnique({
        where: { id: token.id },
        select: userSelect,
      })

      if (!freshUser) {
        throw new Error('Session invalidated: User not found')
      }

      if (
        token.sessionVersion &&
        token.sessionVersion !== freshUser.sessionVersion
      ) {
        throw new Error('Session invalidated: Version mismatch')
      }

      token.role = freshUser.role
      token.image = freshUser.image
      token.name = freshUser.name
      token.email = freshUser.email
      token.sessionVersion = freshUser.sessionVersion

      return token
    },
    async session({ session, token }): Promise<Session> {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.image = token.image || null
        session.user.name = token.name || ''
        session.user.email = token.email || ''
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
