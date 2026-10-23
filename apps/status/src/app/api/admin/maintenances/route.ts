import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import type { MaintenanceStatus } from '@prisma/client';
import { notifyMaintenanceScheduled } from '@/lib/status-notify';

const VALID_STATUSES: MaintenanceStatus[] = ['NOT_STARTED_YET', 'IN_PROGRESS', 'COMPLETED'];

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const maintenances = await prisma.scheduledMaintenance.findMany({
        orderBy: { scheduledStart: 'asc' },
        include: {
            updates: { orderBy: { createdAt: 'desc' } },
            components: { include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } } },
        },
    });

    return NextResponse.json(maintenances);
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

    const { name, status, impact, description, scheduledStart, scheduledEnd, initialUpdate, affectedComponents } = body as {
        name?: string;
        status?: MaintenanceStatus;
        impact?: string;
        description?: string;
        scheduledStart?: string;
        scheduledEnd?: string;
        initialUpdate?: string;
        affectedComponents?: string[];
    };

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!scheduledStart || !scheduledEnd) {
        return NextResponse.json({ error: 'scheduledStart and scheduledEnd are required' }, { status: 400 });
    }
    if (status && !VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const startDate = new Date(scheduledStart);
    const endDate = new Date(scheduledEnd);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const resolvedStatus = status ?? 'NOT_STARTED_YET';

    const maintenance = await prisma.scheduledMaintenance.create({
        data: {
            name: name.trim(),
            status: resolvedStatus,
            impact: impact ? String(impact).toLowerCase() : 'none',
            description: description ? String(description).trim() : null,
            scheduledStart: startDate,
            scheduledEnd: endDate,
            updates: initialUpdate
                ? { create: { message: String(initialUpdate).trim() } }
                : undefined,
            components: affectedComponents?.length
                ? { create: affectedComponents.map((componentId) => ({ componentId })) }
                : undefined,
        },
        include: {
            updates: { orderBy: { createdAt: 'desc' } },
            components: { include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } } },
        },
    });

    // If starting immediately (IN_PROGRESS), set components to UNDER_MAINTENANCE
    if (resolvedStatus === 'IN_PROGRESS' && affectedComponents?.length) {
        await Promise.all(
            affectedComponents.map((componentId) =>
                prisma.statusComponent.update({ where: { id: componentId }, data: { status: 'UNDER_MAINTENANCE' } }),
            ),
        );
    }

    notifyMaintenanceScheduled(maintenance.name, startDate.toISOString(), endDate.toISOString(), affectedComponents ?? []).catch((err) => console.error('[maintenance scheduled notify] failed:', err));

    return NextResponse.json(maintenance, { status: 201 });
}
