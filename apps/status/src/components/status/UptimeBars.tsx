'use client';

import { useMemo, useState } from 'react';
import { componentTone, formatUptime } from '@/lib/status-ui';
import { buildHistory, computeTimeBasedUptime, type DowntimeIncident, toWindows } from '@/lib/uptime';

interface Check {
    result: string;
    checkedAt: string;
}

interface UptimeBarsProps {
    incidents: DowntimeIncident[];
    count: number;
    unit?: 'day' | 'hour';
    checks?: Check[];
    responsive?: boolean;
    showLegend?: boolean;
    height?: 'sm' | 'md';
}

const DAY_MS = 86_400_000;

function visibility(idx: number, count: number, responsive: boolean) {
    if (!responsive || count < 90) return '';
    if (idx < 30) return 'hidden md:flex';
    if (idx < 60) return 'hidden sm:flex';
    return '';
}

export function UptimeBars({
    incidents,
    count,
    unit = 'day',
    checks,
    responsive = false,
    showLegend = true,
    height = 'md',
}: UptimeBarsProps) {
    const [hover, setHover] = useState<number | null>(null);
    const buckets = useMemo(() => buildHistory(incidents, count, unit), [incidents, count, unit]);

    const failures = useMemo(() => {
        if (!checks?.length) return null;
        return buckets.map((b) => {
            let total = 0;
            let failed = 0;
            for (const c of checks) {
                const t = new Date(c.checkedAt).getTime();
                if (t >= b.start && t < b.end) {
                    total++;
                    if (c.result !== 'UP') failed++;
                }
            }
            return { total, failed };
        });
    }, [buckets, checks]);

    const pctFor = (days: number) => computeTimeBasedUptime(days * DAY_MS, toWindows(incidents));
    const active = hover !== null ? buckets[hover] : null;
    const activeFail = hover !== null && failures ? failures[hover] : null;
    const leftPct = hover !== null ? ((hover + 0.5) / count) * 100 : 0;
    const align = leftPct < 18 ? 'left' : leftPct > 82 ? 'right' : 'center';

    return (
        <div className="relative select-none">
            <ul
                className={`flex items-stretch gap-[2px] ${height === 'sm' ? 'h-7' : 'h-9'}`}
                aria-label="Uptime history"
                onMouseLeave={() => setHover(null)}
            >
                {buckets.map((b, i) => {
                    const tone = b.incidents.length ? componentTone(b.status) : componentTone('OPERATIONAL');
                    return (
                        <li key={b.start} className={`flex min-w-[2px] flex-1 ${visibility(i, count, responsive)}`}>
                            <button
                                type="button"
                                aria-label={`${new Date(b.start).toLocaleDateString('en-GB')}: ${formatUptime(b.uptime)} uptime`}
                                onMouseEnter={() => setHover(i)}
                                onFocus={() => setHover(i)}
                                onBlur={() => setHover(null)}
                                onClick={() => setHover(hover === i ? null : i)}
                                className={`w-full rounded-[2px] transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-white ${tone.bar} ${
                                    hover !== null && hover !== i ? 'opacity-50' : ''
                                }`}
                            />
                        </li>
                    );
                })}
            </ul>

            {active && (
                <div
                    className="pointer-events-none absolute bottom-full z-20 mb-2 w-60 rounded-lg border border-white/10 bg-zinc-900 p-3 text-left shadow-xl shadow-black/50"
                    style={{
                        left: align === 'left' ? 0 : align === 'right' ? undefined : `${leftPct}%`,
                        right: align === 'right' ? 0 : undefined,
                        transform: align === 'center' ? 'translateX(-50%)' : undefined,
                    }}
                    role="tooltip"
                >
                    <p className="text-xs font-medium text-white">
                        {unit === 'day'
                            ? new Date(active.start).toLocaleDateString('en-GB', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                              })
                            : `${new Date(active.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} to ${new Date(active.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                    <p
                        className={`mt-0.5 text-xs tabular-nums ${active.incidents.length ? componentTone(active.status).text : 'text-emerald-400'}`}
                    >
                        {formatUptime(active.uptime)} uptime
                    </p>
                    {active.incidents.length > 0 ? (
                        <ul className="mt-2 space-y-1 border-t border-white/[0.08] pt-2">
                            {active.incidents.slice(0, 3).map((inc) => (
                                <li key={inc.id} className="truncate text-xs text-zinc-300">
                                    {inc.name}
                                </li>
                            ))}
                            {active.incidents.length > 3 && (
                                <li className="text-xs text-zinc-500">+{active.incidents.length - 3} more</li>
                            )}
                        </ul>
                    ) : (
                        <p className="mt-1 text-xs text-zinc-400">No incidents reported</p>
                    )}
                    {activeFail && activeFail.failed > 0 && (
                        <p className="mt-1 text-xs text-zinc-500">
                            {activeFail.failed} of {activeFail.total} checks failed
                        </p>
                    )}
                </div>
            )}

            {showLegend && (
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-zinc-500">
                    {unit === 'hour' ? (
                        <>
                            <span>{count}h ago</span>
                            <span className="tabular-nums text-zinc-400">
                                {formatUptime(computeTimeBasedUptime(count * 3_600_000, toWindows(incidents)))} uptime
                            </span>
                            <span>Now</span>
                        </>
                    ) : responsive && count >= 90 ? (
                        <>
                            <span className="md:hidden">
                                <span className="sm:hidden">30 days ago</span>
                                <span className="hidden sm:inline">60 days ago</span>
                            </span>
                            <span className="hidden md:inline">90 days ago</span>
                            <span className="tabular-nums text-zinc-400">
                                <span className="sm:hidden">{formatUptime(pctFor(30))}</span>
                                <span className="hidden sm:inline md:hidden">{formatUptime(pctFor(60))}</span>
                                <span className="hidden md:inline">{formatUptime(pctFor(90))}</span> uptime
                            </span>
                            <span>Today</span>
                        </>
                    ) : (
                        <>
                            <span>{count} days ago</span>
                            <span className="tabular-nums text-zinc-400">{formatUptime(pctFor(count))} uptime</span>
                            <span>Today</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
