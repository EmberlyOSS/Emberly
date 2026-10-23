import { marked } from 'marked';
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
import { formatDuration, impactTone, incidentTone } from '@/lib/status-ui';
import { SITE } from '@/lib/site';

export const revalidate = 0;

function formatUtc(date: Date) {
    return `${date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const incident = await prisma.incident.findUnique({
        where: { id },
        select: { name: true, status: true, startedAt: true, resolvedAt: true },
    });

    if (!incident) {
        return { title: 'Incident Not Found' };
    }

    const label = incidentTone(incident.status).label;
    const description =
        incident.status === 'RESOLVED'
            ? `Resolved · Started ${formatUtc(incident.startedAt)} · Duration: ${formatDuration(incident.startedAt, incident.resolvedAt)}`
            : `${label} · Started ${formatUtc(incident.startedAt)} · ${formatDuration(incident.startedAt, null)} ongoing`;

    return {
        title: incident.name,
        description,
        openGraph: {
            title: `${incident.name} | Emberly Status`,
            description,
            url: `${SITE.statusUrl}/incidents/${id}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${incident.name} | Emberly Status`,
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

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const incident = await prisma.incident.findUnique({
        where: { id },
        include: {
            updates: { orderBy: { createdAt: 'desc' } },
            components: {
                include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } },
            },
        },
    });

    if (!incident) notFound();

    const tone = incidentTone(incident.status);
    const impact = impactTone(incident.impact);
    const resolved = incident.status === 'RESOLVED';

    return (
        <PageShell>
            <BackLink href="/incidents">All incidents</BackLink>

            <header className="mb-8">
                <StatusBadge tone={tone} pulse={!resolved} />
                <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {incident.name}
                </h1>
            </header>

            <Card className="mb-8 p-4 sm:p-5">
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Fact label="Started">
                        <LocalTime date={incident.startedAt} preset="short" />
                    </Fact>
                    <Fact label={resolved ? 'Resolved' : 'Status'}>
                        {resolved && incident.resolvedAt ? (
                            <LocalTime date={incident.resolvedAt} preset="short" />
                        ) : (
                            <span className={tone.text}>{tone.label}</span>
                        )}
                    </Fact>
                    <Fact label={resolved ? 'Duration' : 'Ongoing for'}>
                        <span className="tabular-nums">{formatDuration(incident.startedAt, incident.resolvedAt)}</span>
                    </Fact>
                    <Fact label="Impact">
                        <span className={impact.text}>{impact.label}</span>
                    </Fact>
                </dl>
                {incident.components.length > 0 && (
                    <div className="mt-4 border-t border-white/[0.06] pt-4">
                        <p className="mb-2 text-xs text-zinc-500">Affected components</p>
                        <ComponentChips
                            components={incident.components.map((c) => ({
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
                {incident.updates.length === 0 ? (
                    <EmptyState>No updates posted yet.</EmptyState>
                ) : (
                    <UpdateTimeline
                        live={!resolved}
                        entries={incident.updates.map((u) => ({
                            id: u.id,
                            tone: incidentTone(u.status),
                            label: incidentTone(u.status).label,
                            at: u.createdAt,
                            body: u.body,
                        }))}
                    />
                )}
            </section>

            {incident.postmortemPublishedAt && incident.postmortemBody && (
                <section className="mt-12 border-t border-white/[0.06] pt-8">
                    <SectionTitle>Postmortem</SectionTitle>
                    <div
                        className="prose prose-invert prose-sm max-w-none sm:prose-base prose-headings:text-white prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-white prose-a:text-white"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: postmortem bodies are staff-authored via the admin panel, not user input
                        dangerouslySetInnerHTML={{ __html: marked.parse(incident.postmortemBody, { async: false }) }}
                    />
                </section>
            )}
        </PageShell>
    );
}
