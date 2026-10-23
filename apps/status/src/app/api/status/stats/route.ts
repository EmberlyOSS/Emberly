import { prisma } from '@/lib/prisma';
import { computeTimeBasedUptime } from '@/lib/uptime';
import { NextResponse } from 'next/server';

export const revalidate = 0;

const RANGES = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
} as const;

type Range = keyof typeof RANGES;

export async function GET(request: Request) {
    const url = new URL(request.url);
    const range: Range = (url.searchParams.get('range') as Range) ?? '30d';

    if (!Object.keys(RANGES).includes(range)) {
        return NextResponse.json({ error: 'Invalid range. Use 7d, 30d, or 90d.' }, { status: 400 });
    }

    const rangeMs = RANGES[range];
    const since = new Date(Date.now() - rangeMs);

    // Every monitored component's incident windows, to average a single
    // sitewide uptime number the same way the per-component detail page
    // computes its own (see src/lib/uptime.ts): components with no
    // monitor attached have nothing to measure so they're excluded rather
    // than silently counted as 100%.
    const components = await prisma.statusComponent.findMany({
        where: { monitor: { isNot: null } },
        select: {
            id: true,
            name: true,
            group: { select: { name: true } },
            incidentComponents: {
                select: {
                    incident: { select: { startedAt: true, resolvedAt: true } },
                },
            },
            monitor: {
                select: {
                    checks: {
                        where: { checkedAt: { gte: since } },
                        select: { responseMs: true },
                    },
                },
            },
        },
    });

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

    const perComponentUptime = components.map((c) => {
        const windows = c.incidentComponents.map((ic) => ({
            from: ic.incident.startedAt.getTime(),
            to: ic.incident.resolvedAt?.getTime() ?? Date.now(),
        }));
        return computeTimeBasedUptime(rangeMs, windows);
    });

    const overallUptime =
        components.length === 0
            ? 100
            : Math.round((perComponentUptime.reduce((a, b) => a + b, 0) / components.length) * 100) / 100;

    const perComponent = components.map((c, idx) => {
        const windows = c.incidentComponents.map((ic) => ({
            from: ic.incident.startedAt.getTime(),
            to: ic.incident.resolvedAt?.getTime() ?? Date.now(),
        }));
        const incidentsForComponent = windows.filter((w) => w.from >= since.getTime());
        return {
            id: c.id,
            name: c.name,
            groupName: c.group?.name ?? null,
            uptime: Math.round(perComponentUptime[idx] * 100) / 100,
            avgResponseMs: computeAvgMs(c.monitor?.checks ?? []),
            p95ResponseMs: computeP95Ms(c.monitor?.checks ?? []),
            incidentCount: incidentsForComponent.length,
        };
    });

    const incidentsInRange = await prisma.incident.findMany({
        where: { startedAt: { gte: since } },
        select: { id: true, status: true, impact: true, startedAt: true, resolvedAt: true },
    });

    const resolved = incidentsInRange.filter((i) => i.resolvedAt !== null);
    const ongoing = incidentsInRange.length - resolved.length;

    const resolutionTimesMs = resolved.map((i) => (i.resolvedAt as Date).getTime() - i.startedAt.getTime());
    const avgResolutionMinutes = resolutionTimesMs.length
        ? Math.round(resolutionTimesMs.reduce((a, b) => a + b, 0) / resolutionTimesMs.length / 60000)
        : null;
    const totalDowntimeMinutes = Math.round(resolutionTimesMs.reduce((a, b) => a + b, 0) / 60000);

    const byImpact = incidentsInRange.reduce<Record<string, number>>((acc, i) => {
        acc[i.impact] = (acc[i.impact] ?? 0) + 1;
        return acc;
    }, {});

    return NextResponse.json({
        range,
        monitoredComponents: components.length,
        uptime: overallUptime,
        incidents: {
            total: incidentsInRange.length,
            resolved: resolved.length,
            ongoing,
            avgResolutionMinutes,
            totalDowntimeMinutes,
            byImpact,
        },
        perComponent: perComponent.sort((a, b) => a.name.localeCompare(b.name)),
    });
}
