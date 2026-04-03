import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/packages/lib/database/prisma'
import { sendTemplateEmail, MagicLinkEmail } from '@/packages/lib/emails'
import { getBaseUrl, generateSecureToken } from '@/packages/lib/auth/service'

const schema = z.object({
    email: z.string().email('Invalid email address'),
})

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
        const { token, hashedToken, expiresAt } = generateSecureToken(15 * 60 * 1000)

        // Store hashed token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                magicLinkToken: hashedToken,
                magicLinkExpires: expiresAt,
            },
        })

        const baseUrl = getBaseUrl()
        const magicUrl = `${baseUrl}/auth/magic?token=${token}&email=${encodeURIComponent(email)}`

        try {
            await sendTemplateEmail({
                to: user.email,
                subject: 'Your Emberly sign-in link',
                template: MagicLinkEmail,
                props: {
                    magicLink: magicUrl,
                    email,
                    expiresInMinutes: 15,
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
