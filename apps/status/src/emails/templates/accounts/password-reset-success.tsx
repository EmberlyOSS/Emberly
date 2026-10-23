import EmailLayout from '@/components/static/EmailLayout';
import type { EmailTemplateProps } from '../../template';

type Props = EmailTemplateProps['passwordResetSuccess'];

export default function PasswordResetSuccessEmail({ email }: Props) {
    return (
        <EmailLayout preview="Your password has been updated">
            <div
                style={{
                    display: 'inline-block',
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 6,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase' as const,
                    color: '#4ade80',
                    marginBottom: 14,
                }}
            >
                Password updated
            </div>
            <h1
                style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#ffffff',
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.02em',
                }}
            >
                Password changed successfully
            </h1>
            <p style={{ fontSize: 14, color: '#a8a29e', margin: '0 0 8px 0', lineHeight: '1.6' }}>
                The password for <strong style={{ color: '#e7e5e4' }}>{email}</strong> was successfully updated.
            </p>
            <p style={{ fontSize: 12, color: '#57534e', margin: '0' }}>
                If you did not make this change, contact us on{' '}
                <a href="https://discord.gg/36spBmzZVB" style={{ color: '#78716c' }}>Discord</a>{' '}
                immediately.
            </p>
        </EmailLayout>
    );
}
