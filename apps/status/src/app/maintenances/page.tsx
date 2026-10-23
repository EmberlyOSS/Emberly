import { Wrench } from 'lucide-react';
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
import { formatDuration, maintenanceTone } from '@/lib/status-ui';

export const metadata: Metadata = {
    title: 'Maintenance',
    description: 'Planned and historical maintenance windows for Emberly services.',
};

export const revalidate = 0;

export default async function MaintenancesPage() {
    const all = await prisma.scheduledMaintenance.findMany({
        orderBy: { scheduledStart: 'desc' },
        include: {
            updates: { orderBy: { createdAt: 'desc' }, take: 1 },
            components: {
                include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } },
            },
        },
    });

    const active = all
        .filter((m) => m.status !== 'COMPLETED')
        .sort((a, b) =>
            a.status === 'IN_PROGRESS'
                ? -1
                : b.status === 'IN_PROGRESS'
                  ? 1
                  : a.scheduledStart.getTime() - b.scheduledStart.getTime(),
        );
    const history = all.filter((m) => m.status === 'COMPLETED');
    const chips = (m: (typeof all)[number]) =>
        m.components.map((c) => ({ id: c.component.id, name: c.component.name, groupName: c.component.group?.name }));

    return (
        <PageShell>
            <PageHeader
                title="Maintenance"
                description="Planned and completed maintenance windows for Emberly services."
            />

            <section className="mb-10">
                <SectionTitle>Planned</SectionTitle>
                {active.length === 0 ? (
                    <EmptyState>No maintenance is currently planned.</EmptyState>
                ) : (
                    <div className="space-y-3">
                        {active.map((m) => {
                            const tone = maintenanceTone(m.status);
                            const running = m.status === 'IN_PROGRESS';
                            const note = m.updates[0]?.message ?? m.description;
                            return (
                                <Link
                                    key={m.id}
                                    href={`/maintenances/${m.id}`}
                                    className={`block rounded-xl border p-4 transition-colors hover:border-white/20 sm:p-5 ${
                                        running ? tone.soft : 'border-white/[0.08] bg-zinc-900/60'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <h3 className="flex min-w-0 items-center gap-2 text-base font-semibold text-white">
                                            <Wrench className="h-4 w-4 shrink-0 text-orange-400" aria-hidden="true" />
                                            <span className="min-w-0">{m.name}</span>
                                        </h3>
                                        <StatusBadge tone={tone} pulse={running} />
                                    </div>
                                    <p className="mt-2 text-sm text-zinc-300">
                                        <LocalTime date={m.scheduledStart} preset="short" /> to{' '}
                                        <LocalTime date={m.scheduledEnd} preset="short" />
                                        <span className="text-zinc-500">
                                            {' '}
                                            · {formatDuration(m.scheduledStart, m.scheduledEnd)} window
                                        </span>
                                    </p>
                                    {note && (
                                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">
                                            {note}
                                        </p>
                                    )}
                                    {m.components.length > 0 && (
                                        <div className="mt-3">
                                            <ComponentChips components={chips(m)} link={false} />
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
                    <EmptyState>No past maintenance recorded.</EmptyState>
                ) : (
                    <Card className="divide-y divide-white/[0.05] overflow-hidden">
                        {history.map((m) => (
                            <Link
                                key={m.id}
                                href={`/maintenances/${m.id}`}
                                className="group block px-4 py-4 transition-colors hover:bg-white/[0.02] sm:px-5"
                            >
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                    <p className="min-w-0 text-sm font-medium text-zinc-100 group-hover:text-white">
                                        {m.name}
                                    </p>
                                    <span className="text-xs tabular-nums text-zinc-500">
                                        <LocalTime date={m.scheduledStart} preset="date" />
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-zinc-400">
                                    Completed · {formatDuration(m.scheduledStart, m.scheduledEnd)} window
                                </p>
                                {m.components.length > 0 && (
                                    <div className="mt-2">
                                        <ComponentChips components={chips(m)} link={false} />
                                    </div>
                                )}
                            </Link>
                        ))}
                    </Card>
                )}
            </section>
        </PageShell>
    );
}
