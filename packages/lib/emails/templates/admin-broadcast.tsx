import type { ReactElement } from 'react'

import { BasicEmail } from './basic'

export type AdminBroadcastEmailProps = {
    subject: string
    body: string
    senderName?: string
    priority?: 'low' | 'normal' | 'high'
    ctaLabel?: string
    ctaHref?: string
}

export function AdminBroadcastEmail({
    subject,
    body,
    senderName = 'Emberly Team',
    priority,
    ctaLabel,
    ctaHref,
}: AdminBroadcastEmailProps): ReactElement {
    const priorityNote = priority === 'high'
        ? '⚠️ This is an important announcement.'
        : undefined

    // Split body by newlines and filter empty lines
    const bodyParagraphs = body.split('\n').filter(Boolean)

    return (
        <BasicEmail
            title={subject}
            preheader={priorityNote || `Message from ${senderName}`}
            headline={subject}
            body={bodyParagraphs}
            cta={ctaLabel && ctaHref ? { label: ctaLabel, href: ctaHref } : undefined}
            footerNote={`Sent by ${senderName} via Emberly`}
        />
    )
}
