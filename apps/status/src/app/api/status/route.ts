import type { ComponentStatus, HomePageDisplay } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStatusPageSettings } from '@/lib/statusPageSettings';
import { computeTimeBasedUptime, type DowntimeIncident } from '@/lib/uptime';
import { SITE } from '@/lib/site';

export const revalidate = 0;

type Indicator = 'NONE' | 'MINOR' | 'MAJOR' | 'CRITICAL';

export interface StatusComponent {
    id: string;
    name: string;
    status: ComponentStatus;
    order: number;
    showUptime: boolean;
    groupId: string | null;
    description?: string | null;
    location?: string | null;
    uptimePct: number;
    uptime90d: number;
    history: DowntimeIncident[];
    monitor?: {
        lastStatus: string | null;
        lastResponseMs: number | null;
        lastCheckedAt: string | null;
    } | null;
}

export interface StatusGroup {
    id: string;
    name: string;
    order: number;
    parentId: string | null;
    defaultOpen: boolean;
    components: StatusComponent[];
    children: StatusGroup[];
}

export interface IncidentUpdate {
    id: string;
    body: string;
    status: string;
    createdAt: string;
}

export interface AffectedComponent {
    id: string;
    name: string;
    groupName: string | null;
}

export interface StatusIncident {
    id: string;
    name: string;
    status: string;
    impact: string;
    startedAt: string;
    resolvedAt: string | null;
    incidentUpdates: IncidentUpdate[];
    components: AffectedComponent[];
}

export interface StatusMaintenance {
    id: string;
    name: string;
    status: string;
    impact: string;
    description: string | null;
    scheduledStart: string;
    scheduledEnd: string;
    updates: { id: string; message: string; createdAt: string }[];
    components: AffectedComponent[];
}

export interface RecentHistoryItem {
    kind: 'incident' | 'maintenance';
    id: string;
    name: string;
    impact: string;
    startedAt: string;
    endedAt: string;
    components: AffectedComponent[];
}

export interface StatusSummary {
    page: { name: string; url: string };
    status: { indicator: Indicator; description: string };
    groups: StatusGroup[];
    components: StatusComponent[];
    incidents: StatusIncident[];
    maintenances: StatusMaintenance[];
    homePageDisplay: HomePageDisplay;
    recentHistory: { days: number; items: RecentHistoryItem[] } | null;
    generatedAt: string;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

function deriveIndicator(components: { status: ComponentStatus }[]): { indicator: Indicator; description: string } {
    const statuses = components.map((c) => c.status);
    if (statuses.some((s) => s === 'MAJOR_OUTAGE'))
        return { indicator: 'CRITICAL', description: 'Major service disruption' };
    if (statuses.some((s) => s === 'PARTIAL_OUTAGE'))
        return { indicator: 'MAJOR', description: 'Partial service disruption' };
    if (statuses.some((s) => s === 'DEGRADED_PERFORMANCE' || s === 'UNDER_MAINTENANCE'))
        return { indicator: 'MINOR', description: 'Minor service degradation' };
    return { indicator: 'NONE', description: 'All systems operational' };
}

export async function GET() {
    const pageUrl = SITE.statusUrl;

    try {
        const [
            allGroupRows,
            components,
            incidents,
            maintenances,
            activeIncidentLinks,
            activeMaintenanceLinks,
            historyIncidentLinks,
            pageSettings,
        ] = await Promise.all([
            prisma.statusGroup.findMany({
                orderBy: { order: 'asc' },
                include: {
                    components: {
                        orderBy: { order: 'asc' },
                        include: {
                            monitor: {
                                select: {
                                    lastStatus: true,
                                    lastResponseMs: true,
                                    lastCheckedAt: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.statusComponent.findMany({
                orderBy: { order: 'asc' },
                include: {
                    monitor: {
                        select: {
                            lastStatus: true,
                            lastResponseMs: true,
                            lastCheckedAt: true,
                        },
                    },
                },
            }),
            prisma.incident.findMany({
                where: { status: { not: 'RESOLVED' } },
                orderBy: { startedAt: 'desc' },
                include: {
                    updates: { orderBy: { createdAt: 'desc' } },
                    components: {
                        include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } },
                    },
                },
            }),
            prisma.scheduledMaintenance.findMany({
                where: { status: { not: 'COMPLETED' } },
                orderBy: { scheduledStart: 'asc' },
                include: {
                    updates: { orderBy: { createdAt: 'desc' } },
                    components: {
                        include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } },
                    },
                },
            }),
            // Fetch active incident → component status overrides + incident start time for uptime adjustment
            prisma.incidentComponent.findMany({
                where: { incident: { status: { not: 'RESOLVED' } } },
                select: { componentId: true, status: true, incident: { select: { startedAt: true } } },
            }),
            // Fetch in-progress maintenance → component links (UNDER_MAINTENANCE).
            // Scheduled-but-not-started maintenances don't affect component status yet.
            prisma.maintenanceComponent.findMany({
                where: { maintenance: { status: 'IN_PROGRESS' } },
                select: { componentId: true },
            }),
            prisma.incidentComponent.findMany({
                where: {
                    incident: {
                        OR: [{ resolvedAt: null }, { resolvedAt: { gte: new Date(Date.now() - NINETY_DAYS_MS) } }],
                    },
                },
                orderBy: { incident: { startedAt: 'asc' } },
                select: {
                    componentId: true,
                    status: true,
                    incident: { select: { id: true, name: true, startedAt: true, resolvedAt: true } },
                },
            }),
            getStatusPageSettings(),
        ]);

        const now = Date.now();
        const { homePageDisplay, showRecentHistory, recentHistoryDays } = pageSettings;
        const historySince = new Date(now - recentHistoryDays * 24 * 60 * 60 * 1000);
        const affected = {
            include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } },
        };
        const [recentIncidents, recentMaintenances] = showRecentHistory
            ? await Promise.all([
                  prisma.incident.findMany({
                      where: { status: 'RESOLVED', resolvedAt: { gte: historySince } },
                      orderBy: { resolvedAt: 'desc' },
                      take: 25,
                      include: { components: affected },
                  }),
                  prisma.scheduledMaintenance.findMany({
                      where: { status: 'COMPLETED', scheduledEnd: { gte: historySince } },
                      orderBy: { scheduledEnd: 'desc' },
                      take: 25,
                      include: { components: affected },
                  }),
              ])
            : [[], []];
        const toAffected = (list: { component: { id: string; name: string; group: { name: string } | null } }[]) =>
            list.map((c) => ({
                id: c.component.id,
                name: c.component.name,
                groupName: c.component.group?.name ?? null,
            }));

        // Build override map: componentId → effective status driven by active incidents/maintenances.
        // Active incidents take highest priority; maintenances apply only if no active incident exists.
        const statusOverride = new Map<string, ComponentStatus>();

        const componentHistory = new Map<string, DowntimeIncident[]>();
        for (const link of historyIncidentLinks) {
            const list = componentHistory.get(link.componentId) ?? [];
            list.push({
                id: link.incident.id,
                name: link.incident.name,
                status: link.status,
                from: link.incident.startedAt.toISOString(),
                to: link.incident.resolvedAt?.toISOString() ?? null,
            });
            componentHistory.set(link.componentId, list);
        }
        function uptimeFor(componentId: string, rangeMs: number) {
            const windows = (componentHistory.get(componentId) ?? []).map((h) => ({
                from: new Date(h.from).getTime(),
                to: h.to ? new Date(h.to).getTime() : now,
            }));
            return computeTimeBasedUptime(rangeMs, windows, now);
        }
        for (const link of activeMaintenanceLinks) {
            statusOverride.set(link.componentId, 'UNDER_MAINTENANCE');
        }
        // Incident statuses win over maintenance
        const SEVERITY: ComponentStatus[] = [
            'OPERATIONAL',
            'UNDER_MAINTENANCE',
            'DEGRADED_PERFORMANCE',
            'PARTIAL_OUTAGE',
            'MAJOR_OUTAGE',
        ];
        for (const link of activeIncidentLinks) {
            const current = statusOverride.get(link.componentId);
            if (!current || SEVERITY.indexOf(link.status) > SEVERITY.indexOf(current)) {
                statusOverride.set(link.componentId, link.status);
            }
        }

        function serializeMonitor(
            m: { lastStatus: string | null; lastResponseMs: number | null; lastCheckedAt: Date | null } | null,
        ) {
            if (!m) return null;
            return {
                lastStatus: m.lastStatus,
                lastResponseMs: m.lastResponseMs,
                lastCheckedAt: m.lastCheckedAt?.toISOString() ?? null,
            };
        }

        // Translate monitor lastStatus → ComponentStatus for components with no active incident/maintenance.
        // DOWN and DEGRADED both map to DEGRADED_PERFORMANCE: MAJOR_OUTAGE is admin-declared only.
        function monitorDerivedStatus(lastStatus: string | null): ComponentStatus | null {
            if (lastStatus === 'DOWN' || lastStatus === 'DEGRADED') return 'DEGRADED_PERFORMANCE';
            if (lastStatus === 'UP') return 'OPERATIONAL';
            return null;
        }

        function serializeComponent(c: {
            id: string;
            name: string;
            status: ComponentStatus;
            order: number;
            showUptime: boolean;
            groupId: string | null;
            description: string | null;
            location: string | null;
            monitor: Parameters<typeof serializeMonitor>[0];
        }): StatusComponent {
            // Priority: active incident/maintenance > monitor lastStatus > DB stored status
            const incidentStatus = statusOverride.get(c.id);
            const derivedStatus = incidentStatus ?? monitorDerivedStatus(c.monitor?.lastStatus ?? null) ?? c.status;
            return {
                id: c.id,
                name: c.name,
                status: derivedStatus,
                order: c.order,
                showUptime: c.showUptime,
                groupId: c.groupId,
                description: c.description,
                location: c.location,
                uptimePct: uptimeFor(c.id, THIRTY_DAYS_MS),
                uptime90d: uptimeFor(c.id, NINETY_DAYS_MS),
                history: componentHistory.get(c.id) ?? [],
                monitor: serializeMonitor(c.monitor),
            };
        }

        function buildGroupTree(parentId: string | null): StatusGroup[] {
            return allGroupRows
                .filter((g) => g.parentId === parentId)
                .map((g) => ({
                    id: g.id,
                    name: g.name,
                    order: g.order,
                    parentId: g.parentId,
                    defaultOpen: g.defaultOpen,
                    components: g.components.map(serializeComponent),
                    children: buildGroupTree(g.id),
                }));
        }

        // Use effective statuses (with overrides applied) for the overall indicator
        const effectiveComponents = components.map((c) => ({
            status: statusOverride.get(c.id) ?? monitorDerivedStatus(c.monitor?.lastStatus ?? null) ?? c.status,
        }));

        const summary: StatusSummary = {
            page: { name: SITE.name, url: pageUrl },
            status: deriveIndicator(effectiveComponents),
            groups: buildGroupTree(null),
            components: components.map(serializeComponent),
            incidents: incidents.map((i) => ({
                id: i.id,
                name: i.name,
                status: i.status,
                impact: i.impact,
                startedAt: i.startedAt.toISOString(),
                resolvedAt: i.resolvedAt?.toISOString() ?? null,
                incidentUpdates: i.updates.map((u) => ({
                    id: u.id,
                    body: u.body,
                    status: u.status,
                    createdAt: u.createdAt.toISOString(),
                })),
                components: i.components.map((c) => ({
                    id: c.component.id,
                    name: c.component.name,
                    groupName: c.component.group?.name ?? null,
                })),
            })),
            maintenances: maintenances.map((m) => ({
                id: m.id,
                name: m.name,
                status: m.status,
                impact: m.impact,
                description: m.description,
                scheduledStart: m.scheduledStart.toISOString(),
                scheduledEnd: m.scheduledEnd.toISOString(),
                updates: m.updates.map((u) => ({
                    id: u.id,
                    message: u.message,
                    createdAt: u.createdAt.toISOString(),
                })),
                components: m.components.map((c) => ({
                    id: c.component.id,
                    name: c.component.name,
                    groupName: c.component.group?.name ?? null,
                })),
            })),
            homePageDisplay,
            recentHistory: showRecentHistory
                ? {
                      days: recentHistoryDays,
                      items: [
                          ...recentIncidents.map((i) => ({
                              kind: 'incident' as const,
                              id: i.id,
                              name: i.name,
                              impact: i.impact,
                              startedAt: i.startedAt.toISOString(),
                              endedAt: (i.resolvedAt ?? i.updatedAt).toISOString(),
                              components: toAffected(i.components),
                          })),
                          ...recentMaintenances.map((m) => ({
                              kind: 'maintenance' as const,
                              id: m.id,
                              name: m.name,
                              impact: m.impact,
                              startedAt: m.scheduledStart.toISOString(),
                              endedAt: m.scheduledEnd.toISOString(),
                              components: toAffected(m.components),
                          })),
                      ].sort((a, b) => b.endedAt.localeCompare(a.endedAt)),
                  }
                : null,
            generatedAt: new Date(now).toISOString(),
        };

        return NextResponse.json(summary);
    } catch (_err) {
        return NextResponse.json({ error: 'Unable to fetch status.' }, { status: 500 });
    }
}
