import { NextResponse } from 'next/server'

import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { nanoid } from 'nanoid'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { rateLimiter } from '@/packages/lib/cache/rate-limit'
import { getConfig } from '@/packages/lib/config'
import { prisma } from '@/packages/lib/database/prisma'
import { sendTemplateEmail, VerifyEmailEmail } from '@/packages/lib/emails'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

function generateUrlId() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  return nanoid(5)
    .split('')
    .map((char) => {
      const index = Math.floor((alphabet.length * char.charCodeAt(0)) / 256)
      return alphabet[index]
    })
    .join('')
}

export async function POST(req: Request) {
  try {
    // Rate limit: 5 registration attempts per minute per IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimit = await rateLimiter.checkFixed(`register:${ip}`, 5, 60)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      )
    }

    const config = await getConfig()
    if (!config.settings.general.registrations.enabled) {
      return new NextResponse(null, { status: 404 })
    }

    const json = await req.json()
    const body = registerSchema.parse(json)

    const exists = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    })

    if (exists) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    let urlId = generateUrlId()
    let isUnique = false
    while (!isUnique) {
      const existing = await prisma.user.findUnique({
        where: { urlId },
      })
      if (!existing) {
        isUnique = true
      } else {
        urlId = generateUrlId()
      }
    }

    const userCount = await prisma.user.count()
    const isFirstUser = userCount === 0

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpires = Date.now() + 60 * 60 * 1000 // 1 hour

    // Create verification code data
    const verificationCodeData = JSON.stringify({
      code: verificationToken,
      context: 'email-verification',
      expiresAt: verificationExpires,
    })

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: await hash(body.password, 10),
        urlId,
        role: isFirstUser ? 'ADMIN' : 'USER',
        uploadToken: uuidv4(),
        // First user (admin) is auto-verified, others need to verify
        emailVerified: isFirstUser ? new Date() : null,
        // Store verification token in verificationCodes array
        verificationCodes: isFirstUser ? [] : [verificationCodeData],
      },
    })

    // Assign default Spark plan if it exists
    try {
      const spark = await prisma.product.findFirst({ where: { slug: 'spark', active: true } })
      if (spark) {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            productId: spark.id,
            status: 'active',
          },
        })
      }
    } catch (err) {
      console.error('Failed to assign spark plan on signup', err)
    }

    // Send verification email (skip for first user/admin)
    if (!isFirstUser) {
      const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const verifyUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`

      try {
        await sendTemplateEmail({
          to: body.email,
          subject: 'Verify your Emberly email address',
          template: VerifyEmailEmail,
          props: {
            verifyUrl,
            expiresMinutes: 60,
            userName: body.name,
          },
        })
      } catch (err) {
        console.error('Failed to send verification email', err)
        // Don't fail registration if email fails - user can request resend
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      message: isFirstUser
        ? 'Account created successfully. You can now sign in.'
        : 'Account created! Please check your email to verify your address before signing in.',
      requiresVerification: !isFirstUser,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
