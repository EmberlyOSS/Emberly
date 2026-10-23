import { ImageResponse } from 'next/og';
import { BRAND_COLORS, BRAND_MARK_ASPECT, BrandMark } from '@/lib/brand';
import { STATUS_HOST } from '@/lib/site';

export const runtime = 'edge';
export const alt = 'Emberly Status';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        <div
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: BRAND_COLORS.ink,
                position: 'relative',
            }}
        >
            {/* Grid */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Content */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 10,
                    padding: '0 80px',
                    textAlign: 'center',
                }}
            >
                {/* Logo */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 100,
                        height: 100,
                        borderRadius: 20,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        marginBottom: 32,
                    }}
                >
                    <BrandMark size={64 / BRAND_MARK_ASPECT} detail="full" flapColor={BRAND_COLORS.ink} />
                </div>

                {/* Title */}
                <div style={{ fontSize: 80, fontWeight: 700, color: '#ffffff', margin: 0, marginBottom: 12, letterSpacing: '-2px', lineHeight: 1 }}>
                    Emberly Status
                </div>

                {/* Subtitle */}
                <div style={{ fontSize: 26, color: '#78716c', margin: 0, marginBottom: 48 }}>
                    Real-time service health &amp; incident tracking
                </div>

                {/* Pills */}
                <div style={{ display: 'flex', gap: 12 }}>
                    {['Uptime Monitoring', 'Incident Tracking', 'Maintenance Schedules'].map((f) => (
                        <div
                            key={f}
                            style={{
                                padding: '10px 22px',
                                borderRadius: 9999,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#a8a29e',
                                fontSize: 18,
                            }}
                        >
                            {f}
                        </div>
                    ))}
                </div>
            </div>

            {/* URL footer */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 40,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    color: '#57534e',
                    fontSize: 18,
                }}
            >
{STATUS_HOST}
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