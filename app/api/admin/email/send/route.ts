import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, apiResponse, HTTP_STATUS } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.api.getChildLogger('admin-email')

const SendEmailSchema = z.object({
    to: z.array(z.string().email()).min(1, 'At least one recipient required'),
    subject: z.string().min(1, 'Subject is required'),
    body: z.string().min(1, 'Body is required'),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
})

export async function POST(req: NextRequest) {
    try {
        const { user, response } = await requireAdmin()
        if (response) return response

        const body = await req.json()
        const result = SendEmailSchema.safeParse(body)

        if (!result.success) {
            return apiError(result.error.errors[0].message, HTTP_STATUS.BAD_REQUEST)
        }

        const { to, subject, body: emailBody, priority } = result.data

        logger.info('Admin sending bulk email', {
            adminId: user.id,
            recipientCount: to.length,
            subject,
            priority,
        })

        // Queue emails for each recipient
        let queued = 0
        const errors: string[] = []

        for (const email of to) {
            try {
                // Find user by email to get userId
                const recipient = await prisma.user.findUnique({
                    where: { email },
                    select: { id: true, name: true },
                })

                // Replace {email} and {name} placeholders
                const personalizedBody = emailBody
                    .replace(/\{email\}/g, email)
                    .replace(/\{name\}/g, recipient?.name || 'there')

                // Emit email event - this will be handled by the email handler
                // Note: Admin emails bypass user preferences (no sourceEvent set)
                await events.emit('email.send', {
                    to: email,
                    subject,
                    template: 'admin-broadcast',
                    variables: {
                        body: personalizedBody,
                        subject,
                        priority,
                        senderName: user.name || 'Emberly Team',
                    },
                    userId: recipient?.id,
                })

                queued++
            } catch (error) {
                logger.error('Failed to queue email', error as Error, { email })
                errors.push(email)
            }
        }

        // Log the broadcast event
        await events.emit('admin.broadcast-sent', {
            adminId: user.id,
            recipientCount: queued,
            subject,
            priority,
            failedCount: errors.length,
        })

        logger.info('Bulk email queued', {
            queued,
            failed: errors.length,
        })

        return apiResponse({
            success: true,
            queued,
            failed: errors.length,
            errors: errors.length > 0 ? errors : undefined,
        })
    } catch (error) {
        logger.error('Admin email send error', error as Error)
        return apiError('Failed to send emails', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}
