import EmailLayout from '@/components/static/EmailLayout';
import type { EmailTemplateProps } from '../../template';

type Props = EmailTemplateProps['statusMaintenanceUpdated'];

export default function StatusMaintenanceUpdatedEmail({ title, updateMessage, statusUrl, unsubscribeUrl }: Props) {
    return (
        <EmailLayout preview={`Maintenance update: ${title}`}>
            <div
                style={{
                    display: 'inline-block',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase' as const,
                    color: '#a8a29e',
                    marginBottom: 14,
                }}
            >
                Maintenance update
            </div>
            <h1
                style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#ffffff',
                    margin: '0 0 12px 0',
                    letterSpacing: '-0.02em',
                }}
            >
                {title}
            </h1>
            <div
                style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: '14px 16px',
                    fontSize: 14,
                    color: '#a8a29e',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap' as const,
                    margin: '0 0 20px 0',
                }}
            >
                {updateMessage}
            </div>
            <a
                href={statusUrl}
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
                View maintenance
            </a>
            <p style={{ fontSize: 12, color: '#57534e', margin: '20px 0 0 0' }}>
                <a href={unsubscribeUrl} style={{ color: '#57534e', textDecoration: 'underline' }}>
                    Unsubscribe from status alerts
                </a>
            </p>
        </EmailLayout>
    );
}
