import type { ReactElement } from 'react'

import { BasicEmail } from './basic'

export type PasswordResetEmailProps = {
    resetUrl: string
    expiresMinutes?: number
    userName?: string
}

export function PasswordResetEmail({ resetUrl, expiresMinutes = 30, userName = 'there' }: PasswordResetEmailProps): ReactElement {
    return (
        <BasicEmail
            title="Reset your password"
            preheader="Use this link to reset your Emberly password."
            headline="Reset your password"
        >
            <div style={{ marginBottom: '8px' }}>
                <p style={{ margin: '0 0 24px' }}>
                    Hi {userName},
                </p>
                <p style={{ margin: '0 0 24px' }}>
                    Someone (hopefully you) requested a password reset for your Emberly account. Click the button below to choose a new password.
                </p>

                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '32px' }}>
                    <tbody>
                        <tr>
                            <td align="center">
                                <a href={resetUrl} style={{
                                    display: 'inline-block',
                                    padding: '16px 36px',
                                    backgroundColor: '#F97316',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                    fontSize: '16px',
                                    letterSpacing: '-0.2px',
                                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3), 0 0 0 1px rgba(249, 115, 22, 0.2)'
                                }}>
                                    Reset Password
                                </a>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#A1A1AA', textAlign: 'center' }}>
                    This link will expire in <b>{expiresMinutes} minute{expiresMinutes === 1 ? '' : 's'}</b>.
                </p>

                <p style={{ margin: '0', fontSize: '13px', color: '#71717A', textAlign: 'center' }}>
                    If you did not request this, you can safely ignore this email. Your password will remain unchanged.
                </p>
            </div>
        </BasicEmail>
    )
}
