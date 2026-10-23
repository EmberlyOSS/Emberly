import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';

// GET /api/admin/status-subscribers
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const subscribers = await prisma.statusSubscriber.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            email: true,
            verified: true,
            createdAt: true,
            events: true,
            components: { select: { id: true, name: true } },
            groups: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json(subscribers);
}

// DELETE /api/admin/status-subscribers?id=...
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    await prisma.statusSubscriber.delete({ where: { id } });

    return NextResponse.json({ ok: true });
}
