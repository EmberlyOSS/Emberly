import type { ReactElement } from 'react'

import { Resend } from 'resend'
import { prisma } from '@/packages/lib/database/prisma'

const defaultFrom = process.env.EMAIL_FROM || 'Emberly <noreply@embrly.ca>'

let cachedResend: Resend | null = null

function getResendClient() {
    if (cachedResend) return cachedResend
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        throw new Error('RESEND_API_KEY is not set')
    }

    // Log which sender/domain is being used to catch any accidental "placeholder" configs
    const sender = process.env.EMAIL_FROM || defaultFrom
    // Do not log the full key; just the prefix for diagnostics
    const apiKeyPrefix = `${apiKey.slice(0, 6)}…`
    // eslint-disable-next-line no-console
    console.info('[email] Using Resend', { from: sender, apiKey: apiKeyPrefix })

    cachedResend = new Resend(apiKey)
    return cachedResend
}

export type SendEmailOptions = {
    to: string | string[]
    subject: string
    replyTo?: string | string[]
    react?: ReactElement
    html?: string
    text?: string
    from?: string
    headers?: Record<string, string>
    /** Optional: skip tracking this email in stats */
    skipTracking?: boolean
    /** Optional: template name for tracking purposes */
    templateName?: string
}

export type TemplateComponent<P> = (props: P) => ReactElement

export { BasicEmail } from './templates/basic'
export { WelcomeEmail } from './templates/welcome'
export { VerificationCodeEmail } from './templates/verification-code'
export { MagicLinkEmail } from './templates/magic-link'
export { PasswordResetEmail } from './templates/password-reset'
export { AccountChangeEmail } from './templates/account-change'
export { NewLoginEmail } from './templates/new-login'
export { AdminBroadcastEmail } from './templates/admin-broadcast'
export { PerkGainedEmail } from './templates/perk-gained'
export { QuotaReachedEmail } from './templates/quota-reached'
export { StorageAssignedEmail } from './templates/storage-assigned'
export { NexiumWelcomeEmail } from './templates/nexium-welcome'
export { NexiumOpportunityEmail } from './templates/nexium-opportunity'
export { NexiumSquadInviteEmail } from './templates/nexium-squad-invite'

export async function sendEmail({
    to,
    subject,
    replyTo,
    react,
    html,
    text,
    from,
    headers,
    skipTracking = false,
    templateName,
}: SendEmailOptions) {
    if (!react && !html && !text) {
        throw new Error('Provide react, html, or text content')
    }

    const resend = getResendClient()
    const payload = {
        from: from || defaultFrom,
        to,
        subject,
        replyTo,
        react,
        html,
        text,
        headers,
    }

    const response = await resend.emails.send(payload)

    if (response.error) {
        // Track failed email (fire-and-forget)
        if (!skipTracking) {
             prisma.event.create({
                data: {
                    type: 'email.sent',
                    status: 'FAILED',
                    payload: {
                        to: Array.isArray(to) ? to : [to],
                        subject,
                        template: templateName || 'unknown',
                        error: response.error.message,
                    },
                    failedAt: new Date(),
                    error: response.error.message,
                },
            }).catch(() => { /* mute tracking errors */ })
        }
        throw new Error(response.error.message)
    }

    // Resend SDK returns { data: { id }, error }
    const id = response.data?.id
    if (!id) {
        // Some emails may send successfully but not return an ID in dev mode
        // eslint-disable-next-line no-console
        console.warn('[email] Resend did not return a message id, but no error was thrown')
    }

    // Track successful email
    // Track successful email (fire-and-forget)
    if (!skipTracking) {
         prisma.event.create({
            data: {
                type: 'email.sent',
                status: 'COMPLETED',
                payload: {
                    to: Array.isArray(to) ? to : [to],
                    subject,
                    template: templateName || 'unknown',
                    messageId: id || 'unknown',
                },
                processedAt: new Date(),
            },
        }).catch(() => { /* mute tracking errors */ })
    }

    // eslint-disable-next-line no-console
    console.info('[email] Resend accepted message', { id: id || 'unknown', to })

    return { id: id || `email-${Date.now()}` }
}

export async function sendTemplateEmail<P>(options: {
    to: string | string[]
    subject: string
    template: TemplateComponent<P>
    props: P
    from?: string
    replyTo?: string | string[]
    headers?: Record<string, string>
    /** Optional: skip tracking this email in stats (use when called from event handler to avoid duplicates) */
    skipTracking?: boolean
}) {
    const { template, props, skipTracking, ...rest } = options
    const react = template(props)
    // Extract template name from function for tracking
    const templateName = template.name || 'CustomTemplate'
    return sendEmail({ ...rest, react, skipTracking, templateName })
}
