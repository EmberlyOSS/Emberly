import type { ReactElement } from 'react'

import { BasicEmail } from './basic'

export type WelcomeEmailProps = {
    userName?: string
    dashboardUrl: string
}

export function WelcomeEmail({ userName, dashboardUrl }: WelcomeEmailProps): ReactElement {
    const name = userName || 'there'
    return (
        <BasicEmail
            title="Welcome to Emberly"
            preheader="Your account is ready."
            headline={`Hey ${name}, welcome aboard!`}
            body={[
                `${name.charAt(0).toUpperCase() + name.slice(1)}, thanks for joining Emberly. We set things up so you can start uploading files, sharing, and managing your content right away.`,
                'Jump into your dashboard to upload files, create short links, and customize your profile.',
            ]}
            cta={{ label: 'Open dashboard', href: dashboardUrl }}
            footerNote="Need help? Reply to this email and we’ll get back to you."
        />
    )
}
