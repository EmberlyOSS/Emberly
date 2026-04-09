import type { ReactElement } from 'react'

import { Resend } from 'resend'
import { prisma } from '@/packages/lib/database/prisma'
import { getIntegrations } from '@/packages/lib/config'

let cachedResend: Resend | null = null
let cachedResendKey: string | null = null

async function getResendClient(): Promise<{ client: Resend; from: string }> {
    const integrations = await getIntegrations()
    const apiKey = integrations.resend?.apiKey || process.env.RESEND_API_KEY
    const emailFrom = integrations.resend?.emailFrom || process.env.EMAIL_FROM || 'Emberly <noreply@embrly.ca>'

    if (!apiKey) {
        throw new Error('Resend API key is not configured')
    }

    // Re-initialise if the key changed (e.g. admin updated it)
    if (cachedResendKey !== apiKey) {
        cachedResendKey = apiKey
        // Do not log the full key; just the prefix for diagnostics
        const apiKeyPrefix = `${apiKey.slice(0, 6)}…`
        // eslint-disable-next-line no-console
        console.info('[email] Using Resend', { from: emailFrom, apiKey: apiKeyPrefix })
        cachedResend = new Resend(apiKey)
    }

    return { client: cachedResend!, from: emailFrom }
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
export { NexiumSquadInviteAcceptedEmail } from './templates/nexium-squad-invite-accepted'
export { NexiumSquadInviteDeclinedEmail } from './templates/nexium-squad-invite-declined'
export { ApplicationReplyEmail } from './templates/application-reply'
export { ApplicationStatusEmail } from './templates/application-status'
export { BucketCredentialsEmail } from './templates/bucket-credentials'
export { EmailChangedOldEmail } from './templates/email-changed-old'
export { EmailChangedNewEmail } from './templates/email-changed-new'
export { ExportRequestedEmail } from './templates/export-requested'
export { ExportCompletedEmail } from './templates/export-completed'
export { DeletionRequestedEmail } from './templates/deletion-requested'
export { DeletionCancelledEmail } from './templates/deletion-cancelled'
export { AccountDeletedEmail } from './templates/account-deleted'
export { SubscriptionCreatedEmail } from './templates/subscription-created'
export { SubscriptionUpdatedEmail } from './templates/subscription-updated'
export { SubscriptionCancelledEmail } from './templates/subscription-cancelled'
export { PaymentSucceededEmail } from './templates/payment-succeeded'
export { PaymentFailedEmail } from './templates/payment-failed'
export { RefundIssuedEmail } from './templates/refund-issued'

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

    const { client: resend, from: defaultFrom } = await getResendClient()
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
