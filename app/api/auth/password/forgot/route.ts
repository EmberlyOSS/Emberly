import { NextResponse } from 'next/server'

import { randomBytes, createHash } from 'crypto'
import { z } from 'zod'

import { prisma } from '@/packages/lib/database/prisma'
import { PasswordResetEmail, sendTemplateEmail } from '@/packages/lib/emails'
import { rateLimiter } from '@/packages/lib/cache/rate-limit'

const requestSchema = z.object({
    email: z.string().email(),
})

function getBaseUrl() {
    if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL
    if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return 'http://localhost:3000'
}

export async function POST(req: Request) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
    
    // Rate limit: 1 request per 10 minutes per IP
    const { allowed } = await rateLimiter.check(`auth:password:forgot:${ip}`, 1, 600)
    if (!allowed) {
        return NextResponse.json({ error: 'Too many requests. Please try again in 10 minutes.' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { email } = parsed.data

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true },
    })

    if (!user?.email) {
        // Do not reveal whether user exists
        return NextResponse.json({ ok: true })
    }

    const token = randomBytes(32).toString('hex')
    const hashedToken = createHash('sha256').update(token).digest('hex')
    const expires = new Date(Date.now() + 30 * 60 * 1000)

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordResetToken: hashedToken,
            passwordResetExpires: expires,
        },
    })

    const baseUrl = getBaseUrl().replace(/\/$/, '')
    const resetUrl = `${baseUrl}/auth/reset?token=${token}&email=${encodeURIComponent(email)}`

    try {
        await sendTemplateEmail({
            to: user.email,
            subject: 'Reset your Emberly password',
            template: PasswordResetEmail,
            props: {
                resetUrl,
                expiresMinutes: 30,
                userName: user.name || undefined,
            },
        })
    } catch (error) {
        console.error('Failed to send password reset email', error)
        return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}
