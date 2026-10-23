'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { LatencyChart } from '@/components/status/LatencyChart';
import { LocalTime } from '@/components/status/LocalTime';
import {
    BackLink,
    Card,
    EmptyState,
    PageShell,
    RangeTabs,
    SectionTitle,
    Spinner,
    StatTile,
    StatusBadge,
    StatusDot,
} from '@/components/status/Primitives';
import { LocationBadge } from '@/components/status/LocationBadge';
import { UptimeBars } from '@/components/status/UptimeBars';
import { componentTone, formatDuration, formatUptime, impactTone, incidentTone, uptimeTone } from '@/lib/status-ui';
import type { DowntimeIncident } from '@/lib/uptime';

const RANGES = ['24h', '7d', '30d', '90d'] as const;
type Range = (typeof RANGES)[number];

const RANGE_LABEL: Record<Range, string> = { '24h': '24 hours', '7d': '7 days', '30d': '30 days', '90d': '90 days' };
const RANGE_MS: Record<Range, number> = {
    '24h': 86_400_000,
    '7d': 604_800_000,
    '30d': 2_592_000_000,
    '90d': 7_776_000_000,
};

interface Check {
    result: string;
    responseMs: number | null;
    checkedAt: string;
}

interface ComponentIncident {
    id: string;
    name: string;
    status: string;
    impact: string;
    componentStatus: string;
    startedAt: string;
    resolvedAt: string | null;
    updates: { id: string; body: string; status: string; createdAt: string }[];
}

interface ComponentDetail {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    status: string;
    showUptime: boolean;
    createdAt: string;
    group: { id: string; name: string } | null;
    monitor: {
        lastStatus: string | null;
        lastResponseMs: number | null;
        lastCheckedAt: string | null;
        monitorCreatedAt: string;
        interval: number;
        uptimeRange: number | null;
        avgResponseMs: number | null;
        p95ResponseMs: number | null;
        checks: Check[];
    } | null;
    incidents: ComponentIncident[];
}

export default function ComponentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [range, setRange] = useState<Range>('7d');
    const [data, setData] = useState<ComponentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = useCallback(
        async (r: Range) => {
            setLoading(true);
            try {
                const res = await fetch(`/api/status/components/${id}?range=${r}`, { cache: 'no-store' });
                if (!res.ok) throw new Error();
                setData(await res.json());
                setError(false);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        },
        [id],
    );

    useEffect(() => {
        load(range);
    }, [load, range]);

    const history: DowntimeIncident[] = useMemo(
        () =>
            (data?.incidents ?? []).map((i) => ({
                id: i.id,
                name: i.name,
                status: i.componentStatus,
                from: i.startedAt,
                to: i.resolvedAt,
            })),
        [data],
    );

    if (error && !data) {
        return (
            <PageShell>
                <BackLink href="/">Back to status</BackLink>
                <EmptyState>This component could not be found or is temporarily unavailable.</EmptyState>
            </PageShell>
        );
    }

    if (!data) {
        return (
            <PageShell>
                <BackLink href="/">Back to status</BackLink>
                <div className="animate-pulse space-y-4" aria-hidden="true">
                    <div className="h-8 w-56 rounded bg-zinc-900" />
                    <div className="grid grid-cols-3 gap-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-24 rounded-xl bg-zinc-900" />
                        ))}
                    </div>
                    <div className="h-56 rounded-xl bg-zinc-900" />
                </div>
            </PageShell>
        );
    }

    const tone = componentTone(data.status);
    const monitor = data.monitor;
    const uptime = monitor?.uptimeRange ?? null;
    const down = monitor?.lastStatus === 'DOWN';
    const monitorStart = monitor ? new Date(monitor.monitorCreatedAt) : null;
    const shortHistory = monitorStart && monitorStart.getTime() > Date.now() - RANGE_MS[range];
    const active = data.incidents.filter((i) => i.status !== 'RESOLVED');

    return (
        <PageShell>
            <BackLink href="/">Back to status</BackLink>

            <header className="mb-8">
                {data.group && (
                    <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
                        {data.group.name}
                    </p>
                )}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <h1 className="min-w-0 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        {data.name}
                    </h1>
                    <StatusBadge tone={tone} pulse={data.status !== 'OPERATIONAL'} />
                </div>
                {data.location && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        <LocationBadge location={data.location} />
                    </div>
                )}
                {data.description && <p className="mt-2 text-sm text-zinc-400">{data.description}</p>}
            </header>

            {active.length > 0 && (
                <div className="mb-6 space-y-2">
                    {active.map((inc) => {
                        const it = incidentTone(inc.status);
                        return (
                            <Link
                                key={inc.id}
                                href={`/incidents/${inc.id}`}
                                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors hover:border-white/20 ${it.soft}`}
                            >
                                <span className="flex min-w-0 items-center gap-2.5">
                                    <StatusDot tone={it} pulse />
                                    <span className="truncate text-sm font-medium text-white">{inc.name}</span>
                                </span>
                                <span className={`shrink-0 text-xs ${it.text}`}>{it.label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}

            <div className="mb-6 flex items-center gap-3">
                <RangeTabs ranges={RANGES} value={range} onChange={setRange} />
                {loading && <Spinner className="h-3.5 w-3.5" />}
            </div>

            {monitor && (
                <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
                    <StatTile
                        label="Uptime"
                        value={uptime !== null ? formatUptime(uptime) : '–'}
                        valueClass={uptime !== null ? uptimeTone(uptime) : 'text-white'}
                        hint={
                            shortHistory && monitorStart
                                ? `since ${monitorStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                                : `last ${RANGE_LABEL[range]}`
                        }
                    />
                    <StatTile
                        label="Average"
                        value={down ? 'Down' : monitor.avgResponseMs !== null ? `${monitor.avgResponseMs}ms` : '–'}
                        valueClass={down ? 'text-red-400' : 'text-white'}
                        hint="response time"
                    />
                    <StatTile
                        label="95th percentile"
                        value={down ? 'Down' : monitor.p95ResponseMs !== null ? `${monitor.p95ResponseMs}ms` : '–'}
                        valueClass={down ? 'text-red-400' : 'text-white'}
                        hint="response time"
                    />
                </div>
            )}

            {data.showUptime && (
                <Card className="mb-6 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-sm font-medium text-white">
                            {range === '24h' ? 'Hourly' : 'Daily'} uptime
                        </h2>
                        {uptime !== null && (
                            <span className={`text-sm font-medium tabular-nums ${uptimeTone(uptime)}`}>
                                {formatUptime(uptime)}
                            </span>
                        )}
                    </div>
                    <UptimeBars
                        key={range}
                        incidents={history}
                        checks={monitor?.checks}
                        count={range === '24h' ? 24 : Number.parseInt(range, 10)}
                        unit={range === '24h' ? 'hour' : 'day'}
                        responsive={range === '90d'}
                    />
                </Card>
            )}

            {monitor && (
                <Card className="mb-8 p-4 sm:p-5">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-medium text-white">Response time</h2>
                        <span className="text-xs tabular-nums text-zinc-400">
                            {down ? (
                                <span className="text-red-400">Not responding</span>
                            ) : monitor.lastResponseMs !== null ? (
                                <>
                                    <span className="text-zinc-200">{monitor.lastResponseMs}ms</span> latest
                                    {monitor.lastCheckedAt && (
                                        <>
                                            {' · checked '}
                                            <LocalTime date={monitor.lastCheckedAt} preset="relative" />
                                        </>
                                    )}
                                </>
                            ) : null}
                        </span>
                    </div>
                    <LatencyChart checks={monitor.checks} />
                </Card>
            )}

            <section>
                <SectionTitle>Incident history</SectionTitle>
                {data.incidents.length === 0 ? (
                    <EmptyState tone={componentTone('OPERATIONAL')}>
                        No incidents recorded for this component.
                    </EmptyState>
                ) : (
                    <Card className="divide-y divide-white/[0.05] overflow-hidden">
                        {data.incidents.map((inc) => {
                            const it = incidentTone(inc.status);
                            const impact = impactTone(inc.impact);
                            return (
                                <Link
                                    key={inc.id}
                                    href={`/incidents/${inc.id}`}
                                    className="group flex gap-3 px-4 py-4 transition-colors hover:bg-white/[0.02] sm:px-5"
                                >
                                    <span
                                        className={`mt-1 w-1 shrink-0 self-stretch rounded-full ${impact.bar}`}
                                        aria-hidden="true"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                            <p className="min-w-0 text-sm font-medium text-zinc-100 group-hover:text-white">
                                                {inc.name}
                                            </p>
                                            <span className="text-xs tabular-nums text-zinc-500">
                                                <LocalTime date={inc.startedAt} preset="short" />
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-zinc-400">
                                            <span className={it.text}>{it.label}</span>
                                            {' · '}
                                            {inc.resolvedAt
                                                ? `lasted ${formatDuration(inc.startedAt, inc.resolvedAt)}`
                                                : `ongoing for ${formatDuration(inc.startedAt, null)}`}
                                        </p>
                                        {inc.updates[0] && (
                                            <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400">
                                                {inc.updates[0].body}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </Card>
                )}
            </section>
        </PageShell>
    );
}
