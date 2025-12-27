import type { ReactElement } from 'react'

export type VerificationCodeEmailProps = {
    code: string
    expiresMinutes?: number
    action?: string
    userName?: string
}

// Colors matching BasicEmail
const COLORS = {
    ember: '#F97316',
    bgDark: '#0A0A0B',
    bgCard: '#141416',
    bgCodeBox: '#1A1A1D',
    textPrimary: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    border: '#27272A',
}

export function VerificationCodeEmail({ code, expiresMinutes = 10, action = 'verify your request', userName }: VerificationCodeEmailProps): ReactElement {
    const greeting = userName ? `Hi ${userName},` : 'Hi there,'

    return (
        <div style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            backgroundColor: COLORS.bgDark,
            margin: 0,
            padding: 0,
            width: '100%',
        }}>
            {/* Preheader */}
            <div style={{
                display: 'none',
                fontSize: '1px',
                color: COLORS.bgDark,
                lineHeight: '1px',
                maxHeight: 0,
                maxWidth: 0,
                opacity: 0,
                overflow: 'hidden',
            }}>
                Your verification code is {code}
            </div>

            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{
                backgroundColor: COLORS.bgDark,
            }}>
                <tbody>
                    <tr>
                        <td align="center" style={{ padding: '40px 20px' }}>
                            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{
                                maxWidth: '560px',
                                backgroundColor: COLORS.bgCard,
                                borderRadius: '16px',
                                border: `1px solid ${COLORS.border}`,
                                overflow: 'hidden',
                            }}>
                                <tbody>
                                    {/* Header */}
                                    <tr>
                                        <td style={{
                                            padding: '32px 40px 24px',
                                            borderBottom: `1px solid ${COLORS.border}`,
                                        }}>
                                            <table role="presentation" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td style={{ paddingBottom: '24px' }}>
                                                            <table role="presentation" cellPadding="0" cellSpacing="0">
                                                                <tbody>
                                                                    <tr>
                                                                        <td style={{
                                                                            width: '10px',
                                                                            height: '10px',
                                                                            backgroundColor: COLORS.ember,
                                                                            borderRadius: '3px',
                                                                        }} />
                                                                        <td style={{
                                                                            paddingLeft: '10px',
                                                                            fontSize: '20px',
                                                                            fontWeight: 700,
                                                                            color: COLORS.textPrimary,
                                                                            letterSpacing: '-0.5px',
                                                                        }}>
                                                                            Emberly
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <h1 style={{
                                                margin: 0,
                                                fontSize: '28px',
                                                fontWeight: 700,
                                                color: COLORS.textPrimary,
                                                lineHeight: '36px',
                                                letterSpacing: '-0.5px',
                                            }}>
                                                Verification Code
                                            </h1>
                                        </td>
                                    </tr>

                                    {/* Body */}
                                    <tr>
                                        <td style={{ padding: '32px 40px' }}>
                                            <p style={{
                                                margin: '0 0 24px',
                                                fontSize: '15px',
                                                lineHeight: '26px',
                                                color: COLORS.textSecondary,
                                            }}>
                                                {greeting} Use the code below to {action}:
                                            </p>

                                            {/* Code Box */}
                                            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td style={{
                                                            backgroundColor: COLORS.bgCodeBox,
                                                            borderRadius: '12px',
                                                            border: `1px solid ${COLORS.border}`,
                                                            padding: '24px',
                                                            textAlign: 'center',
                                                        }}>
                                                            <span style={{
                                                                fontSize: '36px',
                                                                fontWeight: 700,
                                                                color: COLORS.ember,
                                                                letterSpacing: '8px',
                                                                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                                                            }}>
                                                                {code}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            <p style={{
                                                margin: '24px 0 0',
                                                fontSize: '14px',
                                                lineHeight: '22px',
                                                color: COLORS.textMuted,
                                            }}>
                                                This code expires in {expiresMinutes} minute{expiresMinutes === 1 ? '' : 's'}. If you didn't request this, you can safely ignore this email.
                                            </p>
                                        </td>
                                    </tr>

                                    {/* Footer */}
                                    <tr>
                                        <td style={{
                                            padding: '24px 40px',
                                            borderTop: `1px solid ${COLORS.border}`,
                                        }}>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '13px',
                                                lineHeight: '20px',
                                                color: COLORS.textMuted,
                                            }}>
                                                Sent from{' '}
                                                <a href="https://embrly.ca" style={{
                                                    color: COLORS.ember,
                                                    textDecoration: 'none',
                                                }}>
                                                    Emberly
                                                </a>
                                                {' · '}Secure file hosting
                                            </p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{
                                maxWidth: '560px',
                                marginTop: '24px',
                            }}>
                                <tbody>
                                    <tr>
                                        <td align="center">
                                            <p style={{
                                                margin: 0,
                                                fontSize: '12px',
                                                color: COLORS.textMuted,
                                            }}>
                                                © {new Date().getFullYear()} Emberly. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
