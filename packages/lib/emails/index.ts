import type { ReactElement } from 'react'

import { render } from '@react-email/render'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
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

let cachedSmtpTransport: Transporter | null = null
let cachedSmtpConfig: string | null = null

async function getSmtpTransport(): Promise<{ transport: Transporter; from: string }> {
    const integrations = await getIntegrations()
    const smtp = integrations.smtp as Record<string, unknown> | undefined

    const host = (smtp?.host as string | undefined) || process.env.SMTP_HOST || ''
    const port = (smtp?.port as number | undefined) || Number(process.env.SMTP_PORT) || 587
    const secure = (smtp?.secure as boolean | undefined) ?? (process.env.SMTP_SECURE === 'true') ?? false
    const user = (smtp?.user as string | undefined) || process.env.SMTP_USER || ''
    const password = (smtp?.password as string | undefined) || process.env.SMTP_PASSWORD || ''
    const from = (smtp?.from as string | undefined) || process.env.EMAIL_FROM || 'Emberly <noreply@embrly.ca>'

    if (!host) {
        throw new Error('SMTP host is not configured')
    }

    const configKey = JSON.stringify({ host, port, secure, user })
    if (cachedSmtpConfig !== configKey || !cachedSmtpTransport) {
        cachedSmtpConfig = configKey
        cachedSmtpTransport = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: user ? { user, pass: password } : undefined,
        })
        // eslint-disable-next-line no-console
        console.info('[email] Using SMTP', { host, port, secure, from })
    }

    return { transport: cachedSmtpTransport, from }
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
export { FileSharedEmail } from './templates/file-shared'
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

    const integrations = await getIntegrations()
    const provider = (integrations as Record<string, unknown>).emailProvider as string | undefined ?? 'resend'

    let messageId: string | undefined

    if (provider === 'smtp') {
        const { transport, from: defaultFrom } = await getSmtpTransport()
        const htmlContent = html ?? (react ? await render(react) : undefined)
        const info = await transport.sendMail({
            from: from || defaultFrom,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            replyTo: Array.isArray(replyTo) ? replyTo.join(', ') : replyTo,
            html: htmlContent,
            text,
            headers,
        })
        messageId = info.messageId
    } else {
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

        messageId = response.data?.id
        if (!messageId) {
            // Some emails may send successfully but not return an ID in dev mode
            // eslint-disable-next-line no-console
            console.warn('[email] Resend did not return a message id, but no error was thrown')
        }
    }

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
                    messageId: messageId || 'unknown',
                    provider,
                },
                processedAt: new Date(),
            },
        }).catch(() => { /* mute tracking errors */ })
    }

    // eslint-disable-next-line no-console
    console.info(`[email] ${provider === 'smtp' ? 'SMTP' : 'Resend'} accepted message`, { id: messageId || 'unknown', to })

    return { id: messageId || `email-${Date.now()}` }
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
