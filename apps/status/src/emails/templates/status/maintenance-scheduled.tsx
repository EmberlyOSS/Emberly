import EmailLayout from '@/components/static/EmailLayout';
import type { EmailTemplateProps } from '../../template';

type Props = EmailTemplateProps['statusMaintenanceScheduled'];

export default function StatusMaintenanceScheduledEmail({ title, scheduledAt, statusUrl, unsubscribeUrl }: Props) {
    return (
        <EmailLayout preview={`Maintenance scheduled: ${title}`}>
            <div
                style={{
                    display: 'inline-block',
                    background: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: 6,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase' as const,
                    color: '#60a5fa',
                    marginBottom: 14,
                }}
            >
                Maintenance
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
                {title}
            </h1>
            <div
                style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    margin: '0 0 20px 0',
                }}
            >
                <p style={{ fontSize: 12, color: '#78716c', margin: '0 0 2px 0', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600 }}>
                    Scheduled for
                </p>
                <p style={{ fontSize: 14, color: '#e7e5e4', margin: 0, fontWeight: 500 }}>
                    {scheduledAt}
                </p>
            </div>
            <p style={{ fontSize: 14, color: '#a8a29e', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                Some services may be temporarily unavailable during this maintenance window. We&apos;ll
                send an update when the work is complete.
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
