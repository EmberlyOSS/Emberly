import type { ReactElement } from 'react'

export type BasicEmailProps = {
    title: string
    preheader?: string
    headline?: string
    body?: string[]
    children?: React.ReactNode
    cta?: {
        label: string
        href: string
    }
    footerNote?: string
}

// Emberly brand colors - Modern gradient approach
const COLORS = {
    // Primary
    ember: '#F97316',           // Main accent (orange)
    emberLight: '#FB923C',      // Lighter orange for gradients
    emberDark: '#EA580C',       // Darker orange for hover states

    // Backgrounds
    bgDark: '#0A0A0B',          // Very dark background
    bgCard: '#141416',          // Card background
    bgCardAlt: '#1A1A1D',       // Slightly lighter card

    // Text
    textPrimary: '#FAFAFA',     // Bright white for headings
    textSecondary: '#A1A1AA',   // Muted gray for body
    textMuted: '#71717A',       // Even more muted

    // Borders & accents
    border: '#27272A',          // Subtle border
    borderLight: '#3F3F46',     // Lighter border for hover

    // Gradients
    gradientStart: '#F97316',
    gradientEnd: '#F59E0B',
}

export function BasicEmail({
    title,
    preheader,
    headline,
    body,
    children,
    cta,
    footerNote,
}: BasicEmailProps): ReactElement {
    return (
        <div style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            backgroundColor: COLORS.bgDark,
            margin: 0,
            padding: 0,
            width: '100%',
            minHeight: '100%',
        }}>
            {/* Preheader for email clients */}
            {preheader && (
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
                    {preheader}
                </div>
            )}

            {/* Main container */}
            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{
                backgroundColor: COLORS.bgDark,
            }}>
                <tbody>
                    <tr>
                        <td align="center" style={{ padding: '40px 20px' }}>
                            {/* Email card */}
                            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{
                                maxWidth: '560px',
                                backgroundColor: COLORS.bgCard,
                                borderRadius: '16px',
                                border: `1px solid ${COLORS.border}`,
                                overflow: 'hidden',
                            }}>
                                <tbody>
                                    {/* Header with improved layout */}
                                    <tr>
                                        <td style={{
                                            padding: '40px 40px 32px',
                                            borderBottom: `1px solid ${COLORS.border}`,
                                            background: `linear-gradient(to bottom, ${COLORS.bgCardAlt}, ${COLORS.bgCard})`
                                        }}>
                                            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                                                <tbody>
                                                    <tr>
                                                        <td>
                                                             {/* Emberly Logo/Brand */}
                                                             <table role="presentation" cellPadding="0" cellSpacing="0">
                                                                <tbody>
                                                                    <tr>
                                                                        <td style={{
                                                                            width: '24px',
                                                                            height: '24px',
                                                                        }}>
                                                                            <img
                                                                                src={`${process.env.NEXT_PUBLIC_APP_URL || 'https://emberly.site'}/icon.svg`}
                                                                                width="24"
                                                                                height="24"
                                                                                alt="Emberly"
                                                                                style={{ display: 'block', borderRadius: '4px' }}
                                                                            />
                                                                        </td>
                                                                        <td style={{
                                                                            paddingLeft: '12px',
                                                                            fontSize: '22px',
                                                                            fontWeight: 700,
                                                                            color: COLORS.textPrimary,
                                                                            letterSpacing: '-0.5px',
                                                                            fontFamily: '"Outfit", sans-serif',
                                                                        }}>
                                                                            Emberly
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ height: '32px' }} />
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            <h1 style={{
                                                                margin: 0,
                                                                fontSize: '32px',
                                                                fontWeight: 700,
                                                                color: COLORS.textPrimary,
                                                                lineHeight: '40px',
                                                                letterSpacing: '-1px',
                                                                fontFamily: '"Outfit", sans-serif',
                                                            }}>
                                                                {headline || title}
                                                            </h1>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>

                                    {/* Body content */}
                                    <tr>
                                        <td style={{ padding: '32px 40px', fontSize: '15px', lineHeight: '26px', color: COLORS.textSecondary }}>
                                            {children ? children : body?.map((paragraph, idx) => (
                                                <p key={idx} style={{
                                                    margin: idx === body.length - 1 ? 0 : '0 0 16px',
                                                }}>
                                                    {paragraph}
                                                </p>
                                            ))}

                                            {/* CTA Button */}
                                            {cta && (
                                                <table role="presentation" cellPadding="0" cellSpacing="0" style={{ marginTop: '28px' }}>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{
                                                                backgroundColor: COLORS.ember,
                                                                borderRadius: '10px',
                                                            }}>
                                                                <a href={cta.href} style={{
                                                                    display: 'inline-block',
                                                                    padding: '14px 28px',
                                                                    fontSize: '14px',
                                                                    fontWeight: 600,
                                                                    color: '#ffffff',
                                                                    textDecoration: 'none',
                                                                    letterSpacing: '-0.2px',
                                                                }}>
                                                                    {cta.label}
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            )}
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
                                                {footerNote || (
                                                    <>
                                                        Sent from{' '}
                                                        <a href="https://embrly.ca" style={{
                                                            color: COLORS.ember,
                                                            textDecoration: 'none',
                                                        }}>
                                                            Emberly
                                                        </a>
                                                        {' · '}Secure file hosting
                                                    </>
                                                )}
                                            </p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Bottom spacing and copyright */}
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
