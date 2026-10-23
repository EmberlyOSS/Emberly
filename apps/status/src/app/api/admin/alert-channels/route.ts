import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import type { AlertChannelType } from '@prisma/client';

const VALID_TYPES: AlertChannelType[] = ['DISCORD_WEBHOOK', 'SLACK_WEBHOOK', 'GENERIC_WEBHOOK', 'EMAIL'];

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const channels = await prisma.alertChannel.findMany({
        orderBy: { name: 'asc' },
        include: { rules: { include: { monitor: { select: { id: true, name: true } } } } },
    });

    return NextResponse.json(channels);
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

    const { name, type, config, enabled } = body as {
        name?: string;
        type?: AlertChannelType;
        config?: Record<string, unknown>;
        enabled?: boolean;
    };

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!type || !VALID_TYPES.includes(type)) {
        return NextResponse.json({ error: 'Valid type is required' }, { status: 400 });
    }
    if (!config || typeof config !== 'object') {
        return NextResponse.json({ error: 'config is required' }, { status: 400 });
    }

    const channel = await prisma.alertChannel.create({
        data: {
            name: name.trim(),
            type,
            config: config as import('@prisma/client').Prisma.InputJsonValue,
            enabled: enabled !== false,
        },
    });

    return NextResponse.json(channel, { status: 201 });
}
