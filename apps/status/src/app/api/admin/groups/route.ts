import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const groups = await prisma.statusGroup.findMany({
        orderBy: { order: 'asc' },
        include: { components: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json(groups);
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

    const { name, order, parentId, defaultOpen } = body as {
        name?: string;
        order?: number;
        parentId?: string | null;
        defaultOpen?: boolean;
    };

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    let computedOrder = typeof order === 'number' ? order : undefined;
    if (computedOrder === undefined) {
        const resolvedParentId = parentId ?? null;
        // Subgroups and components of the same parent share one order sequence
        // so they can be interleaved/reordered against each other, not just
        // within their own type.
        const [groupAgg, compAgg] = await Promise.all([
            prisma.statusGroup.aggregate({ where: { parentId: resolvedParentId }, _max: { order: true } }),
            prisma.statusComponent.aggregate({ where: { groupId: resolvedParentId }, _max: { order: true } }),
        ]);
        computedOrder = Math.max(groupAgg._max.order ?? -1, compAgg._max.order ?? -1) + 1;
    }

    const group = await prisma.statusGroup.create({
        data: {
            name: name.trim(),
            order: computedOrder,
            parentId: parentId ?? null,
            defaultOpen: defaultOpen ?? true,
        },
        include: { components: true },
    });

    return NextResponse.json(group, { status: 201 });
}
