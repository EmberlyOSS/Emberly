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
            preheader="Your account is ready. Let's get started."
            headline={`Welcome aboard, ${name}!`}
        >
            <div style={{ marginBottom: '8px' }}>
                <p style={{ margin: '0 0 24px' }}>
                    Thanks for joining us! We're thrilled to have you on board.
                </p>
                <p style={{ margin: '0 0 32px' }}>
                    We've set up your dashboard so you can start uploading files, creating short links, and managing your content right away. Here's what you can do next:
                </p>

                {/* Feature List */}
                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '32px' }}>
                    <tbody>
                        <tr>
                            <td width="24" valign="top" style={{ paddingTop: '4px' }}>🚀</td>
                            <td style={{ paddingLeft: '16px', paddingBottom: '16px' }}>
                                <p style={{ margin: 0, fontWeight: 600, color: '#FAFAFA' }}>Upload Files</p>
                                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#A1A1AA' }}>Securely host your files with customizable expiration.</p>
                            </td>
                        </tr>
                        <tr>
                            <td width="24" valign="top" style={{ paddingTop: '4px' }}>🔗</td>
                            <td style={{ paddingLeft: '16px', paddingBottom: '16px' }}>
                                <p style={{ margin: 0, fontWeight: 600, color: '#FAFAFA' }}>Shorten Links</p>
                                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#A1A1AA' }}>Create branded short links with analytics.</p>
                            </td>
                        </tr>
                        <tr>
                            <td width="24" valign="top" style={{ paddingTop: '4px' }}>🎨</td>
                            <td style={{ paddingLeft: '16px' }}>
                                <p style={{ margin: 0, fontWeight: 600, color: '#FAFAFA' }}>Customize Profile</p>
                                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#A1A1AA' }}>Make your public profile truly yours.</p>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px' }}>
                    <tbody>
                        <tr>
                            <td align="center">
                                <a href={dashboardUrl} style={{
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
                                    Go to Dashboard
                                </a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </BasicEmail>
    )
}
