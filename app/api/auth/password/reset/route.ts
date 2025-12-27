import { NextResponse } from 'next/server'

import { hash, compare } from 'bcryptjs'
import { createHash } from 'crypto'
import { z } from 'zod'

import { prisma } from '@/packages/lib/database/prisma'
import { AccountChangeEmail, sendTemplateEmail } from '@/packages/lib/emails'
import { rateLimiter } from '@/packages/lib/cache/rate-limit'

const requestSchema = z.object({
    email: z.string().email(),
    token: z.string().min(10),
    password: z.string().min(8),
})

function getBaseUrl() {
    if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL
    if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return 'http://localhost:3000'
}

export async function POST(req: Request) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'

    // Rate limit: 5 attempts per 10 minutes per IP
    const { allowed } = await rateLimiter.check(`auth:password:reset:${ip}`, 5, 600)
    if (!allowed) {
        return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { email, token, password } = parsed.data
    const hashedToken = createHash('sha256').update(token).digest('hex')

    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (
        !user ||
        !user.passwordResetToken ||
        !user.passwordResetExpires ||
        user.passwordResetToken !== hashedToken ||
        user.passwordResetExpires.getTime() < Date.now()
    ) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    // If password is unchanged, reject to avoid no-op resets
    if (user.password && (await compare(password, user.password))) {
        return NextResponse.json({ error: 'New password must be different' }, { status: 400 })
    }

    const newPassword = await hash(password, 10)

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: newPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
            sessionVersion: (user.sessionVersion || 1) + 1,
        },
    })

    const baseUrl = getBaseUrl().replace(/\/$/, '')
    const manageUrl = `${baseUrl}/dashboard/security`

    if (user.email) {
        void sendTemplateEmail({
            to: user.email,
            subject: 'Your password was changed',
            template: AccountChangeEmail,
            props: {
                userName: user.name || undefined,
                changes: ['Password updated'],
                manageUrl,
                supportUrl: `${baseUrl}/contact`,
            },
        }).catch((error) => console.error('Failed to send password change email', error))
    }

    return NextResponse.json({ ok: true })
}
