import { NextResponse } from 'next/server'

import { z } from 'zod'

import { rateLimiter } from '@/lib/cache/rate-limit'
import { prisma } from '@emberly/db'
import { PasswordResetEmail, sendTemplateEmail } from '@/lib/emails'
import { events } from '@/lib/events'
import { generateSecureToken } from '@/lib/auth/service'
import { appUrl } from '@/lib/config/env'

const requestSchema = z.object({
    email: z.string().email(),
})

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

    const { token, hashedToken, expiresAt: expires } = generateSecureToken(30 * 60 * 1000)

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordResetToken: hashedToken,
            passwordResetExpires: expires,
        },
    })

    const baseUrl = appUrl()
    const resetUrl = `${baseUrl}/auth/reset?token=${token}&email=${encodeURIComponent(email)}`

    try {
        await sendTemplateEmail({
            to: user.email,
            subject: 'Reset your Emberly password',
            template: PasswordResetEmail,
            props: {
                resetUrl,
                expiresInMinutes: 30,
            },
        })
    } catch (error) {
        console.error('Failed to send password reset email', error)
        return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
    }

    // Emit auditable event (fire-and-forget)
    void events.emit('auth.password-reset-requested', {
        userId: user.id,
        email: user.email,
        expiresAt: expires,
        context: { ip: req.headers.get('x-forwarded-for')?.split(',')[0] ?? undefined },
    }).catch((err) => console.error('[Events] Failed to emit auth.password-reset-requested', err))

    return NextResponse.json({ ok: true })
}

