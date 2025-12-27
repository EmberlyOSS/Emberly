import type { ReactElement } from 'react'

import { BasicEmail } from './basic'

export type VerifyEmailEmailProps = {
    verifyUrl: string
    verificationCode?: string
    expiresMinutes?: number
    userName?: string
}

export function VerifyEmailEmail({ verifyUrl, verificationCode, expiresMinutes = 60, userName = 'there' }: VerifyEmailEmailProps): ReactElement {
    return (
        <BasicEmail
            title="Verify your email"
            preheader={verificationCode ? `Your verification code is: ${verificationCode}` : 'Please verify your email address to complete your registration.'}
            headline="Verify your email"
        >
            <div style={{ marginBottom: '8px' }}>
                <p style={{ margin: '0 0 24px' }}>
                    Hi {userName},
                </p>
                <p style={{ margin: '0 0 24px' }}>
                    Welcome to Emberly! Please verify your email address to complete your registration.
                    {verificationCode && ' Use the code below:'}
                </p>

                {verificationCode ? (
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '32px',
                        textAlign: 'center'
                    }}>
                         <p style={{
                             margin: '0',
                             fontSize: '32px',
                             fontWeight: 700,
                             letterSpacing: '8px',
                             fontFamily: 'monospace',
                             color: '#FAFAFA'
                         }}>
                            {verificationCode}
                         </p>
                         <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Verification Code
                         </p>
                    </div>
                ) : (
                    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '32px' }}>
                        <tbody>
                            <tr>
                                <td align="center">
                                    <a href={verifyUrl} style={{
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
                                        Verify Email Address
                                    </a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}

                <p style={{ margin: '0', fontSize: '13px', color: '#71717A', textAlign: 'center' }}>
                    This {verificationCode ? 'code' : 'link'} expires in <b>{expiresMinutes} minute{expiresMinutes === 1 ? '' : 's'}</b>. If you didn't create an account, you can ignore this email.
                </p>
            </div>
        </BasicEmail>
    )
}
