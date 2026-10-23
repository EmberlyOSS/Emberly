import { ImageResponse } from 'next/og';
import { BRAND_COLORS, BRAND_MARK_ASPECT, BrandMark } from '@/lib/brand';
import { prisma } from '@/lib/prisma';
import { STATUS_HOST } from '@/lib/site';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type MaintenanceStatus = 'NOT_STARTED_YET' | 'IN_PROGRESS' | 'COMPLETED';

const STATUS_COLORS: Record<MaintenanceStatus, { dot: string; label: string }> = {
    NOT_STARTED_YET: { dot: BRAND_COLORS.flame,  label: 'Scheduled' },
    IN_PROGRESS:     { dot: BRAND_COLORS.ember, label: 'In Progress' },
    COMPLETED:       { dot: '#22c55e',         label: 'Completed' },
};

function formatDate(date: Date) {
    return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
}

function duration(start: Date, end: Date) {
    const ms = end.getTime() - start.getTime();
    const mins = Math.floor(ms / 60_000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${mins % 60}m`;
    return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const m = await prisma.scheduledMaintenance.findUnique({
        where: { id },
        select: { name: true, status: true, scheduledStart: true, scheduledEnd: true },
    });

    const status = (m?.status ?? 'NOT_STARTED_YET') as MaintenanceStatus;
    const cfg = STATUS_COLORS[status] ?? STATUS_COLORS.NOT_STARTED_YET;
    const name = m?.name ?? 'Scheduled Maintenance';
    const window = m ? `${formatDate(m.scheduledStart)} → ${formatDate(m.scheduledEnd)}` : '';
    const windowDuration = m ? duration(m.scheduledStart, m.scheduledEnd) : '';

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
                    Scheduled Maintenance
                </div>

                {/* Status badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 20, color: '#a8a29e', fontWeight: 500 }}>{cfg.label}</span>
                </div>

                {/* Maintenance name */}
                <div style={{
                    fontSize: name.length > 50 ? 44 : name.length > 30 ? 54 : 64,
                    fontWeight: 700, color: '#ffffff',
                    letterSpacing: '-1.5px', lineHeight: 1.1,
                    marginBottom: 28,
                }}>
                    {name}
                </div>

                {/* Window */}
                {window && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 18, color: '#57534e' }}>{window}</span>
                        {windowDuration && (
                            <span style={{ fontSize: 16, color: '#44403c' }}>{windowDuration} window</span>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
                <span style={{ fontSize: 16, color: '#44403c' }}>{STATUS_HOST}/maintenances</span>
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
