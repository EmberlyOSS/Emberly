import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { SubscriberEvent } from '@prisma/client';
import { SITE, STATUS_HOST } from '@/lib/site';

const DISCORD_WEBHOOK_RE = /^https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/i;
const APP_URL = SITE.statusUrl;

const ALL_EVENTS: SubscriberEvent[] = [
    'INCIDENT_CREATED',
    'INCIDENT_UPDATED',
    'INCIDENT_RESOLVED',
    'MAINTENANCE_SCHEDULED',
    'MAINTENANCE_UPDATED',
];

// POST /api/status/subscribe/webhook: optionally scoped to specific
// components/groups and event types. Re-submitting the same URL updates preferences.
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const webhookUrl = typeof body?.webhookUrl === 'string' ? body.webhookUrl.trim() : null;

        if (!webhookUrl || !DISCORD_WEBHOOK_RE.test(webhookUrl)) {
            return NextResponse.json(
                { error: 'A valid Discord webhook URL is required.' },
                { status: 400 },
            );
        }

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

        const existing = await prisma.webhookSubscriber.findUnique({ where: { webhookUrl } });
        if (existing) {
            await prisma.webhookSubscriber.update({
                where: { webhookUrl },
                data: {
                    events,
                    components: { set: validComponents.map((c) => ({ id: c.id })) },
                    groups: { set: validGroups.map((g) => ({ id: g.id })) },
                },
            });
            return NextResponse.json({ ok: true, message: 'Preferences updated.' });
        }

        await prisma.webhookSubscriber.create({
            data: {
                webhookUrl,
                events,
                components: { connect: validComponents.map((c) => ({ id: c.id })) },
                groups: { connect: validGroups.map((g) => ({ id: g.id })) },
            },
        });

        // Send a test/confirmation embed to the Discord channel
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [
                    {
                        title: '✅ Subscribed to Emberly Status',
                        description: `This channel will now receive incident and maintenance notifications from [${STATUS_HOST}](${APP_URL}).`,
                        color: 0x16a34a,
                        footer: { text: 'Emberly Status' },
                        timestamp: new Date().toISOString(),
                    },
                ],
            }),
        });

        return NextResponse.json({ ok: true, message: 'Discord channel subscribed successfully.' });
    } catch {
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}

// DELETE /api/status/subscribe/webhook?token=...
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
    }

    const subscriber = await prisma.webhookSubscriber.findUnique({ where: { token } });
    if (!subscriber) {
        return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
    }

    await prisma.webhookSubscriber.delete({ where: { token } });
    return NextResponse.json({ ok: true });
}
