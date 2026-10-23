import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import type { IncidentStatus } from '@prisma/client';
import { notifyIncidentUpdated } from '@/lib/status-notify';

const VALID_STATUSES: IncidentStatus[] = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { updateBody, status } = body as { updateBody?: string; status?: IncidentStatus };

    if (!updateBody || typeof updateBody !== 'string' || updateBody.trim().length === 0) {
        return NextResponse.json({ error: 'updateBody is required' }, { status: 400 });
    }
    if (status && !VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    try {
        const incident = await prisma.incident.findUnique({ where: { id } });
        if (!incident) return NextResponse.json({ error: 'Incident not found' }, { status: 404 });

        const resolvedStatus = status ?? incident.status;

        const [update] = await prisma.$transaction([
            prisma.incidentUpdate.create({
                data: {
                    body: updateBody.trim(),
                    status: resolvedStatus,
                    incidentId: id,
                },
            }),
            prisma.incident.update({
                where: { id },
                data: {
                    status: resolvedStatus,
                    ...(resolvedStatus === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
                },
            }),
        ]);

        const links = await prisma.incidentComponent.findMany({ where: { incidentId: id }, select: { componentId: true } });
        notifyIncidentUpdated(
            incident.name,
            updateBody.trim(),
            links.map((link) => link.componentId),
        ).catch((err) => console.error('[incident updated notify] failed:', err));

        return NextResponse.json(update, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to add update' }, { status: 500 });
    }
}
