import EmailLayout from '@/components/static/EmailLayout';
import type { EmailTemplateProps } from '../../template';

type Props = EmailTemplateProps['statusIncidentResolved'];

export default function StatusIncidentResolvedEmail({ incidentName, statusUrl, unsubscribeUrl }: Props) {
    return (
        <EmailLayout preview={`Resolved: ${incidentName}`}>
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
                Resolved
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
                {incidentName}
            </h1>
            <p style={{ fontSize: 14, color: '#a8a29e', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                This incident has been resolved. All affected services are now operating normally.
                Thank you for your patience.
            </p>
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
                View status page
            </a>
            <p style={{ fontSize: 12, color: '#57534e', margin: '20px 0 0 0' }}>
                <a href={unsubscribeUrl} style={{ color: '#57534e', textDecoration: 'underline' }}>
                    Unsubscribe from status alerts
                </a>
            </p>
        </EmailLayout>
    );
}
