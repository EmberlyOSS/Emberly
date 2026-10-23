import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import type { AlertEvent } from '@prisma/client';

const VALID_EVENTS: AlertEvent[] = ['DOWN', 'UP', 'DEGRADED', 'CERT_EXPIRY'];

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const rules = await prisma.alertRule.findMany({
        include: {
            monitor: { select: { id: true, name: true } },
            group: { select: { id: true, name: true } },
            channel: { select: { id: true, name: true, type: true } },
        },
    });

    return NextResponse.json(rules);
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

    const { monitorId, groupId, channelId, events, enabled } = body as {
        monitorId?: string;
        groupId?: string;
        channelId?: string;
        events?: AlertEvent[];
        enabled?: boolean;
    };

    if (!channelId) {
        return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
    }
    if (!monitorId && !groupId) {
        return NextResponse.json({ error: 'Either monitorId or groupId is required' }, { status: 400 });
    }
    if (monitorId && groupId) {
        return NextResponse.json({ error: 'Provide only one of monitorId or groupId, not both' }, { status: 400 });
    }
    if (!events || !Array.isArray(events) || events.length === 0) {
        return NextResponse.json({ error: 'events array is required' }, { status: 400 });
    }
    if (events.some((e) => !VALID_EVENTS.includes(e))) {
        return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const rule = await prisma.alertRule.create({
        data: {
            monitorId: monitorId ?? null,
            groupId: groupId ?? null,
            channelId,
            events,
            enabled: enabled !== false,
        },
        include: {
            monitor: { select: { id: true, name: true } },
            group: { select: { id: true, name: true } },
            channel: { select: { id: true, name: true, type: true } },
        },
    });

    return NextResponse.json(rule, { status: 201 });
}
