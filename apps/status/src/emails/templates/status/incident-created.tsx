import EmailLayout from '@/components/static/EmailLayout';
import type { EmailTemplateProps } from '../../template';

type Props = EmailTemplateProps['statusIncidentCreated'];

const impactStyles: Record<string, { bg: string; color: string }> = {
    critical: { bg: 'rgba(220,38,38,0.15)', color: '#f87171' },
    major:    { bg: 'rgba(234,88,12,0.15)', color: '#fb923c' },
    minor:    { bg: 'rgba(202,138,4,0.15)',  color: '#facc15' },
    none:     { bg: 'rgba(255,255,255,0.06)', color: '#a8a29e' },
};

export default function StatusIncidentCreatedEmail({ incidentName, impact, statusUrl, unsubscribeUrl }: Props) {
    const style = impactStyles[impact.toLowerCase()] ?? impactStyles.none;
    return (
        <EmailLayout preview={`Incident: ${incidentName}`}>
            <div
                style={{
                    display: 'inline-block',
                    background: style.bg,
                    border: `1px solid ${style.color}33`,
                    borderRadius: 6,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase' as const,
                    color: style.color,
                    marginBottom: 14,
                }}
            >
                {impact} impact
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
                We are aware of this issue and our team is investigating. We will provide updates as more
                information becomes available.
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
