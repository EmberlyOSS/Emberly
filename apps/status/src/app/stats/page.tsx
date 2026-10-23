'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    Card,
    EmptyState,
    PageHeader,
    PageShell,
    RangeTabs,
    SectionTitle,
    Spinner,
    StatTile,
} from '@/components/status/Primitives';
import { formatUptime, impactTone, uptimeTone } from '@/lib/status-ui';

const RANGES = ['7d', '30d', '90d'] as const;
type Range = (typeof RANGES)[number];

interface ComponentStat {
    id: string;
    name: string;
    groupName: string | null;
    uptime: number;
    avgResponseMs: number | null;
    p95ResponseMs: number | null;
    incidentCount: number;
}

interface StatsPayload {
    range: Range;
    monitoredComponents: number;
    uptime: number;
    incidents: {
        total: number;
        resolved: number;
        ongoing: number;
        avgResolutionMinutes: number | null;
        totalDowntimeMinutes: number;
        byImpact: Record<string, number>;
    };
    perComponent: ComponentStat[];
}

function formatMinutes(mins: number | null): string {
    if (mins === null) return '–';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${mins % 60}m`;
    return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
}

const ms = (v: number | null) => (v === null ? '–' : `${v}ms`);

export default function StatsPage() {
    const [range, setRange] = useState<Range>('30d');
    const [data, setData] = useState<StatsPayload | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch(`/api/status/stats?range=${range}`, { cache: 'no-store' })
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => {
                if (!cancelled) {
                    setData(json);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [range]);

    const impacts = data ? Object.entries(data.incidents.byImpact).filter(([, n]) => n > 0) : [];

    return (
        <PageShell width="lg">
            <PageHeader
                title="Uptime stats"
                description="Reliability across every monitored Emberly service."
                action={
                    <div className="flex items-center gap-3">
                        {loading && <Spinner className="h-3.5 w-3.5" />}
                        <RangeTabs ranges={RANGES} value={range} onChange={setRange} />
                    </div>
                }
            />

            {!loading && (!data || data.monitoredComponents === 0) ? (
                <EmptyState>No monitored components yet, so there are no stats to show.</EmptyState>
            ) : (
                <>
                    <div className="mb-10 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                        <StatTile
                            label="Overall uptime"
                            value={data ? formatUptime(data.uptime) : '–'}
                            valueClass={data ? uptimeTone(data.uptime) : 'text-white'}
                            hint={data ? `${data.monitoredComponents} monitored services` : undefined}
                        />
                        <StatTile
                            label="Incidents"
                            value={data?.incidents.total ?? '–'}
                            hint={
                                data && data.incidents.ongoing > 0 ? (
                                    <span className="text-red-400">{data.incidents.ongoing} ongoing</span>
                                ) : impacts.length ? (
                                    impacts.map(([k, n]) => `${n} ${impactTone(k).label.toLowerCase()}`).join(' · ')
                                ) : undefined
                            }
                        />
                        <StatTile
                            label="Avg. time to resolve"
                            value={data ? formatMinutes(data.incidents.avgResolutionMinutes) : '–'}
                        />
                        <StatTile
                            label="Total downtime"
                            value={data ? formatMinutes(data.incidents.totalDowntimeMinutes) : '–'}
                        />
                    </div>

                    <SectionTitle>Per service</SectionTitle>
                    {data && data.perComponent.length > 0 ? (
                        <Card className="overflow-hidden">
                            <table className="hidden w-full text-sm sm:table">
                                <thead>
                                    <tr className="border-b border-white/[0.06] text-left text-xs text-zinc-400">
                                        <th className="px-5 py-3 font-medium">Service</th>
                                        <th className="px-5 py-3 text-right font-medium">Uptime</th>
                                        <th className="px-5 py-3 text-right font-medium">Avg</th>
                                        <th className="px-5 py-3 text-right font-medium">P95</th>
                                        <th className="px-5 py-3 text-right font-medium">Incidents</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                    {data.perComponent.map((c) => (
                                        <tr key={c.id} className="transition-colors hover:bg-white/[0.02]">
                                            <td className="px-5 py-3">
                                                <Link
                                                    href={`/components/${c.id}`}
                                                    className="text-zinc-100 hover:text-white hover:underline hover:underline-offset-4"
                                                >
                                                    {c.name}
                                                </Link>
                                                {c.groupName && (
                                                    <span className="ml-2 text-xs text-zinc-500">{c.groupName}</span>
                                                )}
                                            </td>
                                            <td className={`px-5 py-3 text-right tabular-nums ${uptimeTone(c.uptime)}`}>
                                                {formatUptime(c.uptime)}
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums text-zinc-300">
                                                {ms(c.avgResponseMs)}
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums text-zinc-300">
                                                {ms(c.p95ResponseMs)}
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums text-zinc-300">
                                                {c.incidentCount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <ul className="divide-y divide-white/[0.05] sm:hidden">
                                {data.perComponent.map((c) => (
                                    <li key={c.id}>
                                        <Link href={`/components/${c.id}`} className="block px-4 py-3.5">
                                            <div className="flex items-baseline justify-between gap-3">
                                                <span className="min-w-0 truncate text-sm font-medium text-zinc-100">
                                                    {c.name}
                                                </span>
                                                <span
                                                    className={`shrink-0 text-sm tabular-nums ${uptimeTone(c.uptime)}`}
                                                >
                                                    {formatUptime(c.uptime)}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs tabular-nums text-zinc-500">
                                                {c.groupName && `${c.groupName} · `}avg {ms(c.avgResponseMs)} · p95{' '}
                                                {ms(c.p95ResponseMs)} · {c.incidentCount} incident
                                                {c.incidentCount === 1 ? '' : 's'}
                                            </p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    ) : (
                        !loading && <EmptyState>No monitored services.</EmptyState>
                    )}
                </>
            )}
        </PageShell>
    );
}
