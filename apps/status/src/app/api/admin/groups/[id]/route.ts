import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';

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

    const { name, order, parentId, defaultOpen } = body as {
        name?: string;
        order?: number;
        parentId?: string | null;
        defaultOpen?: boolean;
    };
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (order !== undefined) data.order = Number(order);
    if (parentId !== undefined) data.parentId = parentId ?? null;
    if (defaultOpen !== undefined) data.defaultOpen = Boolean(defaultOpen);

    try {
        const group = await prisma.statusGroup.update({
            where: { id },
            data,
            include: { components: { orderBy: { order: 'asc' } } },
        });
        return NextResponse.json(group);
    } catch {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    try {
        const group = await prisma.statusGroup.findUnique({ where: { id } });
        if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

        // Move child groups to this group's parent (promote one level)
        await prisma.statusGroup.updateMany({ where: { parentId: id }, data: { parentId: group.parentId } });
        // Ungroup direct components (move to root)
        await prisma.statusComponent.updateMany({ where: { groupId: id }, data: { groupId: null } });
        await prisma.statusGroup.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
}
