'use client';

import {
    AlertOctagon,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    RefreshCw,
    Wrench,
    XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RecentHistoryItem, StatusComponent, StatusGroup, StatusSummary } from '@/app/api/status/route';
import { LatencyChart } from '@/components/status/LatencyChart';
import { LocationBadge } from '@/components/status/LocationBadge';
import { LocalTime } from '@/components/status/LocalTime';
import { Card, ComponentChips, SectionTitle, StatusBadge, StatusDot } from '@/components/status/Primitives';
import { UptimeBars } from '@/components/status/UptimeBars';
import { BrandMark } from '@/lib/brand';
import {
    componentTone,
    formatDuration,
    INDICATOR,
    type Indicator,
    impactTone,
    incidentTone,
    maintenanceTone,
    timeAgo,
    worstStatus,
} from '@/lib/status-ui';

interface PreviewCheck {
    result: string;
    responseMs: number | null;
    checkedAt: string;
}

const HERO_ICON: Record<Indicator, typeof CheckCircle2> = {
    NONE: CheckCircle2,
    MINOR: AlertTriangle,
    MAJOR: AlertOctagon,
    CRITICAL: XCircle,
};

function flatten(group: StatusGroup): StatusComponent[] {
    return [...group.components, ...group.children.flatMap(flatten)];
}

function collectDefaultOpen(groups: StatusGroup[]): string[] {
    return groups.flatMap((g) => [...(g.defaultOpen ? [g.id] : []), ...collectDefaultOpen(g.children)]);
}

function StatusLabel({ status }: { status: string }) {
    const tone = componentTone(status);
    return (
        <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium sm:text-sm ${tone.text}`}>
            <StatusDot tone={tone} />
            {tone.label}
        </span>
    );
}

function ComponentRow({ comp }: { comp: StatusComponent }) {
    return (
        <div className="px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <Link
                            href={`/components/${comp.id}`}
                            className="group inline-flex max-w-full items-center gap-1 text-sm font-medium text-zinc-100 transition-colors hover:text-white"
                        >
                            <span className="truncate">{comp.name}</span>
                            <ArrowRight
                                className="h-3.5 w-3.5 shrink-0 -translate-x-1 text-zinc-500 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                                aria-hidden="true"
                            />
                        </Link>
                        {comp.location && <LocationBadge location={comp.location} />}
                    </div>
                    {comp.description && <p className="mt-0.5 truncate text-xs text-zinc-500">{comp.description}</p>}
                </div>
                <StatusLabel status={comp.status} />
            </div>
            {comp.showUptime && (
                <div className="mt-3">
                    <UptimeBars incidents={comp.history} count={90} responsive height="sm" />
                </div>
            )}
        </div>
    );
}

function RecentHistory({ history }: { history: NonNullable<StatusSummary['recentHistory']> }) {
    const byDay = new Map<string, RecentHistoryItem[]>();
    for (const item of history.items) {
        const key = new Date(item.endedAt).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
        byDay.set(key, [...(byDay.get(key) ?? []), item]);
    }
    return (
        <section className="mt-10">
            <SectionTitle
                action={
                    <Link href="/incidents" className="text-xs text-zinc-400 transition-colors hover:text-white">
                        View all
                    </Link>
                }
            >
                Past {history.days} days
            </SectionTitle>
            {history.items.length === 0 ? (
                <Card className="flex items-center gap-3 px-5 py-4">
                    <StatusDot tone={componentTone('OPERATIONAL')} />
                    <p className="text-sm text-zinc-300">
                        No incidents or maintenance in the past {history.days} days.
                    </p>
                </Card>
            ) : (
                <Card className="divide-y divide-white/[0.05]">
                    {[...byDay.entries()].map(([day, items]) => (
                        <div key={day} className="px-4 py-4 sm:px-5">
                            <h3 className="mb-3 text-xs font-medium text-zinc-400">{day}</h3>
                            <ul className="space-y-3">
                                {items.map((item) => {
                                    const isIncident = item.kind === 'incident';
                                    const tone = isIncident ? impactTone(item.impact) : maintenanceTone('IN_PROGRESS');
                                    const Icon = isIncident ? AlertTriangle : Wrench;
                                    return (
                                        <li key={`${item.kind}-${item.id}`}>
                                            <Link
                                                href={`/${isIncident ? 'incidents' : 'maintenances'}/${item.id}`}
                                                className="group flex items-start gap-3"
                                            >
                                                <span
                                                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${tone.soft}`}
                                                >
                                                    <Icon className={`h-3.5 w-3.5 ${tone.text}`} aria-hidden="true" />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-sm font-medium text-zinc-100 group-hover:text-white group-hover:underline group-hover:underline-offset-4">
                                                        {item.name}
                                                    </span>
                                                    <span className="mt-0.5 block text-xs text-zinc-500">
                                                        {isIncident
                                                            ? `Resolved after ${formatDuration(item.startedAt, item.endedAt)}`
                                                            : `Maintenance completed · ${formatDuration(item.startedAt, item.endedAt)} window`}
                                                        {item.components.length > 0 &&
                                                            ` · ${item.components
                                                                .slice(0, 3)
                                                                .map((c) => c.name)
                                                                .join(
                                                                    ', ',
                                                                )}${item.components.length > 3 ? ` +${item.components.length - 3}` : ''}`}
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </Card>
            )}
        </section>
    );
}

function Skeleton() {
    return (
        <div className="animate-pulse space-y-4" aria-hidden="true">
            <div className="h-32 rounded-2xl bg-zinc-900" />
            <div className="h-4 w-28 rounded bg-zinc-900" />
            {[0, 1, 2].map((i) => (
                <div key={i} className="h-40 rounded-xl bg-zinc-900/70" />
            ))}
        </div>
    );
}

export default function Home() {
    const [data, setData] = useState<StatusSummary | null>(null);
    const [failed, setFailed] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
    const [latency, setLatency] = useState<Record<string, PreviewCheck[]>>({});
    const [, setTick] = useState(0);
    const seeded = useRef(false);

    const fetchAll = useCallback(async () => {
        setRefreshing(true);
        const res = await fetch('/api/status', { cache: 'no-store' }).catch(() => null);
        if (res?.ok) {
            const summary: StatusSummary = await res.json();
            setData(summary);
            setFailed(false);
            setLastUpdated(new Date());
            if (!seeded.current) {
                seeded.current = true;
                setOpenGroups(new Set([...collectDefaultOpen(summary.groups), '__ungrouped']));
            }
            if (summary.homePageDisplay !== 'COMPONENTS') {
                const monitored = summary.components.filter((c) => c.monitor);
                const entries = await Promise.all(
                    monitored.map(async (c) => {
                        const r = await fetch(`/api/status/components/${c.id}?range=24h`, { cache: 'no-store' }).catch(
                            () => null,
                        );
                        if (!r?.ok) return null;
                        const d = await r.json();
                        return [c.id, (d.monitor?.checks ?? []) as PreviewCheck[]] as const;
                    }),
                );
                setLatency(
                    Object.fromEntries(entries.filter((e): e is readonly [string, PreviewCheck[]] => e !== null)),
                );
            }
        } else {
            setFailed(true);
        }
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchAll();
        const poll = setInterval(fetchAll, 60_000);
        const tick = setInterval(() => setTick((t) => t + 1), 15_000);
        const onVisible = () => document.visibilityState === 'visible' && fetchAll();
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(poll);
            clearInterval(tick);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [fetchAll]);

    const toggleGroup = (id: string) =>
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    if (!data) {
        return (
            <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
                {failed ? (
                    <Card className="p-6 text-center">
                        <p className="text-sm font-medium text-white">We couldn&apos;t load the current status.</p>
                        <p className="mt-1 text-sm text-zinc-400">This page will retry automatically.</p>
                        <button
                            type="button"
                            onClick={fetchAll}
                            className="mt-4 rounded-lg border border-white/15 px-4 py-2 text-sm text-white transition-colors hover:bg-white/[0.06]"
                        >
                            Try again
                        </button>
                    </Card>
                ) : (
                    <Skeleton />
                )}
            </div>
        );
    }

    const indicator = INDICATOR[data.status.indicator] ?? INDICATOR.NONE;
    const HeroIcon = HERO_ICON[data.status.indicator] ?? CheckCircle2;
    const inProgress = data.maintenances.filter((m) => m.status === 'IN_PROGRESS');
    const upcoming = data.maintenances.filter((m) => m.status !== 'IN_PROGRESS');
    const heroTitle =
        data.status.indicator === 'NONE' && inProgress.length > 0 ? 'Maintenance in progress' : indicator.title;

    const ungrouped = data.components.filter((c) => !c.groupId);
    const groups: StatusGroup[] = [
        ...data.groups,
        ...(ungrouped.length
            ? [
                  {
                      id: '__ungrouped',
                      name: 'Other',
                      order: 0,
                      parentId: null,
                      defaultOpen: true,
                      components: ungrouped,
                      children: [],
                  },
              ]
            : []),
    ];

    function renderGroupBody(group: StatusGroup, depth: number): React.ReactNode {
        const items = [
            ...group.components.map((c) => ({ order: c.order, node: <ComponentRow key={c.id} comp={c} /> })),
            ...group.children.map((child) => ({ order: child.order, node: renderSubgroup(child, depth + 1) })),
        ].sort((a, b) => a.order - b.order);
        return items.map((i) => i.node);
    }

    function renderSubgroup(group: StatusGroup, depth: number) {
        const comps = flatten(group);
        const status = worstStatus(comps.map((c) => c.status));
        const open = openGroups.has(group.id);
        return (
            <div key={group.id}>
                <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    disabled={!comps.length}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 bg-white/[0.015] px-4 py-3 text-left transition-colors hover:bg-white/[0.03] sm:px-5"
                >
                    <span className="flex min-w-0 items-center gap-2">
                        <ChevronDown
                            className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? '' : '-rotate-90'}`}
                            aria-hidden="true"
                        />
                        <span className="truncate text-sm font-medium text-zinc-200">{group.name}</span>
                        <span className="text-xs text-zinc-500">{comps.length}</span>
                    </span>
                    <StatusLabel status={status} />
                </button>
                {open && (
                    <div
                        className={`divide-y divide-white/[0.05] border-white/[0.06] ${depth > 1 ? 'ml-4 border-l' : ''}`}
                    >
                        {renderGroupBody(group, depth)}
                    </div>
                )}
            </div>
        );
    }

    function renderGroupCard(group: StatusGroup) {
        const comps = flatten(group);
        const status = worstStatus(comps.map((c) => c.status));
        const open = openGroups.has(group.id);
        return (
            <Card key={group.id} className="overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    disabled={!comps.length}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-white/[0.02] disabled:cursor-default sm:px-5"
                >
                    <span className="flex min-w-0 items-center gap-2.5">
                        <ChevronDown
                            className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? '' : '-rotate-90'}`}
                            aria-hidden="true"
                        />
                        <span className="truncate text-[15px] font-semibold text-white">{group.name}</span>
                        <span className="rounded-full bg-white/[0.06] px-1.5 text-[11px] tabular-nums text-zinc-400">
                            {comps.length}
                        </span>
                    </span>
                    <StatusLabel status={status} />
                </button>
                {comps.length === 0 ? (
                    <p className="border-t border-white/[0.06] px-5 py-4 text-sm text-zinc-500">
                        No components in this group.
                    </p>
                ) : (
                    open && (
                        <div className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
                            {renderGroupBody(group, 0)}
                        </div>
                    )
                )}
            </Card>
        );
    }

    const monitored = data.components.filter((c) => c.monitor).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
            <section
                className={`relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl sm:p-8 ${indicator.soft}`}
                aria-live="polite"
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-6 hidden opacity-[0.07] sm:block"
                >
                    <BrandMark size={200} detail="full" />
                </div>
                <div className="relative flex items-start gap-4">
                    <HeroIcon
                        className={`mt-0.5 h-8 w-8 shrink-0 sm:h-9 sm:w-9 ${indicator.text}`}
                        aria-hidden="true"
                    />
                    <div className="min-w-0">
                        <h1 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                            {heroTitle}
                        </h1>
                        <p className="mt-1.5 text-sm text-zinc-300">
                            {data.incidents.length > 0
                                ? `${data.incidents.length} active incident${data.incidents.length === 1 ? '' : 's'}. Details below.`
                                : indicator.subtitle}
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.08] pt-4 text-xs text-zinc-400">
                    <span>Updated {lastUpdated ? timeAgo(lastUpdated) : 'just now'} · refreshes every minute</span>
                    <button
                        type="button"
                        onClick={fetchAll}
                        disabled={refreshing}
                        className="inline-flex items-center gap-1.5 rounded-md text-zinc-300 transition-colors hover:text-white disabled:opacity-60"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
                        Refresh
                    </button>
                    {failed && <span className="text-amber-400">Last refresh failed, showing cached data</span>}
                </div>
                {data.status.indicator === 'NONE' && (
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-orange-700"
                    />
                )}
            </section>

            {data.incidents.length > 0 && (
                <section className="mt-8">
                    <SectionTitle>Active incidents</SectionTitle>
                    <div className="space-y-3">
                        {data.incidents.map((inc) => {
                            const tone = incidentTone(inc.status);
                            const latest = inc.incidentUpdates[0];
                            return (
                                <Link
                                    key={inc.id}
                                    href={`/incidents/${inc.id}`}
                                    className={`block rounded-xl border p-4 transition-colors hover:border-white/20 sm:p-5 ${tone.soft}`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <h3 className="min-w-0 text-base font-semibold text-white">{inc.name}</h3>
                                        <StatusBadge tone={tone} pulse />
                                    </div>
                                    {latest && (
                                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-300">
                                            {latest.body}
                                        </p>
                                    )}
                                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-zinc-400">
                                        <span>
                                            Started <LocalTime date={inc.startedAt} preset="relative" />
                                        </span>
                                        {latest && (
                                            <span>
                                                Last update <LocalTime date={latest.createdAt} preset="relative" />
                                            </span>
                                        )}
                                    </div>
                                    {inc.components.length > 0 && (
                                        <div className="mt-3">
                                            <ComponentChips components={inc.components} link={false} />
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {data.maintenances.length > 0 && (
                <section className="mt-8">
                    <SectionTitle>{inProgress.length ? 'Maintenance' : 'Upcoming maintenance'}</SectionTitle>
                    <div className="space-y-3">
                        {[...inProgress, ...upcoming].map((m) => {
                            const tone = maintenanceTone(m.status);
                            const latest = m.updates[0];
                            return (
                                <Link
                                    key={m.id}
                                    href={`/maintenances/${m.id}`}
                                    className={`block rounded-xl border p-4 transition-colors hover:border-white/20 sm:p-5 ${
                                        m.status === 'IN_PROGRESS' ? tone.soft : 'border-white/[0.08] bg-zinc-900/60'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <h3 className="flex min-w-0 items-center gap-2 text-base font-semibold text-white">
                                            <Wrench className="h-4 w-4 shrink-0 text-orange-400" aria-hidden="true" />
                                            <span className="min-w-0">{m.name}</span>
                                        </h3>
                                        <StatusBadge tone={tone} pulse={m.status === 'IN_PROGRESS'} />
                                    </div>
                                    <p className="mt-2 text-sm text-zinc-300">
                                        <LocalTime date={m.scheduledStart} preset="short" /> to{' '}
                                        <LocalTime date={m.scheduledEnd} preset="short" />
                                        <span className="text-zinc-500">
                                            {' '}
                                            · {m.status === 'IN_PROGRESS' ? 'ends' : 'starts'}{' '}
                                            <LocalTime
                                                date={m.status === 'IN_PROGRESS' ? m.scheduledEnd : m.scheduledStart}
                                                preset="relative"
                                            />
                                        </span>
                                    </p>
                                    {(latest?.message ?? m.description) && (
                                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">
                                            {latest?.message ?? m.description}
                                        </p>
                                    )}
                                    {m.components.length > 0 && (
                                        <div className="mt-3">
                                            <ComponentChips components={m.components} link={false} />
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {data.homePageDisplay !== 'RESPONSE_TIMES' && groups.length > 0 && (
                <section className="mt-10">
                    <SectionTitle
                        action={
                            <span className="hidden items-center gap-3 text-xs text-zinc-500 sm:flex">
                                {(
                                    ['OPERATIONAL', 'DEGRADED_PERFORMANCE', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE'] as const
                                ).map((s) => (
                                    <span key={s} className="inline-flex items-center gap-1.5">
                                        <span className={`h-2.5 w-1.5 rounded-[1px] ${componentTone(s).bar}`} />
                                        {componentTone(s).label}
                                    </span>
                                ))}
                            </span>
                        }
                    >
                        Components
                    </SectionTitle>
                    <div className="space-y-3">{groups.map(renderGroupCard)}</div>
                </section>
            )}

            {data.homePageDisplay !== 'COMPONENTS' && monitored.length > 0 && (
                <section className="mt-10">
                    <SectionTitle>Response times · last 24 hours</SectionTitle>
                    <Card className="divide-y divide-white/[0.05]">
                        {monitored.map((c) => {
                            const checks = latency[c.id];
                            const withMs = checks?.filter((k) => k.responseMs != null) ?? [];
                            const avg = withMs.length
                                ? Math.round(withMs.reduce((s, k) => s + (k.responseMs ?? 0), 0) / withMs.length)
                                : null;
                            return (
                                <div key={c.id} className="px-4 py-4 sm:px-5">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <Link
                                            href={`/components/${c.id}`}
                                            className="min-w-0 truncate text-sm font-medium text-zinc-100 hover:text-white"
                                        >
                                            {c.name}
                                        </Link>
                                        <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums">
                                            {c.monitor?.lastStatus === 'DOWN' ? (
                                                <span className="text-red-400">Not responding</span>
                                            ) : (
                                                c.monitor?.lastResponseMs != null && (
                                                    <span className="text-zinc-200">
                                                        {c.monitor.lastResponseMs}ms now
                                                    </span>
                                                )
                                            )}
                                            {avg !== null && (
                                                <span className="hidden text-zinc-500 sm:inline">{avg}ms avg</span>
                                            )}
                                        </div>
                                    </div>
                                    {checks ? (
                                        <LatencyChart checks={checks} height={56} maxPoints={96} axis={false} />
                                    ) : (
                                        <div className="h-14 animate-pulse rounded-md bg-white/[0.03]" />
                                    )}
                                </div>
                            );
                        })}
                    </Card>
                </section>
            )}

            {data.recentHistory && <RecentHistory history={data.recentHistory} />}

            <div className="mt-10 flex flex-wrap gap-3 text-sm">
                <Link
                    href="/incidents"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3.5 py-2 text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
                >
                    Incident history <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <Link
                    href="/stats"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3.5 py-2 text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
                >
                    Uptime stats <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
            </div>
        </div>
    );
}
