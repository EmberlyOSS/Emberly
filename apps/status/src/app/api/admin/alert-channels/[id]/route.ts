import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import type { AlertChannelType } from '@prisma/client';

const VALID_TYPES: AlertChannelType[] = ['DISCORD_WEBHOOK', 'SLACK_WEBHOOK', 'GENERIC_WEBHOOK', 'EMAIL'];

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

    const { name, type, config, enabled } = body as {
        name?: string;
        type?: AlertChannelType;
        config?: Record<string, unknown>;
        enabled?: boolean;
    };

    if (type && !VALID_TYPES.includes(type)) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (type !== undefined) data.type = type;
    if (config !== undefined) data.config = config as import('@prisma/client').Prisma.InputJsonValue;
    if (enabled !== undefined) data.enabled = Boolean(enabled);

    try {
        const channel = await prisma.alertChannel.update({ where: { id }, data });
        return NextResponse.json(channel);
    } catch {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    try {
        await prisma.alertChannel.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }
}
