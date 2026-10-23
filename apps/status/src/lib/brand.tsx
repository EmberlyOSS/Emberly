// Emberly brand mark. The flame paths match packages/components/shared/icons.tsx
// in the Emberly app; keep the two in sync.
import type { CSSProperties } from 'react';

export const BRAND_COLORS = {
    /** Primary brand orange */
    ember: '#F97316',
    /** Lighter orange for highlights */
    flame: '#FB923C',
    /** Warm yellow accent */
    amber: '#FBBF24',
    /** Soft highlight for glows on dark backgrounds */
    glow: '#FED7AA',
    /** Deep orange for gradients and pressed states */
    deep: '#C2410C',
    /** Page background */
    ink: '#0B0908',
    /** Foreground on dark backgrounds */
    paper: '#F7F3EF',
} as const;

export const BRAND_NAME = 'Emberly';
export const BRAND_TAGLINE = 'Share files. Build together.';

export type BrandMarkDetail = 'full' | 'compact' | 'glyph';

type SvgElement = { d: string; fill: string };

const FLAME_BODY =
    'M 133.6 292.5 C 119 250 140.4 221.3 163.4 194.7 C 185.1 169.8 209.6 141.5 203.2 90.4 C 202.6 86.2 201.7 82.2 200.6 78.3 C 263.3 144.1 190.1 264.2 217 262.7 C 229.3 262 246.4 231.4 244 158.1 C 244 158.1 284.8 212.8 276.5 267.3 C 271.5 300.7 242.2 342.5 188.4 334.5 C 163.9 330.9 140.9 313.9 133.6 292.5';
const FLAME_TONGUE =
    'M 184.2 21.6 C 184.2 21.6 180.7 42 189 72.4 C 197.2 102.4 192.6 125.6 187.9 138.6 C 173.7 177 137.9 193.8 122.2 234.2 C 115.8 250.6 102.5 306.7 164.1 335.5 C 164.1 335.5 114 325.1 97.1 280.5 C 83.4 244.3 95.5 198.6 133.4 157 C 188.7 96.3 157.2 55.5 184.2 21.6';

// The flame occupies x 91–285, y 21–336 of its 375 grid; crop to that with a little air.
export const BRAND_MARK_VIEWBOX = '86 16 204 326';
export const BRAND_MARK_ASPECT = 204 / 326;
export const BRAND_ICON_VIEWBOX = '0 0 375 375';

function flameElements(variant: 'color' | 'mono', monoColor: string, bodyColor: string): SvgElement[] {
    return variant === 'mono'
        ? [
              { d: FLAME_BODY, fill: monoColor },
              { d: FLAME_TONGUE, fill: monoColor },
          ]
        : [
              { d: FLAME_BODY, fill: bodyColor },
              { d: FLAME_TONGUE, fill: BRAND_COLORS.ember },
          ];
}

export function brandMarkSvgElements(
    _detail: BrandMarkDetail,
    {
        variant = 'color',
        monoColor = BRAND_COLORS.ink,
        bodyColor = BRAND_COLORS.paper,
    }: { variant?: 'color' | 'mono'; monoColor?: string; bodyColor?: string } = {},
): SvgElement[] {
    return flameElements(variant, monoColor, bodyColor);
}

function toSvgString(viewBox: string, width: number, height: number, elements: SvgElement[], prefix = '') {
    const paths = elements.map((el) => `<path d="${el.d}" fill="${el.fill}"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${prefix}${paths}</svg>`;
}

/**
 * The flame mark. `size` is its height in pixels.
 * `flapColor` is accepted for compatibility and sets the flame body colour,
 * which should contrast with whatever sits behind it.
 */
export function BrandMark({
    size,
    variant = 'color',
    monoColor = BRAND_COLORS.ink,
    flapColor,
    style,
}: {
    size: number;
    variant?: 'color' | 'mono';
    monoColor?: string;
    flapColor?: string;
    detail?: BrandMarkDetail;
    style?: CSSProperties;
}) {
    // On dark tiles the body stays light; flapColor is only honoured when it isn't the page ink
    const body = flapColor && flapColor !== BRAND_COLORS.ink ? flapColor : BRAND_COLORS.paper;
    const elements = flameElements(variant, monoColor, body);

    return (
        <svg
            width={Math.round(size * BRAND_MARK_ASPECT)}
            height={size}
            viewBox={BRAND_MARK_VIEWBOX}
            xmlns="http://www.w3.org/2000/svg"
            style={style}
            aria-hidden="true"
        >
            {elements.map((props) => (
                <path key={props.d.slice(0, 12)} {...props} />
            ))}
        </svg>
    );
}

export function brandMarkSvgString({
    variant = 'color',
    monoColor = BRAND_COLORS.ink,
}: { detail?: BrandMarkDetail; variant?: 'color' | 'mono'; monoColor?: string; flapColor?: string } = {}) {
    return toSvgString(BRAND_MARK_VIEWBOX, 204 * 2, 326 * 2, flameElements(variant, monoColor, BRAND_COLORS.paper));
}

export function brandIconSvgElements(
    detail: BrandMarkDetail,
    options?: { variant?: 'color' | 'mono'; monoColor?: string },
): SvgElement[] {
    return brandMarkSvgElements(detail, options);
}

/** Square icon: the flame centred in a 375 grid. `size` is the edge length. */
export function BrandIcon({
    size,
    variant = 'color',
    monoColor = BRAND_COLORS.ink,
    style,
}: {
    size: number;
    variant?: 'color' | 'mono';
    monoColor?: string;
    detail?: BrandMarkDetail;
    style?: CSSProperties;
}) {
    const elements = flameElements(variant, monoColor, BRAND_COLORS.paper);
    return (
        <svg
            width={size}
            height={size}
            viewBox={BRAND_ICON_VIEWBOX}
            xmlns="http://www.w3.org/2000/svg"
            style={style}
            aria-hidden="true"
        >
            {elements.map((props) => (
                <path key={props.d.slice(0, 12)} {...props} />
            ))}
        </svg>
    );
}

export function brandIconSvgString({
    variant = 'color',
    monoColor = BRAND_COLORS.ink,
    tile,
}: { detail?: BrandMarkDetail; variant?: 'color' | 'mono'; monoColor?: string; tile?: string } = {}) {
    const elements = flameElements(variant, monoColor, BRAND_COLORS.paper);
    // Flame at ~80% of the tile, inside the safe zone iOS and Android masks keep
    const prefix = tile ? `<rect width="375" height="375" rx="84" fill="${tile}"/>` : '';
    return toSvgString(BRAND_ICON_VIEWBOX, 480, 480, elements, prefix);
}
