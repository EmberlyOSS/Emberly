import type { ReactElement } from 'react'

import { BasicEmail } from './basic'

export type MagicLinkEmailProps = {
    link: string
    expiresMinutes?: number
    action?: string
}

export function MagicLinkEmail({ link, expiresMinutes = 15, action = 'sign in' }: MagicLinkEmailProps): ReactElement {
    return (
        <BasicEmail
            title="Your magic link"
            preheader={`Click to ${action}.`}
            headline="One click sign in"
            body={[
                `Click the button below to ${action}.`,
                `This link expires in ${expiresMinutes} minute${expiresMinutes === 1 ? '' : 's'}. If you didn't request this, no action is needed.`,
            ]}
            cta={{ label: 'Open magic link', href: link }}
            footerNote="Sent from Emberly · embrly.ca"
        />
    )
}
