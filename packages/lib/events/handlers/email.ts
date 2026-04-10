import type { EventPayload, EventType } from '@/packages/types/events'

import { 
    sendTemplateEmail, 
    BasicEmail, 
    AdminBroadcastEmail, 
    AccountChangeEmail, 
    PerkGainedEmail, 
    QuotaReachedEmail, 
    StorageAssignedEmail, 
    NewLoginEmail, 
    NexiumWelcomeEmail, 
    NexiumOpportunityEmail, 
    NexiumSquadInviteEmail,
    NexiumSquadInviteAcceptedEmail,
    NexiumSquadInviteDeclinedEmail,
    WelcomeEmail,
    VerificationCodeEmail,
    MagicLinkEmail,
    PasswordResetEmail,
    EmailChangedOldEmail,
    EmailChangedNewEmail,
    ExportRequestedEmail,
    ExportCompletedEmail,
    DeletionRequestedEmail,
    DeletionCancelledEmail,
    AccountDeletedEmail,
    SubscriptionCreatedEmail,
    SubscriptionUpdatedEmail,
    SubscriptionCancelledEmail,
    PaymentSucceededEmail,
    PaymentFailedEmail,
    RefundIssuedEmail,
    ApplicationReplyEmail,
    ApplicationStatusEmail,
    BucketCredentialsEmail,
} from '@/packages/lib/emails'
import { loggers } from '@/packages/lib/logger'

import { events } from '../index'
import { shouldSendEmail } from '../utils/email-preferences'

const logger = loggers.events.getChildLogger('email-handler')

/**
 * Send an email using the configured email service (Resend)
 */
async function sendEmail(options: {
    to: string
    subject: string
    template: string
    variables: Record<string, unknown>
}): Promise<{ messageId: string }> {
    const { to, subject, template, variables } = options

    // Use specific templates based on template name
    if (template === 'admin-broadcast') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: AdminBroadcastEmail,
            props: {
                subject,
                body: String(variables.body || ''),
                senderName: String(variables.senderName || 'Emberly Team'),
                priority: variables.priority as 'low' | 'normal' | 'high' | undefined,
                ctaLabel: typeof variables.ctaLabel === 'string' ? variables.ctaLabel : undefined,
                ctaHref: typeof variables.ctaHref === 'string' ? variables.ctaHref : undefined,
            },
            // Skip tracking since event system already tracks email.send -> email.sent
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    // Map account change events to AccountChangeEmail template
    if (['password-changed', '2fa-enabled', '2fa-disabled', 'account-change'].includes(template)) {
        const changes: string[] = []
        
        if (template === 'password-changed') {
            changes.push('Password updated')
        } else if (template === '2fa-enabled') {
            changes.push(`Two-factor authentication enabled (${String(variables.method) || 'Authenticator'})`)
        } else if (template === '2fa-disabled') {
            changes.push(`Two-factor authentication disabled (${String(variables.method) || 'Authenticator'})`)
        } else if (Array.isArray(variables.changes)) {
            changes.push(...variables.changes as string[])
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || 'http://localhost:3000'
        const result = await sendTemplateEmail({
            to,
            subject,
            template: AccountChangeEmail,
            props: {
                userName: typeof variables.userName === 'string' ? variables.userName : undefined,
                changes,
                manageUrl: `${baseUrl}/me`,
                supportUrl: `${baseUrl}/contact`,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    // Map perk-gained event to PerkGainedEmail template
    if (template === 'perk-gained') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: PerkGainedEmail,
            props: {
                perkName: String(variables.perkName || 'Unknown Perk'),
                perkDescription: typeof variables.perkDescription === 'string' ? variables.perkDescription : undefined,
                perkIcon: typeof variables.perkIcon === 'string' ? variables.perkIcon : '🎉',
                expiresAt: typeof variables.expiresAt === 'string' ? variables.expiresAt : null,
                viewUrl: typeof variables.viewUrl === 'string' ? variables.viewUrl : 'https://embrly.ca/me',
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    // Map quota-reached event to QuotaReachedEmail template
    if (template === 'quota-reached') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: QuotaReachedEmail,
            props: {
                currentUsage: typeof variables.currentUsage === 'number' ? variables.currentUsage : 0,
                quotaLimit: typeof variables.quotaLimit === 'number' ? variables.quotaLimit : 0,
                percentage: typeof variables.percentage === 'number' ? variables.percentage : 100,
                unit: typeof variables.unit === 'string' ? variables.unit : 'MB',
                dashboardUrl: typeof variables.dashboardUrl === 'string' ? variables.dashboardUrl : undefined,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    // Map storage-assigned event to StorageAssignedEmail template
    if (template === 'storage-assigned') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: StorageAssignedEmail,
            props: {
                storageAmount: String(variables.storageAmount || '0 MB'),
                reason: typeof variables.reason === 'string' ? variables.reason : undefined,
                usageUrl: typeof variables.usageUrl === 'string' ? variables.usageUrl : undefined,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    // Map new-device-login event to NewLoginEmail template
    if (template === 'new-device-login') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: NewLoginEmail,
            props: {
                loginLocation: typeof variables.location === 'string' ? variables.location : undefined,
                loginTime: typeof variables.time === 'string' ? variables.time : undefined,
                loginDevice: typeof variables.device === 'string' ? variables.device : undefined,
                reviewUrl: typeof variables.reviewUrl === 'string' ? variables.reviewUrl : undefined,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'nexium-welcome') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: NexiumWelcomeEmail,
            props: {
                name: typeof variables.name === 'string' ? variables.name : undefined,
                profileUrl: typeof variables.profileUrl === 'string' ? variables.profileUrl : 'https://embrly.ca/discovery',
                profileId: String(variables.profileId || ''),
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'nexium-opportunity') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: NexiumOpportunityEmail,
            props: {
                name: typeof variables.name === 'string' ? variables.name : undefined,
                opportunityTitle: String(variables.opportunityTitle || ''),
                opportunityUrl: typeof variables.opportunityUrl === 'string' ? variables.opportunityUrl : 'https://embrly.ca/discovery',
                companyName: typeof variables.companyName === 'string' ? variables.companyName : undefined,
                skills: Array.isArray(variables.skills) ? variables.skills.map(String) : [],
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'nexium-squad-invite') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: NexiumSquadInviteEmail,
            props: {
                name: typeof variables.name === 'string' ? variables.name : undefined,
                squadName: String(variables.squadName || ''),
                inviterName: String(variables.inviterName || ''),
                inviteUrl: typeof variables.inviteUrl === 'string' ? variables.inviteUrl : 'https://embrly.ca/discovery',
                declineUrl: typeof variables.declineUrl === 'string' ? variables.declineUrl : 'https://embrly.ca/discovery',
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'nexium-squad-invite-accepted') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: NexiumSquadInviteAcceptedEmail,
            props: {
                ownerName: typeof variables.ownerName === 'string' ? variables.ownerName : undefined,
                memberName: String(variables.memberName || ''),
                squadName: String(variables.squadName || ''),
                squadUrl: typeof variables.squadUrl === 'string' ? variables.squadUrl : 'https://embrly.ca/dashboard/discovery',
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'nexium-squad-invite-declined') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: NexiumSquadInviteDeclinedEmail,
            props: {
                ownerName: typeof variables.ownerName === 'string' ? variables.ownerName : undefined,
                memberName: String(variables.memberName || ''),
                squadName: String(variables.squadName || ''),
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    // Account templates
    if (template === 'welcome') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: WelcomeEmail,
            props: {
                name: typeof variables.name === 'string' ? variables.name : undefined,
                verificationUrl: typeof variables.verificationUrl === 'string' ? variables.verificationUrl : undefined,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'verify-email') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: VerificationCodeEmail,
            props: {
                code: String(variables.verifyToken || variables.code || ''),
                verificationUrl: typeof variables.verifyUrl === 'string' ? variables.verifyUrl : undefined,
                expiresInMinutes: typeof variables.expiresInMinutes === 'number' ? variables.expiresInMinutes : 30,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'magic-link') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: MagicLinkEmail,
            props: {
                magicLink: String(variables.magicLink || ''),
                email: to instanceof Array ? to[0] : to,
                expiresInMinutes: typeof variables.expiresInMinutes === 'number' ? variables.expiresInMinutes : 15,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'password-reset') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: PasswordResetEmail,
            props: {
                resetUrl: String(variables.resetUrl || ''),
                expiresInMinutes: typeof variables.expiresInMinutes === 'number' ? variables.expiresInMinutes : 30,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'email-changed-old') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: EmailChangedOldEmail,
            props: {
                oldEmail: String(variables.oldEmail || ''),
                newEmail: String(variables.newEmail || ''),
                changedAt: String(variables.changedAt || new Date().toISOString()),
                changedBy: typeof variables.changedBy === 'string' ? variables.changedBy : 'by you',
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'email-changed-new') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: EmailChangedNewEmail,
            props: {
                oldEmail: String(variables.oldEmail || ''),
                newEmail: String(variables.newEmail || ''),
                changedAt: String(variables.changedAt || new Date().toISOString()),
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'export-requested') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: ExportRequestedEmail,
            props: {
                exportId: String(variables.exportId || ''),
                requestedAt: String(variables.requestedAt || new Date().toISOString()),
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'export-completed') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: ExportCompletedEmail,
            props: {
                downloadUrl: String(variables.downloadUrl || ''),
                expiresAt: typeof variables.expiresAt === 'string' ? variables.expiresAt : undefined,
                exportId: String(variables.exportId || ''),
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'deletion-requested') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: DeletionRequestedEmail,
            props: {
                scheduledAt: String(variables.scheduledAt || ''),
                cancelUrl: String(variables.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://embrly.ca'}/me`),
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'deletion-cancelled') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: DeletionCancelledEmail,
            props: {
                cancelledAt: String(variables.cancelledAt || new Date().toISOString()),
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'account-deleted') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: AccountDeletedEmail,
            props: {
                deletedAt: String(variables.deletedAt || new Date().toISOString()),
                reason: typeof variables.reason === 'string' ? variables.reason : undefined,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    // Billing templates
    if (template === 'subscription-created') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: SubscriptionCreatedEmail,
            props: {
                planName: String(variables.planName || ''),
                interval: (variables.interval as 'day' | 'month' | 'year') || 'month',
                amount: typeof variables.amount === 'number' ? variables.amount : 0,
                currency: String(variables.currency || 'USD'),
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'subscription-updated') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: SubscriptionUpdatedEmail,
            props: {
                changeType: (variables.changeType as 'upgrade' | 'downgrade' | 'update') || 'update',
                newPlanName: String(variables.newPlanName || ''),
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'subscription-cancelled') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: SubscriptionCancelledEmail,
            props: {
                effectiveAt: String(variables.effectiveAt || ''),
                reason: typeof variables.reason === 'string' ? variables.reason : undefined,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'payment-succeeded') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: PaymentSucceededEmail,
            props: {
                amount: typeof variables.amount === 'number' ? variables.amount : 0,
                currency: String(variables.currency || 'USD'),
                invoiceId: typeof variables.invoiceId === 'string' ? variables.invoiceId : undefined,
                receiptUrl: typeof variables.receiptUrl === 'string' ? variables.receiptUrl : undefined,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'payment-failed') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: PaymentFailedEmail,
            props: {
                amount: typeof variables.amount === 'number' ? variables.amount : 0,
                currency: String(variables.currency || 'USD'),
                failureReason: String(variables.failureReason || 'Unknown reason'),
                nextRetryAt: typeof variables.nextRetryAt === 'string' ? variables.nextRetryAt : undefined,
                updatePaymentUrl: String(variables.updatePaymentUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://embrly.ca'}/dashboard/billing`),
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'refund-issued') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: RefundIssuedEmail,
            props: {
                amount: typeof variables.amount === 'number' ? variables.amount : 0,
                currency: String(variables.currency || 'USD'),
                reason: typeof variables.reason === 'string' ? variables.reason : undefined,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    // Application templates
    if (template === 'application-reply') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: ApplicationReplyEmail,
            props: {
                applicantName: typeof variables.applicantName === 'string' ? variables.applicantName : undefined,
                applicationId: String(variables.applicationId || ''),
                replyUrl: String(variables.replyUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://embrly.ca'}/dashboard`),
                message: typeof variables.message === 'string' ? variables.message : '',
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'application-status') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: ApplicationStatusEmail,
            props: {
                applicantName: typeof variables.applicantName === 'string' ? variables.applicantName : undefined,
                status: String(variables.status || ''),
                applicationUrl: String(variables.applicationUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://embrly.ca'}/dashboard`),
                message: typeof variables.message === 'string' ? variables.message : undefined,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    if (template === 'bucket-credentials') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: BucketCredentialsEmail,
            props: {
                bucketName: String(variables.bucketName || ''),
                accessKey: String(variables.accessKey || ''),
                secretKey: String(variables.secretKey || ''),
                endpoint: String(variables.endpoint || ''),
                region: typeof variables.region === 'string' ? variables.region : undefined,
            },
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    // Fallback: use BasicEmail for unknown templates
    logger.warn('Unknown email template, using fallback', { template })
    const result = await sendTemplateEmail({
        to,
        subject,
        template: BasicEmail,
        props: {
            title: subject,
            preheader: typeof variables.preheader === 'string' ? variables.preheader : undefined,
            headline: typeof variables.headline === 'string' ? variables.headline : subject,
            body: typeof variables.body === 'string' ? [variables.body] : Array.isArray(variables.body) ? variables.body : [String(variables.body || '')],
            cta: variables.ctaLabel && variables.ctaHref
                ? { label: String(variables.ctaLabel), href: String(variables.ctaHref) }
                : undefined,
            footerNote: typeof variables.footerNote === 'string' ? variables.footerNote : undefined,
        },
        skipTracking: true,
    })

    return { messageId: result.id || `email-${Date.now()}` }
}

/**
 * Register email event handlers
 */
export function registerEmailHandlers(): void {
    // ─────────────────────────────────────────────────────────────────────────────
    // Send email handler
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'email.send',
        'send-email',
        async (payload: EventPayload<'email.send'>, event) => {
            // Check user preferences before sending (if sourceEvent provided)
            if (payload.sourceEvent && payload.userId) {
                const { shouldSend, reason } = await shouldSendEmail(
                    payload.userId,
                    payload.sourceEvent as EventType
                )

                if (!shouldSend) {
                    logger.info('Email skipped due to user preferences', {
                        to: payload.to,
                        template: payload.template,
                        reason,
                        sourceEvent: payload.sourceEvent,
                    })
                    return // Skip sending
                }
            }

            try {
                logger.debug('Sending email', {
                    to: payload.to,
                    template: payload.template,
                    subject: payload.subject,
                })

                const result = await sendEmail({
                    to: payload.to,
                    subject: payload.subject,
                    template: payload.template,
                    variables: payload.variables,
                })

                // Emit success event
                await events.emit('email.sent', {
                    to: payload.to,
                    template: payload.template,
                    messageId: result.messageId,
                    userId: payload.userId,
                })

                logger.info('Email sent successfully', {
                    to: payload.to,
                    template: payload.template,
                    messageId: result.messageId,
                })
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                const errorStack = error instanceof Error ? error.stack : undefined

                logger.error('Failed to send email', error as Error, {
                    to: payload.to,
                    template: payload.template,
                    variables: payload.variables,
                    errorMessage,
                    errorStack,
                })

                // Emit failure event
                await events.emit('email.failed', {
                    to: payload.to,
                    template: payload.template,
                    error: errorMessage,
                    userId: payload.userId,
                    willRetry: event.retryCount < event.maxRetries,
                })

                // Re-throw to trigger retry if configured
                throw error
            }
        },
        {
            enabled: true,
            maxConcurrency: 5,
            timeout: 30000,
            retryDelay: 5000,
        }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Email sent logging
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'email.sent',
        'log-sent',
        async (payload: EventPayload<'email.sent'>) => {
            logger.debug('Email sent event logged', {
                to: payload.to,
                template: payload.template,
                messageId: payload.messageId,
            })
            // Could store in email_logs table for tracking
        },
        { enabled: true, timeout: 5000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Email failure logging
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'email.failed',
        'log-failure',
        async (payload: EventPayload<'email.failed'>) => {
            logger.warn('Email failed', {
                to: payload.to,
                template: payload.template,
                error: payload.error,
                willRetry: payload.willRetry,
            })
            // Could store in email_logs table for debugging
        },
        { enabled: true, timeout: 5000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Email bounce handling
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'email.bounced',
        'handle-bounce',
        async (payload: EventPayload<'email.bounced'>) => {
            logger.warn('Email bounced', {
                to: payload.to,
                bounceType: payload.bounceType,
                messageId: payload.messageId,
            })

            // Hard bounces should suppress future sends
            if (payload.bounceType === 'hard') {
                logger.error('Hard bounce - should suppress email', { to: payload.to })
                // TODO: Add to suppression list in database
            }
        },
        { enabled: true, timeout: 10000 }
    )

    logger.debug('Email event handlers registered')
}

/**
 * Email templates that should be implemented
 */
export const EMAIL_TEMPLATES = {
    // Auth
    'new-device-login': 'New device login alert',
    'password-changed': 'Password change confirmation',
    'password-reset': 'Password reset link',
    '2fa-enabled': '2FA enabled confirmation',
    '2fa-disabled': '2FA disabled alert',
    'backup-codes-generated': 'Backup codes generated',
    'backup-code-used': 'Backup code used alert',
    'session-revoked': 'Session revoked notification',

    // Account
    'welcome': 'Welcome email',
    'verify-email': 'Email verification',
    'email-changed-old': 'Email changed (to old address)',
    'email-changed-new': 'Email changed (to new address)',
    'export-requested': 'Data export started',
    'export-completed': 'Data export ready',
    'deletion-requested': 'Account deletion scheduled',
    'deletion-cancelled': 'Account deletion cancelled',
    'account-deleted': 'Account deleted confirmation',

    // Billing
    'subscription-created': 'Subscription confirmation',
    'subscription-updated': 'Subscription change confirmation',
    'subscription-cancelled': 'Subscription cancellation',
    'payment-succeeded': 'Payment receipt',
    'payment-failed': 'Payment failed alert',
    'refund-issued': 'Refund confirmation',

    // Nexium
    'nexium-welcome': 'Discovery profile created – welcome email',
    'nexium-opportunity': 'Nexium opportunity match notification',
    'nexium-squad-invite': 'Nexium squad invitation',
} as const
