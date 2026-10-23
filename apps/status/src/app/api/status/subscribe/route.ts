import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { SubscriberEvent } from '@prisma/client';

const ALL_EVENTS: SubscriberEvent[] = [
    'INCIDENT_CREATED',
    'INCIDENT_UPDATED',
    'INCIDENT_RESOLVED',
    'MAINTENANCE_SCHEDULED',
    'MAINTENANCE_UPDATED',
];

// GET /api/status/subscribe: the signed-in user's current subscription, if any.
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriber = await prisma.statusSubscriber.findUnique({
        where: { userId: session.user.id },
        include: {
            components: { select: { id: true, name: true } },
            groups: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json({ subscriber });
}

// POST /api/status/subscribe: subscribe the signed-in user to status alerts,
// optionally scoped to specific components/groups and event types.
// Re-submitting updates the existing subscription's preferences.
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
        return NextResponse.json({ error: 'You must be signed in to subscribe.' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const requestedEvents = Array.isArray(body?.events)
            ? body.events.filter((e: unknown): e is SubscriberEvent => ALL_EVENTS.includes(e as SubscriberEvent))
            : [];
        const events = requestedEvents.length > 0 ? requestedEvents : ALL_EVENTS;

        const componentIds = Array.isArray(body?.componentIds)
            ? body.componentIds.filter((id: unknown): id is string => typeof id === 'string')
            : [];
        const groupIds = Array.isArray(body?.groupIds)
            ? body.groupIds.filter((id: unknown): id is string => typeof id === 'string')
            : [];

        const [validComponents, validGroups] = await Promise.all([
            componentIds.length
                ? prisma.statusComponent.findMany({ where: { id: { in: componentIds } }, select: { id: true } })
                : [],
            groupIds.length
                ? prisma.statusGroup.findMany({ where: { id: { in: groupIds } }, select: { id: true } })
                : [],
        ]);

        const existing = await prisma.statusSubscriber.findUnique({ where: { userId: session.user.id } });

        if (existing) {
            await prisma.statusSubscriber.update({
                where: { userId: session.user.id },
                data: {
                    events,
                    components: { set: validComponents.map((c) => ({ id: c.id })) },
                    groups: { set: validGroups.map((g) => ({ id: g.id })) },
                },
            });
            return NextResponse.json({ ok: true, message: 'Preferences updated.' });
        }

        // Sign-in requires a verified email (see lib/auth.ts), so the address
        // is already confirmed and no separate double opt-in is needed.
        await prisma.statusSubscriber.create({
            data: {
                email: session.user.email,
                userId: session.user.id,
                verified: true,
                events,
                components: { connect: validComponents.map((c) => ({ id: c.id })) },
                groups: { connect: validGroups.map((g) => ({ id: g.id })) },
            },
        });

        return NextResponse.json({ ok: true, message: 'You are now subscribed to status updates.' });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'An unexpected error occurred.' },
            { status: 500 },
        );
    }
}

// DELETE /api/status/subscribe: unsubscribe the signed-in user.
export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriber = await prisma.statusSubscriber.findUnique({ where: { userId: session.user.id } });
    if (!subscriber) {
        return NextResponse.json({ ok: true });
    }

    await prisma.statusSubscriber.delete({ where: { id: subscriber.id } });

    return NextResponse.json({ ok: true });
}
