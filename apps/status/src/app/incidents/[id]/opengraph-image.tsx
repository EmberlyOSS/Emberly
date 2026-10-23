import { ImageResponse } from 'next/og';
import { BRAND_COLORS, BRAND_MARK_ASPECT, BrandMark } from '@/lib/brand';
import { prisma } from '@/lib/prisma';
import { STATUS_HOST } from '@/lib/site';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type IncidentStatus = 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';

const STATUS_COLORS: Record<IncidentStatus, { dot: string; label: string }> = {
    INVESTIGATING: { dot: '#ef4444', label: 'Investigating' },
    IDENTIFIED:    { dot: '#facc15', label: 'Identified' },
    MONITORING:    { dot: BRAND_COLORS.flame, label: 'Monitoring' },
    RESOLVED:      { dot: '#22c55e', label: 'Resolved' },
};

function formatDate(date: Date) {
    return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const incident = await prisma.incident.findUnique({
        where: { id },
        select: { name: true, status: true, startedAt: true, resolvedAt: true, impact: true },
    });

    const status = (incident?.status ?? 'INVESTIGATING') as IncidentStatus;
    const cfg = STATUS_COLORS[status] ?? STATUS_COLORS.INVESTIGATING;
    const name = incident?.name ?? 'Incident';
    const started = incident ? formatDate(incident.startedAt) : '';
    const resolved = status === 'RESOLVED' && incident?.resolvedAt ? `Resolved ${formatDate(incident.resolvedAt)}` : null;

    return new ImageResponse(
        <div
            style={{
                height: '100%', width: '100%',
                display: 'flex', flexDirection: 'column',
                background: BRAND_COLORS.ink, position: 'relative',
                padding: '60px 80px',
            }}
        >
            {/* Grid */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
            }} />

            {/* Top: brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, zIndex: 10, marginBottom: 'auto' }}>
                <BrandMark size={28 / BRAND_MARK_ASPECT} detail="full" flapColor={BRAND_COLORS.ink} />
                <span style={{ fontSize: 16, color: '#78716c', letterSpacing: '2px', textTransform: 'uppercase' }}>Emberly Status</span>
            </div>

            {/* Center: content */}
            <div style={{ display: 'flex', flexDirection: 'column', zIndex: 10, flex: 1, justifyContent: 'center' }}>
                {/* Label */}
                <div style={{ fontSize: 14, color: '#78716c', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>
                    Incident
                </div>

                {/* Status badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 20, color: '#a8a29e', fontWeight: 500 }}>{cfg.label}</span>
                </div>

                {/* Incident name */}
                <div style={{
                    fontSize: name.length > 50 ? 44 : name.length > 30 ? 54 : 64,
                    fontWeight: 700, color: '#ffffff',
                    letterSpacing: '-1.5px', lineHeight: 1.1,
                    marginBottom: 28,
                }}>
                    {name}
                </div>

                {/* Dates */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {started && (
                        <span style={{ fontSize: 18, color: '#57534e' }}>Started {started}</span>
                    )}
                    {resolved && (
                        <span style={{ fontSize: 18, color: '#57534e' }}>{resolved}</span>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
                <span style={{ fontSize: 16, color: '#44403c' }}>{STATUS_HOST}/incidents</span>
                <span style={{ fontSize: 16, color: '#44403c' }}>@TryEmberly</span>
            </div>
            {/* Brand stripe */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, display: 'flex' }}>
                {[BRAND_COLORS.glow, BRAND_COLORS.amber, BRAND_COLORS.flame, BRAND_COLORS.ember].map((color) => (
                    <div key={color} style={{ flex: 1, background: color }} />
                ))}
            </div>
        </div>,
        { ...size }
    );
}
