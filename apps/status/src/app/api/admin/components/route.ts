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

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const components = await prisma.statusComponent.findMany({
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        include: { group: { select: { id: true, name: true } } },
    });

    return NextResponse.json(components);
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

    const { name, description, location, status, groupId, order, showUptime } = body as {
        name?: string;
        description?: string;
        location?: string | null;
        status?: ComponentStatus;
        groupId?: string;
        order?: number;
        showUptime?: boolean;
    };

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (location !== undefined && location !== null && String(location).trim().length > 60) {
        return NextResponse.json({ error: 'location must be 60 characters or fewer' }, { status: 400 });
    }
    if (status && !VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    let computedOrder = typeof order === 'number' ? order : undefined;
    if (computedOrder === undefined) {
        const resolvedGroupId = groupId ? String(groupId) : null;
        // Components and subgroups of the same parent share one order sequence
        // so they can be interleaved/reordered against each other, not just
        // within their own type.
        const [compAgg, groupAgg] = await Promise.all([
            prisma.statusComponent.aggregate({ where: { groupId: resolvedGroupId }, _max: { order: true } }),
            prisma.statusGroup.aggregate({ where: { parentId: resolvedGroupId }, _max: { order: true } }),
        ]);
        computedOrder = Math.max(compAgg._max.order ?? -1, groupAgg._max.order ?? -1) + 1;
    }

    const component = await prisma.statusComponent.create({
        data: {
            name: name.trim(),
            description: description ? String(description).trim() : null,
            location: location ? String(location).trim() : null,
            status: status ?? 'OPERATIONAL',
            groupId: groupId ? String(groupId) : null,
            order: computedOrder,
            showUptime: showUptime !== false,
        },
        include: { group: { select: { id: true, name: true } } },
    });

    return NextResponse.json(component, { status: 201 });
}
