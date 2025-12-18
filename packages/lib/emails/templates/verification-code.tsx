import type { ReactElement } from 'react'

import { BasicEmail } from './basic'

export type VerificationCodeEmailProps = {
    code: string
    expiresMinutes?: number
    action?: string
}

export function VerificationCodeEmail({ code, expiresMinutes = 10, action = 'verify your request' }: VerificationCodeEmailProps): ReactElement {
    return (
        <BasicEmail
            title="Your verification code"
            preheader={`Use this code to ${action}.`}
            headline="Verification code"
            body={[
                `Use the code below to ${action}.`,
                `Code: ${code}`,
                `This code expires in ${expiresMinutes} minute${expiresMinutes === 1 ? '' : 's'}. If you didn't request this, you can ignore this email.`,
            ]}
            footerNote="Sent from Emberly · embrly.ca"
        />
    )
}
