import React, { type ComponentType } from 'react';

/**
 * Props for each email template type
 */
export type EmailTemplateProps = {
    welcome: {
        name?: string;
        email: string;
    };
    verification: {
        email: string;
        token: string;
    };
    resetPassword: {
        email: string;
        resetUrl: string;
    };
    passwordResetSuccess: {
        email: string;
    };
    statusIncidentCreated: {
        incidentName: string;
        impact: string;
        statusUrl: string;
        unsubscribeUrl: string;
    };
    statusIncidentUpdated: {
        incidentName: string;
        updateBody: string;
        statusUrl: string;
        unsubscribeUrl: string;
    };
    statusIncidentResolved: {
        incidentName: string;
        statusUrl: string;
        unsubscribeUrl: string;
    };
    statusMaintenanceScheduled: {
        title: string;
        scheduledAt: string;
        statusUrl: string;
        unsubscribeUrl: string;
    };
    statusMaintenanceUpdated: {
        title: string;
        updateMessage: string;
        statusUrl: string;
        unsubscribeUrl: string;
    };
};

import PasswordResetSuccessEmail from '@/emails/templates/accounts/password-reset-success';
import ResetPasswordEmail from '@/emails/templates/accounts/reset-password';
import VerificationEmail from '@/emails/templates/accounts/verification';
import WelcomeEmail from '@/emails/templates/accounts/welcome';
import StatusIncidentCreatedEmail from '@/emails/templates/status/incident-created';
import StatusIncidentUpdatedEmail from '@/emails/templates/status/incident-updated';
import StatusIncidentResolvedEmail from '@/emails/templates/status/incident-resolved';
import StatusMaintenanceScheduledEmail from '@/emails/templates/status/maintenance-scheduled';
import StatusMaintenanceUpdatedEmail from '@/emails/templates/status/maintenance-updated';

const templateComponents: {
    [K in keyof EmailTemplateProps]: ComponentType<EmailTemplateProps[K]>;
} = {
    welcome: WelcomeEmail,
    verification: VerificationEmail,
    resetPassword: ResetPasswordEmail,
    passwordResetSuccess: PasswordResetSuccessEmail,
    statusIncidentCreated: StatusIncidentCreatedEmail,
    statusIncidentUpdated: StatusIncidentUpdatedEmail,
    statusIncidentResolved: StatusIncidentResolvedEmail,
    statusMaintenanceScheduled: StatusMaintenanceScheduledEmail,
    statusMaintenanceUpdated: StatusMaintenanceUpdatedEmail,
    // newsletterSend: require("@/emails/templates/newsletter/send").default,
};

/**
 * Valid email template names that can be used to create email elements
 * @type {string} - A union type of all available email template keys
 */
export type TemplateName = keyof typeof templateComponents;

/**
 * Creates a React element for an email template
 *
 * @template T - The email template name (must be a valid TemplateName)
 * @param {T} templateName - The name of the email template to create
 * @param {EmailTemplateProps[T]} props - The props to pass to the email template component
 * @returns {React.ReactElement} - A React element for the specified email template
 * @throws {Error} - Throws if the template name doesn't match any available templates
 */
export function createEmailElement<T extends TemplateName>(templateName: T, props: EmailTemplateProps[T]) {
    const TemplateComponent = templateComponents[templateName];

    if (!TemplateComponent) {
        throw new Error(`Email template "${templateName}" not found`);
    }

    return React.createElement(TemplateComponent, props);
}
