import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import { notifyMaintenanceUpdated } from '@/lib/status-notify';

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

    const { message } = body as { message?: string };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const maintenance = await prisma.scheduledMaintenance.findUnique({ where: { id } });
    if (!maintenance) return NextResponse.json({ error: 'Maintenance not found' }, { status: 404 });

    const update = await prisma.maintenanceUpdate.create({
        data: { message: message.trim(), maintenanceId: id },
    });

    const links = await prisma.maintenanceComponent.findMany({ where: { maintenanceId: id }, select: { componentId: true } });
    notifyMaintenanceUpdated(maintenance.name, message.trim(), links.map((l) => l.componentId)).catch((err) => console.error('[maintenance updated notify] failed:', err));

    return NextResponse.json(update, { status: 201 });
}
