import { NextResponse } from 'next/server'

import { randomBytes } from 'crypto'
import { z } from 'zod'

import { rateLimiter } from '@/packages/lib/cache/rate-limit'
import { prisma } from '@/packages/lib/database/prisma'
import { sendTemplateEmail, VerificationCodeEmail } from '@/packages/lib/emails'

const resendSchema = z.object({
    email: z.string().email(),
})

export async function POST(req: Request) {
    try {
        // Rate limit: 3 resend attempts per 10 minutes per IP
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
        const rateLimit = await rateLimiter.checkFixed(`resend-verify:${ip}`, 3, 600)
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
                    },
                }
            )
        }

        const json = await req.json()
        const body = resendSchema.parse(json)

        const user = await prisma.user.findUnique({
            where: { email: body.email },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
            },
        })

        // Always return success to prevent email enumeration
        if (!user || user.emailVerified) {
            return NextResponse.json({
                success: true,
                message: 'If an unverified account exists with this email, a verification link has been sent.',
            })
        }

        // Generate new verification token and short code
        const verificationToken = randomBytes(32).toString('hex')
        const shortCode = Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code
        const verificationExpires = Date.now() + 60 * 60 * 1000 // 1 hour

        // Create verification code data
        const verificationCodeData = JSON.stringify({
            code: verificationToken,
            shortCode: shortCode,
            context: 'email-verification',
            expiresAt: verificationExpires,
        })

        // Get existing codes, filter out old email-verification ones, add new
        const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { verificationCodes: true },
        })

        const existingCodes = (existingUser?.verificationCodes || [])
            .map((c) => {
                try {
                    return JSON.parse(c)
                } catch {
                    return null
                }
            })
            .filter((c) => c && c.context !== 'email-verification')
            .map((c) => JSON.stringify(c))

        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationCodes: [...existingCodes, verificationCodeData],
            },
        })

        const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const verifyUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`

        try {
            await sendTemplateEmail({
                to: user.email!,
                subject: 'Verify your Emberly email address',
                template: VerificationCodeEmail,
                props: {
                    code: shortCode,
                    verificationUrl: verifyUrl,
                    expiresInMinutes: 60,
                },
            })
        } catch (err) {
            console.error('Failed to send verification email', err)
            return NextResponse.json(
                { error: 'Failed to send verification email. Please try again.' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'If an unverified account exists with this email, a verification link has been sent.',
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0].message },
                { status: 400 }
            )
        }

        console.error('Resend verification error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
