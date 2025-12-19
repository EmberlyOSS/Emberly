import type { ReactElement } from 'react'

import { Resend } from 'resend'

const defaultFrom = process.env.EMAIL_FROM || 'Emberly <noreply@embrly.ca>'

let cachedResend: Resend | null = null

function getResendClient() {
    if (cachedResend) return cachedResend
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        throw new Error('RESEND_API_KEY is not set')
    }
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
}

export type TemplateComponent<P> = (props: P) => ReactElement

export { BasicEmail } from './templates/basic'
export { WelcomeEmail } from './templates/welcome'
export { VerificationCodeEmail } from './templates/verification-code'
export { MagicLinkEmail } from './templates/magic-link'
export { PasswordResetEmail } from './templates/password-reset'
export { AccountChangeEmail } from './templates/account-change'
export { NewLoginEmail } from './templates/new-login'

export async function sendEmail({
    to,
    subject,
    replyTo,
    react,
    html,
    text,
    from,
    headers,
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

    const { error, id } = await resend.emails.send(payload)
    if (error) {
        throw new Error(error.message)
    }
    return { id }
}

export async function sendTemplateEmail<P>(options: {
    to: string | string[]
    subject: string
    template: TemplateComponent<P>
    props: P
    from?: string
    replyTo?: string | string[]
    headers?: Record<string, string>
}) {
    const { template, props, ...rest } = options
    const react = template(props)
    return sendEmail({ ...rest, react })
}
