import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import type { ComponentStatus } from '@prisma/client';


const VALID_STATUSES: ComponentStatus[] = [
    'OPERATIONAL',
    'DEGRADED_PERFORMANCE',
    'PARTIAL_OUTAGE',
    'MAJOR_OUTAGE',
    'UNDER_MAINTENANCE',
];

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

    const { name, description, location, status, groupId, order, showUptime } = body as {
        name?: string;
        description?: string;
        location?: string | null;
        status?: ComponentStatus;
        groupId?: string | null;
        order?: number;
        showUptime?: boolean;
    };

    if (location !== undefined && location !== null && String(location).trim().length > 60) {
        return NextResponse.json({ error: 'location must be 60 characters or fewer' }, { status: 400 });
    }
    if (status && !VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (description !== undefined) data.description = description ? String(description).trim() : null;
    if (location !== undefined) data.location = location ? String(location).trim() : null;
    if (status !== undefined) data.status = status;
    if (groupId !== undefined) data.groupId = groupId ?? null;
    if (order !== undefined) data.order = Number(order);
    if (showUptime !== undefined) data.showUptime = Boolean(showUptime);

    try {
        const component = await prisma.statusComponent.update({
            where: { id },
            data,
            include: { group: { select: { id: true, name: true } } },
        });
        return NextResponse.json(component);
    } catch {
        return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    try {
        await prisma.statusComponent.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }
}
