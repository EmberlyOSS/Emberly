import type { ReactElement } from 'react'

import { BasicEmail } from './basic'

export type MagicLinkEmailProps = {
    signInUrl: string
    expiresMinutes?: number
    userName?: string
}

export function MagicLinkEmail({ signInUrl, expiresMinutes = 15, userName = 'there' }: MagicLinkEmailProps): ReactElement {
    return (
        <BasicEmail
            title="Your sign-in link"
            preheader="Click to sign in to your Emberly account."
            headline="Sign in to Emberly"
        >
            <div style={{ marginBottom: '8px' }}>
                <p style={{ margin: '0 0 24px' }}>
                    Hi {userName},
                </p>
                <p style={{ margin: '0 0 24px' }}>
                    Click the button below to sign in to your account. This magic link will expire in <b>{expiresMinutes} minute{expiresMinutes === 1 ? '' : 's'}</b>.
                </p>
                
                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '32px' }}>
                    <tbody>
                        <tr>
                            <td align="center">
                                <a href={signInUrl} style={{
                                    display: 'inline-block',
                                    padding: '16px 36px',
                                    backgroundColor: '#F97316', // Ember Orange
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                    fontSize: '16px',
                                    letterSpacing: '-0.2px',
                                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3), 0 0 0 1px rgba(249, 115, 22, 0.2)'
                                }}>
                                    Sign in to Emberly
                                </a>
                            </td>
                        </tr>
                    </tbody>
                </table>
                
                <p style={{ margin: '0', fontSize: '13px', color: '#71717A', textAlign: 'center' }}>
                    If you didn't request this link, you can safely ignore this email.
                </p>
            </div>
        </BasicEmail>
    )
}
