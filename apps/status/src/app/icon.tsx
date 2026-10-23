import { ImageResponse } from 'next/og';
import { BRAND_COLORS, BrandIcon } from '@/lib/brand';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: BRAND_COLORS.ink,
                borderRadius: 6,
            }}
        >
            <BrandIcon size={26} detail="compact" />
        </div>,
        { ...size }
    );
}