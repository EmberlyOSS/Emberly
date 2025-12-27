
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
    return (
        <BasicEmail
            title="New login detected"
            preheader="We noticed a new sign-in to your Emberly account."
            headline="New sign-in detected"
        >
            <div style={{ marginBottom: '24px' }}>
                <p style={{ margin: '0 0 24px' }}>
                    Hi {userName},
                </p>
                <p style={{ margin: '0 0 24px' }}>
                    We noticed a new sign-in to your Emberly account from a device we don't recognize. If this was you, you can safely ignore this email.
                </p>

                {/* Security Alert Card */}
                <div style={{
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px',
                }}>
                    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                        <tbody>
                            <tr>
                                <td width="24" valign="top" style={{ paddingTop: '2px' }}>
                                    {/* Warning Icon emoji as fallback, or SVG if email client supports */}
                                    <span style={{ fontSize: '18px' }}>🛡️</span>
                                </td>
                                <td style={{ paddingLeft: '12px' }}>
                                    <p style={{
                                        margin: '0 0 12px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#F97316', // Ember Orange
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Login Details
                                    </p>
                                    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                                        {time && (
                                            <tr>
                                                <td style={{ paddingBottom: '8px', color: '#A1A1AA', fontSize: '13px', width: '80px' }}>Time</td>
                                                <td style={{ paddingBottom: '8px', color: '#FAFAFA', fontSize: '13px', fontWeight: 500 }}>{time}</td>
                                            </tr>
                                        )}
                                        {location && (
                                            <tr>
                                                <td style={{ paddingBottom: '8px', color: '#A1A1AA', fontSize: '13px' }}>Location</td>
                                                <td style={{ paddingBottom: '8px', color: '#FAFAFA', fontSize: '13px', fontWeight: 500 }}>{location}</td>
                                            </tr>
                                        )}
                                        {ipAddress && (
                                            <tr>
                                                <td style={{ paddingBottom: '8px', color: '#A1A1AA', fontSize: '13px' }}>IP Address</td>
                                                <td style={{ paddingBottom: '8px', color: '#FAFAFA', fontSize: '13px', fontWeight: 500, fontFamily: 'monospace' }}>{ipAddress}</td>
                                            </tr>
                                        )}
                                        {device && (
                                            <tr>
                                                <td style={{ color: '#A1A1AA', fontSize: '13px' }}>Device</td>
                                                <td style={{ color: '#FAFAFA', fontSize: '13px', fontWeight: 500 }}>{device}</td>
                                            </tr>
                                        )}
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p style={{ margin: '0 0 24px' }}>
                    If this wasn't you, your password may be compromised. You should change your password immediately or contact support.
                </p>

                {manageUrl && (
                    <table role="presentation" cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
                        <tbody>
                            <tr>
                                <td align="center">
                                    <a href={manageUrl} style={{
                                        display: 'inline-block',
                                        padding: '14px 32px',
                                        backgroundColor: '#F97316',
                                        color: '#ffffff',
                                        textDecoration: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)'
                                    }}>
                                        Secure My Account
                                    </a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </BasicEmail>
    )
}
