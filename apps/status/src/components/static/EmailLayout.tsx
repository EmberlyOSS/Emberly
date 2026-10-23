import type React from 'react';
import { SITE, STATUS_HOST } from '@/lib/site';

type Props = {
    children: React.ReactNode;
    preview?: string;
};

const BORDER = '1px solid #292524';

export default function EmailLayout({ children, preview }: Props) {
    return (
        <html lang="en">
            <head>
                <meta name="color-scheme" content="dark" />
                <meta name="supported-color-schemes" content="dark" />
            </head>
            <body
                style={{
                    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    backgroundColor: '#0c0a09',
                    margin: 0,
                    padding: '40px 16px',
                }}
            >
                {preview ? (
                    <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden', opacity: 0 }}>
                        {preview}
                    </div>
                ) : null}

                <div
                    style={{
                        maxWidth: 560,
                        margin: '0 auto',
                        backgroundColor: '#1c1917',
                        border: BORDER,
                        borderRadius: 12,
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: '20px 28px',
                            borderBottom: BORDER,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <img
                            src={`${SITE.statusUrl}/logo.png`}
                            alt="Emberly"
                            width={28}
                            height={28}
                            style={{ borderRadius: 6 }}
                        />
                        <span
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#ffffff',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Emberly
                        </span>
                        <span
                            style={{
                                marginLeft: 'auto',
                                fontSize: 10,
                                fontWeight: 500,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: '#57534e',
                            }}
                        >
                            Status
                        </span>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '28px 28px 24px' }}>
                        {children}
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            padding: '16px 28px',
                            borderTop: BORDER,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span style={{ fontSize: 11, color: '#57534e' }}>
                            © {new Date().getFullYear()} Emberly
                        </span>
                        <a
                            href={SITE.statusUrl}
                            style={{ fontSize: 11, color: '#57534e', textDecoration: 'none' }}
                        >
                            {STATUS_HOST}
                        </a>
                    </div>
                </div>
            </body>
        </html>
    );
}
