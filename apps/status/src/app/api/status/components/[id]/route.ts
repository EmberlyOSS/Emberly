import { prisma } from '@/lib/prisma';
import { computeTimeBasedUptime } from '@/lib/uptime';
import { NextResponse } from 'next/server';

export const revalidate = 0;

const RANGES = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
} as const;

type Range = keyof typeof RANGES;

function computeAvgMs(checks: { responseMs: number | null }[]) {
    const valid = checks.map((c) => c.responseMs).filter((ms): ms is number => ms !== null);
    if (!valid.length) return null;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

function computeP95Ms(checks: { responseMs: number | null }[]) {
    const valid = checks.map((c) => c.responseMs).filter((ms): ms is number => ms !== null).sort((a, b) => a - b);
    if (!valid.length) return null;
    const idx = Math.ceil(valid.length * 0.95) - 1;
    return valid[Math.max(0, idx)];
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const url = new URL(request.url);
    const range: Range = (url.searchParams.get('range') as Range) ?? '7d';

    if (!Object.keys(RANGES).includes(range)) {
        return NextResponse.json({ error: 'Invalid range. Use 24h, 7d, 30d, or 90d.' }, { status: 400 });
    }

    const since = new Date(Date.now() - RANGES[range]);

    const component = await prisma.statusComponent.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            description: true,
            location: true,
            status: true,
            createdAt: true,
            showUptime: true,
            group: { select: { id: true, name: true } },
            // Fetch monitor stats: NEVER expose target/url
            monitor: {
                select: {
                    id: true,
                    createdAt: true,
                    lastStatus: true,
                    lastResponseMs: true,
                    lastCheckedAt: true,
                    uptime7d: true,
                    uptime30d: true,
                    interval: true,
                    checks: {
                        where: { checkedAt: { gte: since } },
                        orderBy: { checkedAt: 'asc' },
                        select: { result: true, responseMs: true, checkedAt: true },
                    },
                },
            },
            incidentComponents: {
                include: {
                    incident: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                            impact: true,
                            startedAt: true,
                            resolvedAt: true,
                            updates: {
                                orderBy: { createdAt: 'desc' },
                                take: 5,
                                select: { id: true, body: true, status: true, createdAt: true },
                            },
                        },
                    },
                },
                orderBy: { incident: { startedAt: 'desc' } },
            },
        },
    });

    if (!component) {
        return NextResponse.json({ error: 'Component not found.' }, { status: 404 });
    }

    // Derive effective status. Priority: active incident > monitor lastStatus > DB stored status.
    // DOWN and DEGRADED monitor results both map to DEGRADED_PERFORMANCE; MAJOR_OUTAGE is admin-declared only.
    const SEVERITY = ['OPERATIONAL', 'UNDER_MAINTENANCE', 'DEGRADED_PERFORMANCE', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE'];

    // Start from monitor-derived status if available, otherwise fall back to DB
    let effectiveStatus: string =
        component.monitor?.lastStatus === 'DOWN' || component.monitor?.lastStatus === 'DEGRADED'
            ? 'DEGRADED_PERFORMANCE'
            : component.monitor?.lastStatus === 'UP'
            ? 'OPERATIONAL'
            : (component.status as string);

    // Active incident links override everything (highest priority)
    for (const ic of component.incidentComponents) {
        if (ic.incident.status !== 'RESOLVED') {
            if (SEVERITY.indexOf(ic.status as string) > SEVERITY.indexOf(effectiveStatus)) {
                effectiveStatus = ic.status as string;
            }
        }
    }

    const checks = component.monitor?.checks ?? [];

    // Build incident windows for time-based uptime and UptimeBar coloring.
    const incidentWindows = component.incidentComponents.map((ic) => ({
        from: new Date(ic.incident.startedAt).getTime(),
        to: ic.incident.resolvedAt ? new Date(ic.incident.resolvedAt).getTime() : Date.now(),
    }));

    const payload = {
        id: component.id,
        name: component.name,
        description: component.description,
        location: component.location,
        status: effectiveStatus,
        showUptime: component.showUptime,
        createdAt: component.createdAt.toISOString(),
        group: component.group ?? null,
        monitor: component.monitor
            ? {
                  lastStatus: component.monitor.lastStatus,
                  lastResponseMs: component.monitor.lastResponseMs,
                  lastCheckedAt: component.monitor.lastCheckedAt?.toISOString() ?? null,
                  monitorCreatedAt: component.monitor.createdAt.toISOString(),
                  interval: component.monitor.interval,
                  uptime7d: component.monitor.uptime7d,
                  uptime30d: component.monitor.uptime30d,
                  // Time-based: 100% minus incident window time within range. Service assumed UP before monitoring.
                  uptimeRange: computeTimeBasedUptime(RANGES[range], incidentWindows),
                  avgResponseMs: computeAvgMs(checks),
                  p95ResponseMs: computeP95Ms(checks),
                  checks: checks.map((c) => ({
                      result: c.result,
                      responseMs: c.responseMs,
                      checkedAt: c.checkedAt.toISOString(),
                  })),
              }
            : null,
        incidents: component.incidentComponents.map((ic) => ({
            id: ic.incident.id,
            name: ic.incident.name,
            status: ic.incident.status,
            impact: ic.incident.impact,
            componentStatus: ic.status,
            startedAt: ic.incident.startedAt.toISOString(),
            resolvedAt: ic.incident.resolvedAt?.toISOString() ?? null,
            updates: ic.incident.updates.map((u) => ({
                id: u.id,
                body: u.body,
                status: u.status,
                createdAt: u.createdAt.toISOString(),
            })),
        })),
    };

    return NextResponse.json(payload);
}
