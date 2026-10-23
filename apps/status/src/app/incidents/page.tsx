import type { Metadata } from 'next';
import Link from 'next/link';
import { LocalTime } from '@/components/status/LocalTime';
import {
    Card,
    ComponentChips,
    EmptyState,
    PageHeader,
    PageShell,
    SectionTitle,
    StatusBadge,
} from '@/components/status/Primitives';
import { prisma } from '@/lib/prisma';
import { componentTone, formatDuration, impactTone, incidentTone } from '@/lib/status-ui';

export const metadata: Metadata = {
    title: 'Incidents',
    description: 'Active and historical incidents for Emberly services.',
};

export const revalidate = 0;

export default async function IncidentsPage() {
    const all = await prisma.incident.findMany({
        orderBy: { startedAt: 'desc' },
        include: {
            updates: { orderBy: { createdAt: 'desc' }, take: 1 },
            components: {
                include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } },
            },
        },
    });

    const active = all.filter((i) => i.status !== 'RESOLVED');
    const history = all.filter((i) => i.status === 'RESOLVED');
    const byMonth = new Map<string, typeof history>();
    for (const inc of history) {
        const key = inc.startedAt.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        byMonth.set(key, [...(byMonth.get(key) ?? []), inc]);
    }
    const chips = (inc: (typeof all)[number]) =>
        inc.components.map((c) => ({ id: c.component.id, name: c.component.name, groupName: c.component.group?.name }));

    return (
        <PageShell>
            <PageHeader title="Incidents" description="Active and past incidents affecting Emberly services." />

            <section className="mb-10">
                <SectionTitle>Active</SectionTitle>
                {active.length === 0 ? (
                    <EmptyState tone={componentTone('OPERATIONAL')}>
                        No active incidents. Everything is running normally.
                    </EmptyState>
                ) : (
                    <div className="space-y-3">
                        {active.map((inc) => {
                            const tone = incidentTone(inc.status);
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
                                    {inc.updates[0] && (
                                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-300">
                                            {inc.updates[0].body}
                                        </p>
                                    )}
                                    <p className="mt-3 text-xs text-zinc-400">
                                        Started <LocalTime date={inc.startedAt} preset="short" /> · ongoing for{' '}
                                        {formatDuration(inc.startedAt, null)}
                                    </p>
                                    {inc.components.length > 0 && (
                                        <div className="mt-3">
                                            <ComponentChips components={chips(inc)} link={false} />
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            <section>
                <SectionTitle>History</SectionTitle>
                {history.length === 0 ? (
                    <EmptyState>No past incidents recorded.</EmptyState>
                ) : (
                    <div className="space-y-6">
                        {[...byMonth.entries()].map(([month, incidents]) => (
                            <div key={month}>
                                <h3 className="mb-2 text-sm font-medium text-zinc-300">{month}</h3>
                                <Card className="divide-y divide-white/[0.05] overflow-hidden">
                                    {incidents.map((inc) => {
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
                                                        <span className={impact.text}>{impact.label}</span>
                                                        {' · '}
                                                        Resolved after {formatDuration(inc.startedAt, inc.resolvedAt)}
                                                        {inc.postmortemPublishedAt && ' · Postmortem available'}
                                                    </p>
                                                    {inc.updates[0] && (
                                                        <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400">
                                                            {inc.updates[0].body}
                                                        </p>
                                                    )}
                                                    {inc.components.length > 0 && (
                                                        <div className="mt-2">
                                                            <ComponentChips components={chips(inc)} link={false} />
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </Card>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </PageShell>
    );
}
