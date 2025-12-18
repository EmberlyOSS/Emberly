import type { ReactElement } from 'react'

export type BasicEmailProps = {
    title: string
    preheader?: string
    headline?: string
    body: string[]
    cta?: {
        label: string
        href: string
    }
    footerNote?: string
}

const containerStyle = {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    backgroundColor: '#f5f5f5',
    padding: '24px',
}

const cardStyle = {
    maxWidth: '640px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    overflow: 'hidden',
}

const headerStyle = {
    padding: '24px 24px 12px',
    borderBottom: '1px solid #f1f5f9',
}

const headlineStyle = {
    fontSize: '24px',
    lineHeight: '30px',
    color: '#0f172a',
    margin: '0 0 12px',
}

const bodyStyle = {
    padding: '0 24px 24px',
    color: '#334155',
    fontSize: '15px',
    lineHeight: '22px',
}

const ctaWrapperStyle = {
    padding: '0 24px 24px',
}

const ctaStyle = {
    display: 'inline-block',
    padding: '12px 18px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '10px',
    fontWeight: 600,
}

const footerStyle = {
    padding: '12px 24px 24px',
    color: '#94a3b8',
    fontSize: '12px',
    lineHeight: '18px',
}

export function BasicEmail({
    title,
    preheader,
    headline,
    body,
    cta,
    footerNote,
}: BasicEmailProps): ReactElement {
    return (
        <div style={containerStyle}>
            {preheader ? (
                <div
                    style={{
                        display: 'none',
                        fontSize: '1px',
                        color: '#ffffff',
                        lineHeight: '1px',
                        maxHeight: '0',
                        maxWidth: '0',
                        opacity: 0,
                        overflow: 'hidden',
                    }}
                >
                    {preheader}
                </div>
            ) : null}
            <div style={cardStyle}>
                <div style={headerStyle}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                        Emberly
                    </div>
                    <h1 style={headlineStyle}>{headline || title}</h1>
                </div>
                <div style={bodyStyle}>
                    {body.map((paragraph, idx) => (
                        <p key={idx} style={{ margin: '0 0 12px' }}>
                            {paragraph}
                        </p>
                    ))}
                </div>
                {cta ? (
                    <div style={ctaWrapperStyle}>
                        <a style={ctaStyle} href={cta.href}>
                            {cta.label}
                        </a>
                    </div>
                ) : null}
                {footerNote ? (
                    <div style={footerStyle}>{footerNote}</div>
                ) : (
                    <div style={footerStyle}>Sent from Emberly · embrly.ca</div>
                )}
            </div>
        </div>
    )
}
