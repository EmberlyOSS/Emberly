import { BRAND_COLORS, BrandMark } from '@/lib/brand';

interface BrandLogoProps {
    /** Height of the flame mark in pixels. */
    size?: number;
    className?: string;
    withBackground?: boolean;
    backgroundClassName?: string;
}

export function BrandLogo({
    size = 32,
    className = '',
    withBackground = false,
    backgroundClassName = 'bg-[#0B0908] border border-white/[0.08]',
}: BrandLogoProps) {
    const logo = (
        <BrandMark
            size={size}
            flapColor={withBackground ? BRAND_COLORS.ink : undefined}
            style={{ display: 'block' }}
        />
    );

    if (withBackground) {
        return (
            <div
                className={`flex items-center justify-center rounded-xl ${backgroundClassName} ${className}`}
                style={{ width: size * 1.4, height: size * 1.4 }}
            >
                {logo}
            </div>
        );
    }

    return (
        <span className={`inline-flex ${className}`} role="img" aria-label="Emberly">
            {logo}
        </span>
    );
}

export function BrandLogoFull({ iconSize = 32, className = '' }: { iconSize?: number; className?: string }) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <BrandLogo size={iconSize} />
            <span className="text-xl font-bold tracking-tight md:text-2xl text-white">
                Emberly
            </span>
        </div>
    );
}

export default BrandLogo;
