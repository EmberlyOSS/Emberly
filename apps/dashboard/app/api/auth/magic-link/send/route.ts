import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@emberly/db'
import { sendTemplateEmail, MagicLinkEmail } from '@/lib/emails'
import { generateSecureToken } from '@/lib/auth/service'
import { appUrl } from '@/lib/config/env'

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

        console.log('[Magic Link Send] Generated token:', {
          email: user.email,
          tokenLength: token.length,
          hashedTokenPrefix: hashedToken.substring(0, 10) + '...',
          expiresAt
        })

        // Store hashed token
        const updateResult = await prisma.user.update({
            where: { id: user.id },
            data: {
                magicLinkToken: hashedToken,
                magicLinkExpires: expiresAt,
            },
            select: {
              id: true,
              email: true,
              magicLinkToken: true,
              magicLinkExpires: true
            }
        })

        console.log('[Magic Link Send] Token stored in DB:', {
          email: updateResult.email,
          storedToken: updateResult.magicLinkToken ? updateResult.magicLinkToken.substring(0, 10) + '...' : 'null',
          storedExpires: updateResult.magicLinkExpires
        })

        const baseUrl = appUrl()
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

