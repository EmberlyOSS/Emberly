import EmailLayout from '@/components/static/EmailLayout';
import type { EmailTemplateProps } from '../../template';

type Props = EmailTemplateProps['resetPassword'];

export default function ResetPasswordEmail({ email, resetUrl }: Props) {
    return (
        <EmailLayout preview="Reset your Emberly password">
            <h1
                style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#ffffff',
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.02em',
                }}
            >
                Reset your password
            </h1>
            <p style={{ fontSize: 14, color: '#a8a29e', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                We received a request to reset the password for{' '}
                <strong style={{ color: '#e7e5e4' }}>{email}</strong>.
                This link expires in 1 hour.
            </p>
            <a
                href={resetUrl}
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
                Reset password
            </a>
            <p style={{ fontSize: 12, color: '#57534e', margin: '20px 0 0 0' }}>
                If you didn&apos;t request this, you can safely ignore this email.
            </p>
        </EmailLayout>
    );
}
