import { NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { z } from 'zod'

import { prisma } from '@/packages/lib/database/prisma'
import { sendTemplateEmail, MagicLinkEmail } from '@/packages/lib/emails'

const schema = z.object({
    email: z.string().email('Invalid email address'),
})

function getBaseUrl() {
    if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL
    if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return 'http://localhost:3000'
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null)
        const parsed = schema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
        }

        const { email } = parsed.data

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true },
        })

        if (!user?.email) {
            // Do not reveal whether user exists (security)
            return NextResponse.json({ ok: true })
        }

        // Generate secure token
        const token = randomBytes(32).toString('hex')
        const hashedToken = createHash('sha256').update(token).digest('hex')
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

        // Store hashed token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                magicLinkToken: hashedToken,
                magicLinkExpires: expiresAt,
            },
        })

        const baseUrl = getBaseUrl().replace(/\/$/, '')
        const magicUrl = `${baseUrl}/auth/magic?token=${token}&email=${encodeURIComponent(email)}`

        try {
            await sendTemplateEmail({
                to: user.email,
                subject: 'Your Emberly sign-in link',
                template: MagicLinkEmail,
                props: {
                    signInUrl: magicUrl,
                    expiresMinutes: 15,
                    userName: user.name || undefined,
                },
            })
        } catch (error) {
            console.error('Failed to send magic link email', error)
            return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 })
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Magic link send error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
