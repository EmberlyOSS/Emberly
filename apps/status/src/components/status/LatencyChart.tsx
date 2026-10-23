'use client';

import { useId, useMemo, useRef, useState } from 'react';

interface Check {
    result: string;
    responseMs: number | null;
    checkedAt: string;
}

interface Point {
    t: number;
    ms: number | null;
    max: number | null;
    failed: boolean;
}

interface LatencyChartProps {
    checks: Check[];
    height?: number;
    maxPoints?: number;
    axis?: boolean;
}

function niceCeil(v: number) {
    if (v <= 0) return 100;
    const pow = 10 ** Math.floor(Math.log10(v));
    const n = v / pow;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * pow;
}

function downsample(checks: Check[], maxPoints: number): Point[] {
    if (!checks.length) return [];
    const first = new Date(checks[0].checkedAt).getTime();
    const last = new Date(checks[checks.length - 1].checkedAt).getTime();
    if (checks.length <= maxPoints || last === first) {
        return checks.map((c) => ({
            t: new Date(c.checkedAt).getTime(),
            ms: c.responseMs,
            max: c.responseMs,
            failed: c.result === 'DOWN',
        }));
    }
    const span = (last - first) / maxPoints;
    const bins: { t: number; sum: number; n: number; max: number | null; failed: boolean }[] = Array.from(
        { length: maxPoints },
        (_, i) => ({ t: first + span * (i + 0.5), sum: 0, n: 0, max: null, failed: false }),
    );
    for (const c of checks) {
        const idx = Math.min(maxPoints - 1, Math.floor((new Date(c.checkedAt).getTime() - first) / span));
        const b = bins[idx];
        if (c.responseMs != null) {
            b.sum += c.responseMs;
            b.n++;
            b.max = Math.max(b.max ?? 0, c.responseMs);
        }
        if (c.result === 'DOWN') b.failed = true;
    }
    return bins.map((b) => ({ t: b.t, ms: b.n ? Math.round(b.sum / b.n) : null, max: b.max, failed: b.failed }));
}

export function LatencyChart({ checks, height = 160, maxPoints = 160, axis = true }: LatencyChartProps) {
    const gradId = useId();
    const ref = useRef<HTMLDivElement>(null);
    const [hover, setHover] = useState<number | null>(null);
    const points = useMemo(() => downsample(checks, maxPoints), [checks, maxPoints]);

    const cap = useMemo(() => {
        const vals = points
            .map((p) => p.ms)
            .filter((v): v is number => v != null)
            .sort((a, b) => a - b);
        if (!vals.length) return 100;
        const p98 = vals[Math.min(vals.length - 1, Math.floor(vals.length * 0.98))];
        return niceCeil(Math.min(vals[vals.length - 1], p98 * 1.2) || 1);
    }, [points]);

    if (!points.some((p) => p.ms != null)) {
        return (
            <div className="flex items-center justify-center text-xs text-zinc-500" style={{ height }}>
                No response data for this period
            </div>
        );
    }

    const W = 1000;
    const H = 100;
    const t0 = points[0].t;
    const t1 = points[points.length - 1].t;
    const x = (t: number) => (t1 === t0 ? W / 2 : ((t - t0) / (t1 - t0)) * W);
    const y = (ms: number) => H - (Math.min(ms, cap) / cap) * (H - 4);

    const segments: string[] = [];
    let seg = '';
    for (const p of points) {
        if (p.ms == null) {
            if (seg) segments.push(seg);
            seg = '';
            continue;
        }
        seg += `${seg ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.ms).toFixed(1)} `;
    }
    if (seg) segments.push(seg);
    const line = segments.join(' ');
    const areas = segments.map((s) => {
        const coords = s.trim().split(/[ML]/).filter(Boolean);
        const firstX = coords[0].split(' ')[0];
        const lastX = coords[coords.length - 1].split(' ')[0];
        return `${s} L${lastX} ${H} L${firstX} ${H} Z`;
    });

    const onMove = (clientX: number) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        const target = t0 + frac * (t1 - t0);
        let best = 0;
        for (let i = 1; i < points.length; i++) {
            if (Math.abs(points[i].t - target) < Math.abs(points[best].t - target)) best = i;
        }
        setHover(best);
    };

    const hp = hover !== null ? points[hover] : null;
    const hx = hp ? (x(hp.t) / W) * 100 : 0;
    const multiDay = t1 - t0 > 36 * 3_600_000;
    const fmtTick = (t: number) =>
        new Date(t).toLocaleString(
            'en-GB',
            multiDay ? { day: 'numeric', month: 'short' } : { hour: '2-digit', minute: '2-digit' },
        );

    return (
        <div>
            <div className="relative" style={{ height }}>
                {axis && (
                    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                        {[1, 0.5, 0].map((f) => (
                            <div
                                key={f}
                                className="absolute inset-x-0 border-t border-dashed border-white/[0.06]"
                                style={{ top: `${(1 - f) * 96 + 4}%` }}
                            >
                                <span className="absolute -top-2 right-0 bg-transparent pl-1 text-[11px] tabular-nums text-zinc-500">
                                    {f === 0 ? '' : `${Math.round(cap * f)}ms`}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                <div
                    ref={ref}
                    role="img"
                    aria-label={`Response time chart, typically under ${cap}ms`}
                    className="absolute inset-0 cursor-crosshair touch-pan-y"
                    onMouseMove={(e) => onMove(e.clientX)}
                    onMouseLeave={() => setHover(null)}
                    onTouchStart={(e) => onMove(e.touches[0].clientX)}
                    onTouchMove={(e) => onMove(e.touches[0].clientX)}
                    onTouchEnd={() => setHover(null)}
                >
                    <svg
                        viewBox={`0 0 ${W} ${H}`}
                        preserveAspectRatio="none"
                        className="h-full w-full overflow-visible"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34d399" stopOpacity="0.22" />
                                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {areas.map((d) => (
                            <path key={d} d={d} fill={`url(#${gradId})`} />
                        ))}
                        <path
                            d={line}
                            fill="none"
                            stroke="#34d399"
                            strokeWidth="1.75"
                            vectorEffect="non-scaling-stroke"
                            strokeLinejoin="round"
                        />
                    </svg>
                    {points.map((p) =>
                        p.failed ? (
                            <span
                                key={`f${p.t}`}
                                className="absolute bottom-0 h-1.5 w-[3px] -translate-x-1/2 rounded-full bg-red-500"
                                style={{ left: `${(x(p.t) / W) * 100}%` }}
                            />
                        ) : p.max != null && p.max > cap ? (
                            <span
                                key={`c${p.t}`}
                                className="absolute top-0 h-1.5 w-[3px] -translate-x-1/2 rounded-full bg-amber-400"
                                style={{ left: `${(x(p.t) / W) * 100}%` }}
                            />
                        ) : null,
                    )}
                    {hp && (
                        <>
                            <span
                                className="pointer-events-none absolute inset-y-0 w-px bg-white/25"
                                style={{ left: `${hx}%` }}
                            />
                            {hp.ms != null && (
                                <span
                                    className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-950 bg-emerald-400"
                                    style={{ left: `${hx}%`, top: `${(y(hp.ms) / H) * 100}%` }}
                                />
                            )}
                            <div
                                className="pointer-events-none absolute -top-2 z-10 whitespace-nowrap rounded-md border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-xs shadow-lg shadow-black/50"
                                style={{
                                    left: `${hx}%`,
                                    transform: `translate(${hx < 15 ? '0' : hx > 85 ? '-100%' : '-50%'}, -100%)`,
                                }}
                            >
                                <span className="font-medium tabular-nums text-white">
                                    {hp.ms != null ? `${hp.ms}ms` : 'No response'}
                                </span>
                                {hp.max != null && hp.ms != null && hp.max > hp.ms && (
                                    <span className="ml-1.5 tabular-nums text-zinc-400">peak {hp.max}ms</span>
                                )}
                                <span className="ml-2 text-zinc-500">
                                    {new Date(hp.t).toLocaleString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {axis && (
                <div className="mt-2 flex justify-between text-[11px] tabular-nums text-zinc-500">
                    <span>{fmtTick(t0)}</span>
                    <span className="hidden sm:inline">{fmtTick(t0 + (t1 - t0) / 2)}</span>
                    <span>{fmtTick(t1)}</span>
                </div>
            )}
        </div>
    );
}
