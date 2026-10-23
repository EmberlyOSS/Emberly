import EmailLayout from '@/components/static/EmailLayout';
import type { EmailTemplateProps } from '../../template';

type Props = EmailTemplateProps['verification'];

export default function VerificationEmail({ email, token }: Props) {
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    return (
        <EmailLayout preview="Verify your email address">
            <h1
                style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#ffffff',
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.02em',
                }}
            >
                Confirm your email
            </h1>
            <p style={{ fontSize: 14, color: '#a8a29e', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                Confirm your email address (<strong style={{ color: '#e7e5e4' }}>{email}</strong>) to finish setting up
                your Emberly admin account.
            </p>
            <a
                href={verifyUrl}
                style={{
                    display: 'inline-block',
                    background: '#ffffff',
                    color: '#0c0a09',
                    padding: '10px 22px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 13,
                    letterSpacing: '-0.01em',
                }}
            >
                Verify email
            </a>

            {/* Fallback URL block */}
            <div
                style={{
                    marginTop: 24,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: '12px 14px',
                }}
            >
                <p style={{ fontSize: 11, color: '#57534e', margin: '0 0 8px 0', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                    Fallback link
                </p>
                <p style={{ fontSize: 11, color: '#78716c', margin: '0 0 6px 0', wordBreak: 'break-all' }}>
                    {verifyUrl}
                </p>
                <p style={{ fontSize: 11, color: '#57534e', margin: '6px 0 2px 0' }}>Token</p>
                <p style={{ fontSize: 11, color: '#78716c', margin: '0', fontFamily: 'monospace', wordBreak: 'break-all' }}>{token}</p>
            </div>

            <p style={{ fontSize: 12, color: '#57534e', margin: '16px 0 0 0' }}>
                If you didn&apos;t request this, you can safely ignore this email.
            </p>
        </EmailLayout>
    );
}
