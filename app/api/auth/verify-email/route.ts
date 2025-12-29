import { NextResponse } from 'next/server'

import { prisma } from '@/packages/lib/database/prisma'
import { sendTemplateEmail, WelcomeEmail } from '@/packages/lib/emails'

interface VerificationCode {
    code: string
    shortCode?: string
    context: string
    expiresAt: number
}

function parseVerificationCodes(codes: string[]): VerificationCode[] {
    return codes
        .map((c) => {
            try {
                return JSON.parse(c) as VerificationCode
            } catch {
                return null
            }
        })
        .filter((c): c is VerificationCode => c !== null)
}

async function verifyToken(token: string) {
    // Find users with verification codes and check for matching token or short code
    const users = await prisma.user.findMany({
        where: {
            emailVerified: null,
            verificationCodes: { isEmpty: false },
        },
        select: {
            id: true,
            email: true,
            name: true,
            verificationCodes: true,
        },
    })

    let matchedUser: { id: string; email: string; name: string | null; verificationCodes: string[] } | null = null
    let matchedCode: VerificationCode | null = null

    for (const user of users) {
        const codes = parseVerificationCodes(user.verificationCodes)
        // Check both the full token (for URL clicks) and short code (for manual entry)
        const validCode = codes.find(
            (c) =>
                c.context === 'email-verification' &&
                (c.code === token || c.shortCode === token) &&
                c.expiresAt > Date.now()
        )
        if (validCode) {
            matchedUser = user
            matchedCode = validCode
            break
        }
    }

    if (!matchedUser || !matchedCode) {
        return null
    }

    // Remove the used verification code and mark email as verified
    const remainingCodes = parseVerificationCodes(matchedUser.verificationCodes)
        .filter((c) => !(c.context === 'email-verification' && c.code === matchedCode!.code))
        .map((c) => JSON.stringify(c))

    const verifiedUser = await prisma.user.update({
        where: { id: matchedUser.id },
        data: {
            emailVerified: new Date(),
            verificationCodes: remainingCodes,
        },
        select: {
            id: true,
            email: true,
            name: true,
        },
    })

    // Send welcome email after successful verification
    void (async () => {
        try {
            const dashboardUrl = `${process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
            
            await sendTemplateEmail({
                to: verifiedUser.email,
                subject: 'Welcome to Emberly!',
                template: WelcomeEmail,
                props: {
                    userName: verifiedUser.name || undefined,
                    dashboardUrl,
                },
            })
            
            console.log(`[Auth] Welcome email sent to ${verifiedUser.email} after email verification`)
        } catch (err) {
            console.error('Failed to send welcome email after verification', err)
        }
    })()

    return matchedUser
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json(
                { error: 'Missing verification token' },
                { status: 400 }
            )
        }

        const result = await verifyToken(token)

        if (!result) {
            return NextResponse.json(
                { error: 'Invalid or expired verification token' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully! You can now access your account.',
        })
    } catch (error) {
        console.error('Email verification error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json()
        const token = json.token || json.code

        if (!token) {
            return NextResponse.json(
                { error: 'Missing verification token' },
                { status: 400 }
            )
        }

        const result = await verifyToken(token)

        if (!result) {
            return NextResponse.json(
                { error: 'Invalid or expired verification token' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully! You can now access your account.',
        })
    } catch (error) {
        console.error('Email verification error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
