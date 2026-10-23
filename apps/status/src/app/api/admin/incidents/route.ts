import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import type { IncidentStatus, ComponentStatus } from '@prisma/client';
import { notifyIncidentCreated } from '@/lib/status-notify';

const VALID_STATUSES: IncidentStatus[] = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'];
const VALID_COMPONENT_STATUSES: ComponentStatus[] = [
    'OPERATIONAL', 'DEGRADED_PERFORMANCE', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE', 'UNDER_MAINTENANCE',
];

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const incidents = await prisma.incident.findMany({
        orderBy: { startedAt: 'desc' },
        include: {
            updates: { orderBy: { createdAt: 'desc' } },
            components: { include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } } },
        },
    });

    return NextResponse.json(incidents);
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { name, status, impact, initialUpdate, affectedComponents } = body as {
        name?: string;
        status?: IncidentStatus;
        impact?: string;
        initialUpdate?: string;
        affectedComponents?: { componentId: string; status: ComponentStatus }[];
    };

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (status && !VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (affectedComponents) {
        for (const ac of affectedComponents) {
            if (!VALID_COMPONENT_STATUSES.includes(ac.status)) {
                return NextResponse.json({ error: `Invalid component status: ${ac.status}` }, { status: 400 });
            }
        }
    }

    const resolvedStatus = status ?? 'INVESTIGATING';

    const incident = await prisma.incident.create({
        data: {
            name: name.trim(),
            status: resolvedStatus,
            impact: impact ? String(impact).toLowerCase() : 'minor',
            updates: initialUpdate
                ? { create: { body: String(initialUpdate).trim(), status: resolvedStatus } }
                : undefined,
            components: affectedComponents?.length
                ? { create: affectedComponents.map((ac) => ({ componentId: ac.componentId, status: ac.status })) }
                : undefined,
        },
        include: {
            updates: { orderBy: { createdAt: 'desc' } },
            components: { include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } } },
        },
    });

    // Update linked component statuses
    if (affectedComponents?.length) {
        await Promise.all(
            affectedComponents.map((ac) =>
                prisma.statusComponent.update({ where: { id: ac.componentId }, data: { status: ac.status } }),
            ),
        );
    }

    notifyIncidentCreated(
        incident.name,
        incident.impact,
        incident.components.map((c) => c.componentId),
    ).catch((err) => console.error('[incident created notify] failed:', err));

    return NextResponse.json(incident, { status: 201 });
}
