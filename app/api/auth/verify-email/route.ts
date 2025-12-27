import { NextResponse } from 'next/server'

import { prisma } from '@/packages/lib/database/prisma'

interface VerificationCode {
    code: string
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

        // Find users with verification codes and check for matching token
        const users = await prisma.user.findMany({
            where: {
                emailVerified: null,
                verificationCodes: { isEmpty: false },
            },
            select: {
                id: true,
                verificationCodes: true,
            },
        })

        let matchedUser: { id: string; verificationCodes: string[] } | null = null

        for (const user of users) {
            const codes = parseVerificationCodes(user.verificationCodes)
            const validCode = codes.find(
                (c) =>
                    c.context === 'email-verification' &&
                    c.code === token &&
                    c.expiresAt > Date.now()
            )
            if (validCode) {
                matchedUser = user
                break
            }
        }

        if (!matchedUser) {
            return NextResponse.json(
                { error: 'Invalid or expired verification token' },
                { status: 400 }
            )
        }

        // Remove the used verification code and mark email as verified
        const remainingCodes = parseVerificationCodes(matchedUser.verificationCodes)
            .filter((c) => !(c.context === 'email-verification' && c.code === token))
            .map((c) => JSON.stringify(c))

        await prisma.user.update({
            where: { id: matchedUser.id },
            data: {
                emailVerified: new Date(),
                verificationCodes: remainingCodes,
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully! You can now sign in.',
        })
    } catch (error) {
        console.error('Email verification error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
