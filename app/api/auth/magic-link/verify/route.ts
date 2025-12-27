import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { z } from 'zod'
import { signIn } from 'next-auth/react'

import { prisma } from '@/packages/lib/database/prisma'

const schema = z.object({
    token: z.string().min(10),
    email: z.string().email(),
})

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null)
        const parsed = schema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        const { token, email } = parsed.data
        const hashedToken = createHash('sha256').update(token).digest('hex')

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                magicLinkToken: true,
                magicLinkExpires: true,
            },
        })

        if (
            !user ||
            !user.magicLinkToken ||
            !user.magicLinkExpires ||
            user.magicLinkToken !== hashedToken ||
            user.magicLinkExpires.getTime() < Date.now()
        ) {
            return NextResponse.json({ error: 'Invalid or expired magic link' }, { status: 401 })
        }

        // Clear the magic link token after successful use
        await prisma.user.update({
            where: { id: user.id },
            data: {
                magicLinkToken: null,
                magicLinkExpires: null,
                sessionVersion: (user.id ? 1 : 0) + 1, // Increment to invalidate old sessions
            },
        })

        return NextResponse.json({ ok: true, userId: user.id })
    } catch (error) {
        console.error('Magic link verification error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const token = searchParams.get('token')
        const email = searchParams.get('email')

        if (!token || !email) {
            return NextResponse.json({ valid: false }, { status: 400 })
        }

        const hashedToken = createHash('sha256').update(token).digest('hex')

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                magicLinkToken: true,
                magicLinkExpires: true,
            },
        })

        const isValid =
            user &&
            user.magicLinkToken &&
            user.magicLinkExpires &&
            user.magicLinkToken === hashedToken &&
            user.magicLinkExpires.getTime() > Date.now()

        return NextResponse.json({ valid: !!isValid })
    } catch (error) {
        console.error('Magic link validation error:', error)
        return NextResponse.json({ valid: false }, { status: 500 })
    }
}
