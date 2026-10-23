import EmailLayout from '@/components/static/EmailLayout';
import type { EmailTemplateProps } from '../../template';

type Props = EmailTemplateProps['welcome'];

export default function WelcomeEmail({ name, email }: Props) {
    return (
        <EmailLayout preview="Welcome to Emberly Status">
            <h1
                style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#ffffff',
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.02em',
                }}
            >
                Welcome{name ? `, ${name}` : ''}
            </h1>
            <p style={{ fontSize: 14, color: '#a8a29e', margin: '0 0 8px 0', lineHeight: '1.6' }}>
                Your Emberly admin account (<strong style={{ color: '#e7e5e4' }}>{email}</strong>) is ready.
                Head to the dashboard to manage status components, incidents, and maintenance windows.
            </p>
            <p style={{ fontSize: 12, color: '#57534e', margin: '16px 0 0 0' }}>
                If you didn&apos;t create this account, contact us on{' '}
                <a href="https://discord.gg/36spBmzZVB" style={{ color: '#78716c' }}>Discord</a>.
            </p>
        </EmailLayout>
    );
}
