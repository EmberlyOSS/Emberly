import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { z } from 'zod'
import { signIn } from 'next-auth/react'

import { prisma } from '@/packages/lib/database/prisma'

const schema = z.object({
    token: z.string().min(10),
    email: z.string().email(),
})

export async function POST() {
    return NextResponse.json({ error: 'Endpoint deprecated. Verification happens during sign-in.' }, { status: 410 })
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
