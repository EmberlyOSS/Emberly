import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import type { MonitorType, MonitorStatus, MonitorBodyMatchType } from '@prisma/client';

const VALID_TYPES: MonitorType[] = ['HTTP', 'PING', 'TCP'];
const VALID_STATUSES: MonitorStatus[] = ['ACTIVE', 'PAUSED', 'DELETED'];
const VALID_BODY_MATCH_TYPES: MonitorBodyMatchType[] = ['NONE', 'CONTAINS', 'REGEX', 'JSON_PATH'];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    const monitor = await prisma.monitor.findUnique({
        where: { id },
        include: {
            checks: { orderBy: { checkedAt: 'desc' }, take: 100 },
            alertRules: { include: { channel: true } },
        },
    });
    if (!monitor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(monitor);
}

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

    const { name, type, target, port, interval, timeout, status, componentId, headers, expectedStatusCodes, expectedBodyContains, bodyMatchType, expectedBodyValue } = body as {
        name?: string;
        type?: MonitorType;
        target?: string;
        port?: number | null;
        interval?: number;
        timeout?: number;
        status?: MonitorStatus;
        componentId?: string | null;
        headers?: Record<string, string> | null;
        expectedStatusCodes?: number[];
        expectedBodyContains?: string | null;
        bodyMatchType?: MonitorBodyMatchType;
        expectedBodyValue?: string | null;
    };

    if (type && !VALID_TYPES.includes(type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    if (status && !VALID_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    if (expectedStatusCodes && (!Array.isArray(expectedStatusCodes) || expectedStatusCodes.some((c) => !Number.isInteger(c) || c < 100 || c > 599))) {
        return NextResponse.json({ error: 'expectedStatusCodes must be valid HTTP status codes' }, { status: 400 });
    }
    if (headers && (typeof headers !== 'object' || Array.isArray(headers) || Object.values(headers).some((v) => typeof v !== 'string'))) {
        return NextResponse.json({ error: 'headers must be a flat object of string values' }, { status: 400 });
    }
    if (bodyMatchType && !VALID_BODY_MATCH_TYPES.includes(bodyMatchType)) {
        return NextResponse.json({ error: 'Invalid bodyMatchType' }, { status: 400 });
    }
    if (bodyMatchType === 'REGEX' && expectedBodyContains) {
        try { new RegExp(expectedBodyContains); } catch { return NextResponse.json({ error: 'Invalid regex pattern' }, { status: 400 }); }
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (type !== undefined) data.type = type;
    if (target !== undefined) data.target = String(target).trim();
    if (port !== undefined) data.port = port !== null ? Number(port) : null;
    if (interval !== undefined) data.interval = Math.max(30, Number(interval));
    if (timeout !== undefined) data.timeout = Math.max(5, Number(timeout));
    if (status !== undefined) data.status = status;
    if (componentId !== undefined) data.componentId = componentId;
    if (headers !== undefined) data.headers = headers && Object.keys(headers).length > 0 ? headers : null;
    if (expectedStatusCodes !== undefined) data.expectedStatusCodes = expectedStatusCodes;
    if (expectedBodyContains !== undefined) data.expectedBodyContains = expectedBodyContains ? String(expectedBodyContains).trim() : null;
    if (bodyMatchType !== undefined) data.bodyMatchType = bodyMatchType;
    if (expectedBodyValue !== undefined) data.expectedBodyValue = expectedBodyValue ? String(expectedBodyValue).trim() : null;

    try {
        const monitor = await prisma.monitor.update({ where: { id }, data });
        return NextResponse.json(monitor);
    } catch {
        return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    try {
        // Soft delete: also release componentId, since it's @unique at the
        // DB level regardless of status. Without this, a deleted monitor
        // keeps permanently occupying its component's one monitor slot,
        // even though it's invisible everywhere the UI filters out DELETED.
        await prisma.monitor.update({ where: { id }, data: { status: 'DELETED', componentId: null } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }
}
