import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import type { MaintenanceStatus } from '@prisma/client';
import { notifyMaintenanceCompleted, notifyMaintenanceStarted } from '@/lib/status-notify';
import { syncMaintenanceComponentsForStatus } from '@/lib/maintenance';

const VALID_STATUSES: MaintenanceStatus[] = ['NOT_STARTED_YET', 'IN_PROGRESS', 'COMPLETED'];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { name, status, impact, description, scheduledStart, scheduledEnd, affectedComponents } = body as {
        name?: string;
        status?: MaintenanceStatus;
        impact?: string;
        description?: string;
        scheduledStart?: string;
        scheduledEnd?: string;
        affectedComponents?: string[];
    };

    if (status && !VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (status !== undefined) data.status = status;
    if (impact !== undefined) data.impact = String(impact).toLowerCase();
    if (description !== undefined) data.description = description ? String(description).trim() : null;
    if (scheduledStart !== undefined) {
        const d = new Date(scheduledStart);
        if (Number.isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid scheduledStart' }, { status: 400 });
        data.scheduledStart = d;
    }
    if (scheduledEnd !== undefined) {
        const d = new Date(scheduledEnd);
        if (Number.isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid scheduledEnd' }, { status: 400 });
        data.scheduledEnd = d;
    }

    try {
        const before = await prisma.scheduledMaintenance.findUnique({ where: { id }, select: { name: true, status: true } });
        const isTransition = status !== undefined && before !== null && before.status !== status;

        await prisma.scheduledMaintenance.update({ where: { id }, data });

        // Replace component links if provided
        if (affectedComponents !== undefined) {
            await prisma.maintenanceComponent.deleteMany({ where: { maintenanceId: id } });
            if (affectedComponents.length > 0) {
                await prisma.maintenanceComponent.createMany({
                    data: affectedComponents.map((componentId) => ({ maintenanceId: id, componentId })),
                });
            }
        }

        // When IN_PROGRESS, set linked components to UNDER_MAINTENANCE
        if (status === 'IN_PROGRESS') {
            const links = await syncMaintenanceComponentsForStatus(id, 'IN_PROGRESS');
            if (isTransition && before) {
                notifyMaintenanceStarted(name ?? before.name, links.map((l) => l.componentId))
                    .catch((err) => console.error('[maintenance started notify] failed:', err));
            }
        }

        // When COMPLETED, revert linked components to OPERATIONAL
        if (status === 'COMPLETED') {
            const links = await syncMaintenanceComponentsForStatus(id, 'COMPLETED');
            if (isTransition && before) {
                notifyMaintenanceCompleted(name ?? before.name, links.map((l) => l.componentId))
                    .catch((err) => console.error('[maintenance completed notify] failed:', err));
            }
        }

        const maintenance = await prisma.scheduledMaintenance.findUnique({
            where: { id },
            include: {
                updates: { orderBy: { createdAt: 'desc' } },
                components: { include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } } },
            },
        });
        return NextResponse.json(maintenance);
    } catch {
        return NextResponse.json({ error: 'Maintenance not found' }, { status: 404 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    try {
        // Revert component statuses before deleting
        const links = await prisma.maintenanceComponent.findMany({ where: { maintenanceId: id } });
        if (links.length > 0) {
            await Promise.all(
                links.map((link) =>
                    prisma.statusComponent.update({ where: { id: link.componentId }, data: { status: 'OPERATIONAL' } }),
                ),
            );
        }
        await prisma.scheduledMaintenance.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Maintenance not found' }, { status: 404 });
    }
}
