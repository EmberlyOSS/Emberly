import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.auth

// CORS headers for desktop app requests
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const schema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().optional(),
})

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

/**
 * Desktop App Authentication Endpoint
 * 
 * This endpoint allows the Emberly Desktop Uploader to authenticate users
 * and receive their upload token for API access.
 * 
 * POST /api/auth/desktop
 * Body: { emailOrUsername: string, password: string, twoFactorCode?: string }
 * 
 * Returns: { success: true, user: { id, name, email, uploadToken, image, urlId } }
 * Or: { success: false, error: string, requires2FA?: boolean }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid request' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const { emailOrUsername, password, twoFactorCode } = parsed.data

    // Find user by email or username (case insensitive)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: emailOrUsername, mode: 'insensitive' } },
          { name: { equals: emailOrUsername, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        image: true,
        urlId: true,
        uploadToken: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        emailVerified: true,
      },
    })

    if (!user) {
      logger.warn('Desktop login attempt for non-existent user', { emailOrUsername })
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401, headers: CORS_HEADERS }
      )
    }

    // Check if user has password set
    if (!user.password) {
      logger.warn('Desktop login attempt for user without password', { userId: user.id })
      return NextResponse.json(
        { success: false, error: 'Please set a password in your account settings first' },
        { status: 401, headers: CORS_HEADERS }
      )
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      logger.warn('Desktop login failed - invalid password', { userId: user.id })
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401, headers: CORS_HEADERS }
      )
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return NextResponse.json(
          { success: false, error: 'Two-factor authentication required', requires2FA: true },
          { status: 401, headers: CORS_HEADERS }
        )
      }

      if (!user.twoFactorSecret) {
        logger.error('2FA enabled but no secret found', { userId: user.id })
        return NextResponse.json(
          { success: false, error: 'Account configuration error. Please contact support.' },
          { status: 500, headers: CORS_HEADERS }
        )
      }

      const { authenticator } = await import('otplib')
      const isValidCode = authenticator.check(twoFactorCode, user.twoFactorSecret)
      
      if (!isValidCode) {
        logger.warn('Desktop login failed - invalid 2FA code', { userId: user.id })
        return NextResponse.json(
          { success: false, error: 'Invalid two-factor code' },
          { status: 401, headers: CORS_HEADERS }
        )
      }
    }

    // Check email verification
    // if (!user.emailVerified) {
    //   return NextResponse.json(
    //     { success: false, error: 'Please verify your email first' },
    //     { status: 401 }
    //   )
    // }

    // Generate upload token if user doesn't have one
    let uploadToken = user.uploadToken
    if (!uploadToken) {
      const { randomUUID } = await import('crypto')
      uploadToken = randomUUID()
      await prisma.user.update({
        where: { id: user.id },
        data: { uploadToken },
      })
    }

    logger.info('Desktop login successful', { userId: user.id })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        uploadToken,
        image: user.image,
        urlId: user.urlId,
      },
    }, { headers: CORS_HEADERS })
  } catch (error) {
    logger.error('Desktop auth error', error as Error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
