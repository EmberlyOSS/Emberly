import { ImageResponse } from 'next/og';
import { BRAND_COLORS, BRAND_MARK_ASPECT, BrandMark } from '@/lib/brand';
import { STATUS_HOST } from '@/lib/site';

export const runtime = 'edge';
export const alt = 'Emberly Status';
export const size = { width: 1200, height: 600 };
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        <div
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: BRAND_COLORS.ink,
                padding: '60px 80px',
                position: 'relative',
            }}
        >
            {/* Grid */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', zIndex: 10, maxWidth: '65%' }}>
                <div style={{ fontSize: 14, color: '#78716c', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 24 }}>
                    Emberly
                </div>
                <div style={{ fontSize: 60, fontWeight: 700, color: '#ffffff', margin: 0, marginBottom: 16, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                    Status Page
                </div>
                <div style={{ fontSize: 22, color: '#78716c', margin: 0, marginBottom: 36 }}>
                    Incidents, Maintenance &amp; Uptime Monitoring
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {['Uptime', 'Incidents', 'Maintenance'].map((f) => (
                        <div
                            key={f}
                            style={{
                                padding: '8px 18px',
                                borderRadius: 9999,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#a8a29e',
                                fontSize: 16,
                            }}
                        >
                            {f}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right - logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 180,
                        height: 180,
                        borderRadius: 36,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <BrandMark size={120 / BRAND_MARK_ASPECT} detail="full" flapColor={BRAND_COLORS.ink} />
                </div>
            </div>

            {/* Footer */}
            <div style={{ position: 'absolute', bottom: 40, left: 80, color: '#57534e', fontSize: 16, zIndex: 10 }}>
                {STATUS_HOST}
            </div>
            <div style={{ position: 'absolute', bottom: 40, right: 80, color: '#57534e', fontSize: 16, zIndex: 10 }}>
                @TryEmberly
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