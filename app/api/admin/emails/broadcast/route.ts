import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { apiError, apiResponse } from '@/packages/lib/api/response'
import { sendTemplateEmail, AdminBroadcastEmail } from '@/packages/lib/emails'

const broadcastSchema = z.object({
    subject: z.string().min(1).max(200),
    body: z.string().min(1).max(5000),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    ctaLabel: z.string().optional(),
    ctaHref: z.string().url().optional(),
    recipientFilter: z.enum(['all', 'verified', 'unverified', 'admin']).default('all'),
    dryRun: z.boolean().default(false),
})

export async function POST(req: Request) {
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response

        // Check if user is admin
        if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
            return apiError('Only administrators can send broadcast emails', 403)
        }

        const body = await req.json().catch(() => null)
        const parsed = broadcastSchema.safeParse(body)

        if (!parsed.success) {
            return apiError('Invalid request data', 400)
        }

        const { subject, body: emailBody, priority, ctaLabel, ctaHref, recipientFilter, dryRun } = parsed.data

        // Get recipient list based on filter
        let recipients
        switch (recipientFilter) {
            case 'verified':
                recipients = await prisma.user.findMany({
                    where: { emailVerified: { not: null } },
                    select: { id: true, email: true, name: true },
                })
                break
            case 'unverified':
                recipients = await prisma.user.findMany({
                    where: { emailVerified: null },
                    select: { id: true, email: true, name: true },
                })
                break
            case 'admin':
                recipients = await prisma.user.findMany({
                    where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
                    select: { id: true, email: true, name: true },
                })
                break
            case 'all':
            default:
                recipients = await prisma.user.findMany({
                    where: { email: { not: null } },
                    select: { id: true, email: true, name: true },
                })
        }

        const validRecipients = recipients.filter((r) => r.email)

        if (validRecipients.length === 0) {
            return apiError('No recipients found for this filter', 400)
        }

        // If dry run, just return the count
        if (dryRun) {
            return apiResponse({
                success: true,
                isDryRun: true,
                recipientCount: validRecipients.length,
                message: `Would send to ${validRecipients.length} recipient${validRecipients.length === 1 ? '' : 's'}`,
            })
        }

        // Send emails in batches
        const batchSize = 50
        let successCount = 0
        const errors: string[] = []

        for (let i = 0; i < validRecipients.length; i += batchSize) {
            const batch = validRecipients.slice(i, i + batchSize)

            const sendPromises = batch.map(async (recipient) => {
                try {
                    await sendTemplateEmail({
                        to: recipient.email!,
                        subject,
                        template: AdminBroadcastEmail,
                        props: {
                            subject,
                            body: emailBody,
                            senderName: 'Emberly Team',
                            priority: priority as 'low' | 'normal' | 'high',
                            ctaLabel: ctaLabel || undefined,
                            ctaHref: ctaHref || undefined,
                        },
                    })
                    successCount++
                } catch (error) {
                    errors.push(`Failed to send to ${recipient.email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            })

            await Promise.all(sendPromises)
        }

        return apiResponse({
            success: true,
            sentTo: successCount,
            total: validRecipients.length,
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Return first 10 errors
            errorCount: errors.length,
            message: `Sent to ${successCount} of ${validRecipients.length} recipients`,
        })
    } catch (error) {
        console.error('Broadcast email error:', error)
        return apiError('Internal server error')
    }
}

export async function GET(req: Request) {
    try {
        const { user, response } = await requireAuth(req)
        if (response) return response

        // Check if user is admin
        if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
            return apiError('Only administrators can view broadcast statistics', 403)
        }

        // Get user counts by filter
        const stats = {
            total: await prisma.user.count(),
            verified: await prisma.user.count({ where: { emailVerified: { not: null } } }),
            unverified: await prisma.user.count({ where: { emailVerified: null } }),
            admin: await prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPERADMIN'] } } }),
        }

        return apiResponse(stats)
    } catch (error) {
        console.error('Broadcast stats error:', error)
        return apiError('Internal server error')
    }
}
