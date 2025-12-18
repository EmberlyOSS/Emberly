import type { ReactElement } from 'react'

import { BasicEmail } from './basic'

export type PasswordResetEmailProps = {
    resetUrl: string
    expiresMinutes?: number
    userName?: string
}

export function PasswordResetEmail({ resetUrl, expiresMinutes = 30, userName = 'there' }: PasswordResetEmailProps): ReactElement {
    const expiryText = `This link expires in ${expiresMinutes} minute${expiresMinutes === 1 ? '' : 's'}.`
    return (
        <BasicEmail
            title="Reset your password"
            preheader="Use this link to reset your password."
            headline={`Hi ${userName}, reset your password`}
            body={[
                'Someone (hopefully you) requested a password reset.',
                expiryText,
                'If you did not request this, you can safely ignore this email and your password will remain unchanged.',
            ]}
            cta={{ label: 'Reset password', href: resetUrl }}
            footerNote="Sent from Emberly · embrly.ca"
        />
    )
}
