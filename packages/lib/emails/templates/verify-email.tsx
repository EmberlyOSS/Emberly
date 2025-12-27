import type { ReactElement } from 'react'

import { BasicEmail } from './basic'

export type VerifyEmailEmailProps = {
    verifyUrl: string
    verificationCode?: string
    expiresMinutes?: number
    userName?: string
}

export function VerifyEmailEmail({ verifyUrl, verificationCode, expiresMinutes = 60, userName = 'there' }: VerifyEmailEmailProps): ReactElement {
    const bodyParts = verificationCode
        ? [
            'Welcome to Emberly! Use the code below to verify your email address.',
            `Your verification code is: **${verificationCode}**`,
            `This code expires in ${expiresMinutes} minute${expiresMinutes === 1 ? '' : 's'}.`,
            'If you didn\'t create an account with Emberly, you can safely ignore this email.',
        ]
        : [
            'Welcome to Emberly! Click the button below to verify your email address and complete your registration.',
            `This link expires in ${expiresMinutes} minute${expiresMinutes === 1 ? '' : 's'}.`,
            'If you didn\'t create an account with Emberly, you can safely ignore this email.',
        ]

    return (
        <BasicEmail
            title="Verify your email"
            preheader={verificationCode ? `Your verification code is: ${verificationCode}` : 'Please verify your email address to complete your registration.'}
            headline={`Hi ${userName}, please verify your email`}
            body={bodyParts}
            cta={verificationCode ? undefined : { label: 'Verify Email Address', href: verifyUrl }}
            footerNote="Sent from Emberly · embrly.ca"
        />
    )
}
