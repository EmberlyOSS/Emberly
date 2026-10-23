import nodemailer from 'nodemailer';
import { renderEmailToHtml } from './renderHtml';
import type { EmailTemplateProps } from './template';
import { STATUS_HOST } from '@/lib/site';

interface EmailSender {
    email?: string;
    address?: string;
    name?: string;
}

interface EmailRecipient {
    email?: string;
    address?: string;
    name?: string;
}

interface EmailTemplate {
    name: string;
    subject: string;
    html: string;
    text?: string;
}

interface SendEmailOptions {
    to: EmailRecipient | EmailRecipient[] | string | string[];
    from?: EmailSender;
    subject: string;
    html?: string;
    text?: string;
}

interface SendEmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export function createTransport() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST!,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        // ignoreTLS=true is required when your SMTP server runs in `none` TLS mode
        // (behind a reverse proxy without STARTTLS). Set SMTP_IGNORE_TLS=true.
        ignoreTLS: process.env.SMTP_IGNORE_TLS === 'true',
        // Fail fast instead of nodemailer's multi-minute defaults, so a slow or
        // unreachable SMTP server doesn't leave sign-up spinning
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
        tls: {
            rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
        },
        auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
        },
    });
}

function recipientToAddress(recipient: string | EmailRecipient): string {
    if (typeof recipient === 'string') return recipient;
    const addr = recipient.address ?? recipient.email ?? '';
    return recipient.name ? `"${recipient.name}" <${addr}>` : addr;
}

const defaultFrom = () =>
    process.env.DEFAULT_FROM_NAME
        ? `"${process.env.DEFAULT_FROM_NAME}" <${process.env.DEFAULT_FROM_EMAIL ?? `donotreply@${STATUS_HOST}`}>`
        : (process.env.DEFAULT_FROM_EMAIL ?? `donotreply@${STATUS_HOST}`);

function isSmtpConfigured(): boolean {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!isSmtpConfigured()) {
        console.warn('[Email] Skipping send: SMTP_HOST, SMTP_USER, or SMTP_PASS not set. Configure these env vars to enable email sending.');
        return { success: false, error: 'SMTP not configured' };
    }

    try {
        const transport = createTransport();
        const toList = Array.isArray(options.to) ? options.to : [options.to];
        const to = toList.map(recipientToAddress).join(', ');

        const from = options.from
            ? options.from.name
                ? `"${options.from.name}" <${options.from.address ?? options.from.email}>`
                : (options.from.address ?? options.from.email)
            : defaultFrom();

        const result = await transport.sendMail({
            from,
            to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });

        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('[Email] Send failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

async function sendTemplate(
    to: string | EmailRecipient | (string | EmailRecipient)[],
    template: EmailTemplate,
    from?: EmailSender
): Promise<SendEmailResult> {
    const toList = Array.isArray(to) ? to : [to];
    return sendEmail({ to: toList as string[], from, subject: template.subject, html: template.html, text: template.text });
}

const emailTemplates = {
    verification: (email: string, token: string): EmailTemplate => {
        const props: EmailTemplateProps['verification'] = { email, token };
        const text = `Please verify your email: ${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
        return { name: 'verification', subject: 'Verify your email', text, html: renderEmailToHtml('verification', props) };
    },
    resetPassword: (email: string, resetUrl: string): EmailTemplate => {
        const props: EmailTemplateProps['resetPassword'] = { email, resetUrl };
        return { name: 'resetPassword', subject: 'Reset your password', text: `Reset your password: ${resetUrl}`, html: renderEmailToHtml('resetPassword', props) };
    },
    welcome: (name: string | undefined, email: string): EmailTemplate => {
        const props: EmailTemplateProps['welcome'] = { name, email };
        return { name: 'welcome', subject: 'Welcome to Emberly', text: `Welcome to Emberly${name ? `, ${name}` : ''}!`, html: renderEmailToHtml('welcome', props) };
    },
    passwordResetSuccess: (email: string): EmailTemplate => {
        const props: EmailTemplateProps['passwordResetSuccess'] = { email };
        return { name: 'passwordResetSuccess', subject: 'Your password has been updated', text: `Your password for ${email} was successfully changed.`, html: renderEmailToHtml('passwordResetSuccess', props) };
    },
    statusIncidentCreated: (incidentName: string, impact: string, statusUrl: string, unsubscribeUrl: string): EmailTemplate => {
        const props: EmailTemplateProps['statusIncidentCreated'] = { incidentName, impact, statusUrl, unsubscribeUrl };
        return { name: 'statusIncidentCreated', subject: `[Incident] ${incidentName}`, text: `New incident: ${incidentName} (${impact}). View status: ${statusUrl}`, html: renderEmailToHtml('statusIncidentCreated', props) };
    },
    statusIncidentUpdated: (incidentName: string, updateBody: string, statusUrl: string, unsubscribeUrl: string): EmailTemplate => {
        const props: EmailTemplateProps['statusIncidentUpdated'] = { incidentName, updateBody, statusUrl, unsubscribeUrl };
        return { name: 'statusIncidentUpdated', subject: `[Update] ${incidentName}`, text: `Update on ${incidentName}: ${updateBody}\n\nView status: ${statusUrl}`, html: renderEmailToHtml('statusIncidentUpdated', props) };
    },
    statusIncidentResolved: (incidentName: string, statusUrl: string, unsubscribeUrl: string): EmailTemplate => {
        const props: EmailTemplateProps['statusIncidentResolved'] = { incidentName, statusUrl, unsubscribeUrl };
        return { name: 'statusIncidentResolved', subject: `[Resolved] ${incidentName}`, text: `Incident resolved: ${incidentName}. View status: ${statusUrl}`, html: renderEmailToHtml('statusIncidentResolved', props) };
    },
    statusMaintenanceScheduled: (title: string, scheduledAt: string, statusUrl: string, unsubscribeUrl: string): EmailTemplate => {
        const props: EmailTemplateProps['statusMaintenanceScheduled'] = { title, scheduledAt, statusUrl, unsubscribeUrl };
        return { name: 'statusMaintenanceScheduled', subject: `[Maintenance] ${title}`, text: `Scheduled maintenance: ${title} at ${scheduledAt}. View status: ${statusUrl}`, html: renderEmailToHtml('statusMaintenanceScheduled', props) };
    },
    statusMaintenanceUpdated: (title: string, updateMessage: string, statusUrl: string, unsubscribeUrl: string): EmailTemplate => {
        const props: EmailTemplateProps['statusMaintenanceUpdated'] = { title, updateMessage, statusUrl, unsubscribeUrl };
        return { name: 'statusMaintenanceUpdated', subject: `[Maintenance update] ${title}`, text: `Update on ${title}: ${updateMessage}\n\nView status: ${statusUrl}`, html: renderEmailToHtml('statusMaintenanceUpdated', props) };
    },
};

const emailClient = { sendEmail, sendTemplate, emailTemplates };

export { emailClient, sendEmail, emailTemplates };