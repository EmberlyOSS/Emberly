import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { randomInt } from 'crypto'
import { z } from 'zod'

import { authOptions } from '@/packages/lib/auth'
import { rateLimiter } from '@/packages/lib/cache/rate-limit'
import { prisma } from '@/packages/lib/database/prisma'
import { sendTemplateEmail, VerifyEmailEmail } from '@/packages/lib/emails'

const migrationSchema = z.object({
    email: z.string().email(),
    action: z.enum(['send-verification', 'verify']),
    code: z.string().optional(),
})

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Rate limit: 5 attempts per 10 minutes per user
        const rateLimit = await rateLimiter.checkFixed(`alpha-migration:${session.user.id}`, 5, 600)
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
        const body = migrationSchema.parse(json)

        // Alpha users are those created before December 27, 2025
        const ALPHA_CUTOFF_DATE = new Date('2025-12-27T00:00:00.000Z')

        // Verify the user needs alpha migration
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                createdAt: true,
                verificationCodes: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Check if user was created before the cutoff (is an alpha user)
        if (user.createdAt >= ALPHA_CUTOFF_DATE) {
            return NextResponse.json(
                { error: 'This migration is only for alpha users' },
                { status: 403 }
            )
        }

        // Already verified
        if (user.emailVerified) {
            return NextResponse.json(
                { error: 'Email is already verified' },
                { status: 400 }
            )
        }

        if (body.action === 'send-verification') {
            // Check if email is already in use by another user
            if (body.email !== user.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: body.email },
                    select: { id: true },
                })

                if (existingUser) {
                    return NextResponse.json(
                        { error: 'This email is already in use by another account' },
                        { status: 400 }
                    )
                }
            }

            // Generate 6-digit verification code
            const verificationCode = randomInt(100000, 999999).toString()
            const verificationExpires = Date.now() + 60 * 60 * 1000 // 1 hour

            // Create verification code data
            const verificationCodeData = JSON.stringify({
                code: verificationCode,
                context: 'alpha-migration',
                email: body.email, // Store which email this code is for
                expiresAt: verificationExpires,
            })

            // Filter out old alpha-migration codes, keep others
            const existingCodes = (user.verificationCodes || [])
                .map((c) => {
                    try {
                        return JSON.parse(c)
                    } catch {
                        return null
                    }
                })
                .filter((c) => c && c.context !== 'alpha-migration')
                .map((c) => JSON.stringify(c))

            // Update user with new code (and potentially new email)
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    email: body.email,
                    verificationCodes: [...existingCodes, verificationCodeData],
                },
            })

            const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

            try {
                await sendTemplateEmail({
                    to: body.email,
                    subject: 'Verify your Emberly email address',
                    template: VerifyEmailEmail,
                    props: {
                        verifyUrl: `${baseUrl}/auth/alpha-migration`,
                        verificationCode,
                        expiresMinutes: 60,
                        userName: user.name || undefined,
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
                message: 'Verification code sent to your email.',
            })
        }

        if (body.action === 'verify') {
            if (!body.code) {
                return NextResponse.json(
                    { error: 'Verification code is required' },
                    { status: 400 }
                )
            }

            // Find the alpha-migration verification code
            let validCode = null
            const remainingCodes: string[] = []

            for (const codeStr of user.verificationCodes || []) {
                try {
                    const parsed = JSON.parse(codeStr)

                    if (parsed.context === 'alpha-migration') {
                        // Check if code matches and not expired
                        if (parsed.code === body.code && parsed.expiresAt > Date.now()) {
                            validCode = parsed
                        } else if (parsed.code !== body.code) {
                            // Keep non-matching codes (might be for different purposes)
                            remainingCodes.push(codeStr)
                        }
                        // Don't keep expired or used codes
                    } else {
                        // Keep other types of codes
                        remainingCodes.push(codeStr)
                    }
                } catch {
                    // Skip invalid JSON
                }
            }

            if (!validCode) {
                return NextResponse.json(
                    { error: 'Invalid or expired verification code' },
                    { status: 400 }
                )
            }

            // Mark email as verified, set alphaUser flag (OG supporter badge!), and update email if changed
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    email: validCode.email || body.email,
                    emailVerified: new Date(),
                    verificationCodes: remainingCodes,
                    alphaUser: true, // Mark as OG alpha supporter!
                },
            })

            // Grant alpha supporter bonus: +1 custom domain slot
            // Check if they already received this bonus (prevent duplicate grants)
            const existingAlphaGrant = await prisma.oneOffPurchase.findFirst({
                where: {
                    userId: user.id,
                    type: 'custom_domain',
                    metadata: {
                        path: ['alphaSupporter'],
                        equals: true,
                    },
                },
            })

            if (!existingAlphaGrant) {
                await prisma.oneOffPurchase.create({
                    data: {
                        userId: user.id,
                        type: 'custom_domain',
                        quantity: 1,
                        amountCents: 0,
                        metadata: {
                            alphaSupporter: true,
                            grantedAt: new Date().toISOString(),
                            reason: 'Alpha user migration bonus',
                        },
                    },
                })
            }

            return NextResponse.json({
                success: true,
                message: 'Email verified successfully!',
                bonusGranted: !existingAlphaGrant,
            })
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        )
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0].message },
                { status: 400 }
            )
        }

        console.error('Alpha migration error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
