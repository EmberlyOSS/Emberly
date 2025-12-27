import type { ReactElement } from 'react'

import { BasicEmail } from './basic'

export type AccountChangeEmailProps = {
    userName?: string
    changes: string[]
    manageUrl?: string
    supportUrl?: string
}

export function AccountChangeEmail({
    userName = 'there',
    changes,
    manageUrl,
    supportUrl,
}: AccountChangeEmailProps): ReactElement {
    const paragraphs = [
        `${userName}, we noticed the following changes on your account:`,
        ...changes.map((change) => `• ${change}`),
        'If you made these changes, no further action is needed.',
    ]

    if (manageUrl) {
        paragraphs.push('Need to review or undo something? Manage your account settings below.')
    }

    if (supportUrl) {
        paragraphs.push(`Need help? Visit support: ${supportUrl}`)
    }

    return (
        <BasicEmail
            title="Account changes noticed"
            preheader="We detected updates on your account."
            headline="Account updates"
            body={paragraphs}
            cta={manageUrl ? { label: 'Review account settings', href: manageUrl } : undefined}
            footerNote="If this wasn’t you, secure your account and contact support. Sent from Emberly · embrly.ca"
        />
    )
}
