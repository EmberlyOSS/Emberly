import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import type { MonitorType, MonitorStatus, MonitorBodyMatchType } from '@prisma/client';

const VALID_TYPES: MonitorType[] = ['HTTP', 'PING', 'TCP'];
const VALID_STATUSES: MonitorStatus[] = ['ACTIVE', 'PAUSED', 'DELETED'];
const VALID_BODY_MATCH_TYPES: MonitorBodyMatchType[] = ['NONE', 'CONTAINS', 'REGEX', 'JSON_PATH'];

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const monitors = await prisma.monitor.findMany({
        where: { status: { not: 'DELETED' } },
        orderBy: { name: 'asc' },
        include: {
            alertRules: {
                include: { channel: { select: { id: true, name: true, type: true } } },
            },
            component: { select: { id: true, name: true, group: { select: { id: true, name: true } } } },
        },
    });

    return NextResponse.json(monitors);
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

    const { name, type, target, port, interval, timeout, componentId, headers, expectedStatusCodes, expectedBodyContains, bodyMatchType, expectedBodyValue } = body as {
        name?: string;
        type?: MonitorType;
        target?: string;
        port?: number;
        interval?: number;
        timeout?: number;
        componentId?: string | null;
        headers?: Record<string, string> | null;
        expectedStatusCodes?: number[];
        expectedBodyContains?: string | null;
        bodyMatchType?: MonitorBodyMatchType;
        expectedBodyValue?: string | null;
    };

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!target || typeof target !== 'string' || target.trim().length === 0) {
        return NextResponse.json({ error: 'target is required' }, { status: 400 });
    }
    if (type && !VALID_TYPES.includes(type)) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
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

    try {
        const monitor = await prisma.monitor.create({
            data: {
                name: name.trim(),
                type: type ?? 'HTTP',
                target: target.trim(),
                port: port ? Number(port) : null,
                interval: interval ? Math.max(30, Number(interval)) : 60,
                timeout: timeout ? Math.max(5, Number(timeout)) : 10,
                componentId: componentId ?? null,
                headers: headers && Object.keys(headers).length > 0 ? headers : undefined,
                expectedStatusCodes: expectedStatusCodes ?? [],
                expectedBodyContains: expectedBodyContains ? String(expectedBodyContains).trim() : null,
                bodyMatchType: bodyMatchType ?? 'NONE',
                expectedBodyValue: expectedBodyValue ? String(expectedBodyValue).trim() : null,
            },
        });

        return NextResponse.json(monitor, { status: 201 });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            return NextResponse.json(
                { error: 'That component already has a monitor linked to it. Unlink or delete the existing one first.' },
                { status: 409 },
            );
        }
        throw err;
    }
}
