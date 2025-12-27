import type { ReactElement } from 'react'

import { BasicEmail } from './basic'

export type NewLoginEmailProps = {
    userName?: string
    ipAddress?: string
    location?: string
    device?: string
    time?: string
    manageUrl?: string
    supportUrl?: string
}

export function NewLoginEmail({
    userName = 'there',
    ipAddress,
    location,
    device,
    time,
    manageUrl,
    supportUrl,
}: NewLoginEmailProps): ReactElement {
    const details: string[] = []
    if (time) details.push(`Time: ${time}`)
    if (location) details.push(`Location: ${location}`)
    if (ipAddress) details.push(`IP: ${ipAddress}`)
    if (device) details.push(`Device: ${device}`)

    const body: string[] = [
        `${userName}, we detected a new sign-in to your account.`,
        details.length ? `Details: ${details.join(' · ')}` : 'No extra sign-in details were provided.',
        'If this was you, no action is needed.',
        'If this was not you, secure your account immediately.',
    ]

    if (manageUrl) {
        body.push('Change your password or sign out other sessions:')
    }

    if (supportUrl) {
        body.push(`Need help? Visit support: ${supportUrl}`)
    }

    return (
        <BasicEmail
            title="New login detected"
            preheader="We noticed a new sign-in to your account."
            headline="New sign-in alert"
            body={body}
            cta={manageUrl ? { label: 'Review account security', href: manageUrl } : undefined}
            footerNote="If this wasn’t you, change your password and contact support. Sent from Emberly · embrly.ca"
        />
    )
}
