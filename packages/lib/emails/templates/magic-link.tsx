import type { ReactElement } from 'react'

import { BasicEmail } from './basic'

export type MagicLinkEmailProps = {
    signInUrl: string
    expiresMinutes?: number
    userName?: string
}

export function MagicLinkEmail({ signInUrl, expiresMinutes = 15, userName = 'there' }: MagicLinkEmailProps): ReactElement {
    return (
        <BasicEmail
            title="Your sign-in link"
            preheader="Click to sign in to your account."
            headline={`Hi ${userName}, here's your sign-in link`}
            body={[
                'Click the button below to sign in to your Emberly account.',
                `This link expires in ${expiresMinutes} minute${expiresMinutes === 1 ? '' : 's'}. If you didn't request this, you can ignore this email.`,
            ]}
            cta={{ label: 'Sign in to Emberly', href: signInUrl }}
            footerNote="Sent from Emberly · embrly.ca"
        />
    )
}
