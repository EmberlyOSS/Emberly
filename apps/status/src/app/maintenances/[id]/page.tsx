import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LocalTime } from '@/components/status/LocalTime';
import {
    BackLink,
    Card,
    ComponentChips,
    EmptyState,
    PageShell,
    SectionTitle,
    StatusBadge,
} from '@/components/status/Primitives';
import { UpdateTimeline } from '@/components/status/UpdateTimeline';
import { prisma } from '@/lib/prisma';
import { formatDuration, impactTone, maintenanceTone } from '@/lib/status-ui';
import { SITE } from '@/lib/site';

export const revalidate = 0;

function formatUtc(date: Date) {
    return `${date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const m = await prisma.scheduledMaintenance.findUnique({
        where: { id },
        select: { name: true, status: true, scheduledStart: true, scheduledEnd: true },
    });

    if (!m) {
        return { title: 'Maintenance Not Found' };
    }

    const description = `${maintenanceTone(m.status).label} · ${formatUtc(m.scheduledStart)} to ${formatUtc(m.scheduledEnd)} · ${formatDuration(m.scheduledStart, m.scheduledEnd)} window`;

    return {
        title: m.name,
        description,
        openGraph: {
            title: `${m.name} | Emberly Status`,
            description,
            url: `${SITE.statusUrl}/maintenances/${id}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${m.name} | Emberly Status`,
            description,
        },
    };
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-zinc-500">{label}</dt>
            <dd className="mt-1 text-sm text-zinc-100">{children}</dd>
        </div>
    );
}

export default async function MaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const m = await prisma.scheduledMaintenance.findUnique({
        where: { id },
        include: {
            updates: { orderBy: { createdAt: 'desc' } },
            components: {
                include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } },
            },
        },
    });

    if (!m) notFound();

    const tone = maintenanceTone(m.status);
    const impact = impactTone(m.impact);
    const running = m.status === 'IN_PROGRESS';

    return (
        <PageShell>
            <BackLink href="/maintenances">All maintenance</BackLink>

            <header className="mb-8">
                <StatusBadge tone={tone} pulse={running} />
                <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {m.name}
                </h1>
                {m.description && (
                    <p className="mt-3 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-zinc-300">
                        {m.description}
                    </p>
                )}
            </header>

            <Card className="mb-8 p-4 sm:p-5">
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Fact label="Starts">
                        <LocalTime date={m.scheduledStart} preset="short" />
                    </Fact>
                    <Fact label="Ends">
                        <LocalTime date={m.scheduledEnd} preset="short" />
                    </Fact>
                    <Fact label="Window">
                        <span className="tabular-nums">{formatDuration(m.scheduledStart, m.scheduledEnd)}</span>
                    </Fact>
                    <Fact label="Expected impact">
                        <span className={impact.text}>{impact.label}</span>
                    </Fact>
                </dl>
                {m.components.length > 0 && (
                    <div className="mt-4 border-t border-white/[0.06] pt-4">
                        <p className="mb-2 text-xs text-zinc-500">Affected components</p>
                        <ComponentChips
                            components={m.components.map((c) => ({
                                id: c.component.id,
                                name: c.component.name,
                                groupName: c.component.group?.name,
                            }))}
                        />
                    </div>
                )}
            </Card>

            <section>
                <SectionTitle>Updates</SectionTitle>
                {m.updates.length === 0 ? (
                    <EmptyState>No updates posted yet.</EmptyState>
                ) : (
                    <UpdateTimeline
                        live={running}
                        entries={m.updates.map((u) => ({ id: u.id, tone, at: u.createdAt, body: u.message }))}
                    />
                )}
            </section>
        </PageShell>
    );
}
