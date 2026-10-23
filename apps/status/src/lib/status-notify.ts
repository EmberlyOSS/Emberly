import { prisma } from '@/lib/prisma';
import { emailTemplates, sendEmail } from '@/emails/client';
import type { SubscriberEvent } from '@prisma/client';
import { SITE } from '@/lib/site';

const APP_URL = SITE.statusUrl;
const STATUS_URL = `${APP_URL}`;

function unsubscribeUrl(token: string) {
    return `${APP_URL}/api/status/subscribe/unsubscribe?token=${encodeURIComponent(token)}`;
}

function formatDateTime(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Resolve the parent group ids for a set of component ids, so group-level subscribers still match. */
async function resolveGroupIds(componentIds: string[]): Promise<string[]> {
    if (componentIds.length === 0) return [];
    const components = await prisma.statusComponent.findMany({
        where: { id: { in: componentIds } },
        select: { groupId: true },
    });
    return [...new Set(components.map((c) => c.groupId).filter((id): id is string => !!id))];
}

/** "Group · Component, Group · Component" summary for embed fields: null if nothing to show. */
async function describeAffected(componentIds: string[]): Promise<string | null> {
    if (componentIds.length === 0) return null;
    const components = await prisma.statusComponent.findMany({
        where: { id: { in: componentIds } },
        select: { name: true, group: { select: { name: true } } },
    });
    if (components.length === 0) return null;
    return components.map((c) => (c.group ? `${c.group.name} · ${c.name}` : c.name)).join('\n');
}

/** A subscriber matches if they picked no scope at all (global), or picked one of the affected components/groups. */
function scopeFilter(componentIds: string[], groupIds: string[]) {
    return {
        OR: [
            { components: { none: {} }, groups: { none: {} } },
            ...(componentIds.length ? [{ components: { some: { id: { in: componentIds } } } }] : []),
            ...(groupIds.length ? [{ groups: { some: { id: { in: groupIds } } } }] : []),
        ],
    };
}

/** Fetch verified subscribers opted into this event and scoped to these components (or global). */
async function getSubscribers(event: SubscriberEvent, componentIds: string[]) {
    const groupIds = await resolveGroupIds(componentIds);
    return prisma.statusSubscriber.findMany({
        where: {
            verified: true,
            events: { has: event },
            ...scopeFilter(componentIds, groupIds),
        },
    });
}

/** Fetch public Discord webhook subscribers opted into this event and scoped to these components (or global). */
async function getWebhookSubscribers(event: SubscriberEvent, componentIds: string[]) {
    const groupIds = await resolveGroupIds(componentIds);
    return prisma.webhookSubscriber.findMany({
        where: {
            events: { has: event },
            ...scopeFilter(componentIds, groupIds),
        },
    });
}

/**
 * Admin-configured alert channels (Discord/Slack/Generic) that should receive
 * this notification. A channel with no AlertRule attached is treated as a
 * global/catch-all channel and always fires: that's the original behavior,
 * kept for anyone who hasn't set up scoping. A channel WITH one or more
 * AlertRules only fires when the affected monitor or component group matches
 * one of its rules, so e.g. a channel scoped to "Server A" doesn't also get
 * notifications for "Server B".
 */
async function getScopedAlertChannels(componentIds: string[]) {
    const [groupIds, monitors] = await Promise.all([
        resolveGroupIds(componentIds),
        componentIds.length
            ? prisma.monitor.findMany({ where: { componentId: { in: componentIds } }, select: { id: true } })
            : Promise.resolve([]),
    ]);
    const monitorIds = monitors.map((m) => m.id);

    const channels = await prisma.alertChannel.findMany({
        where: { enabled: true },
        include: { rules: { where: { enabled: true }, select: { monitorId: true, groupId: true } } },
    });

    return channels.filter((channel) => {
        if (channel.rules.length === 0) return true;
        return channel.rules.some((rule) =>
            (rule.monitorId && monitorIds.includes(rule.monitorId)) ||
            (rule.groupId && groupIds.includes(rule.groupId)),
        );
    });
}

/** Send a templated email to every subscriber scoped to this event/components */
async function broadcastToSubscribers(
    event: SubscriberEvent,
    componentIds: string[],
    buildTemplate: (unsubUrl: string) => { subject: string; html: string; text?: string },
) {
    const subscribers = await getSubscribers(event, componentIds);
    if (subscribers.length === 0) return;

    await Promise.allSettled(
        subscribers.map((sub) => {
            const t = buildTemplate(unsubscribeUrl(sub.token));
            return sendEmail({ to: sub.email, subject: t.subject, html: t.html, text: t.text });
        }),
    );
}

/** Fire a Discord webhook with a rich embed */
async function fireDiscordWebhook(webhookUrl: string, embed: object) {
    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] }),
        });
        if (!res.ok) {
            console.warn(`[Discord webhook] Non-OK response: ${res.status}`);
        }
    } catch (err) {
        console.error('[Discord webhook] Failed to send:', err);
    }
}

interface EmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

interface EmbedInput {
    title: string;
    description: string;
    color: number;
    url?: string;
    fields?: EmbedField[];
}

/** Fire all enabled Discord/Slack/Generic webhook alert channels, plus scoped public webhook subscribers */
async function broadcastToWebhooks(event: SubscriberEvent, componentIds: string[], embed: EmbedInput) {
    const [adminChannels, publicSubscribers] = await Promise.all([
        getScopedAlertChannels(componentIds),
        getWebhookSubscribers(event, componentIds),
    ]);

    const discordEmbed = {
        ...embed,
        footer: { text: 'Emberly Status' },
        timestamp: new Date().toISOString(),
    };

    const slackText = [
        `*${embed.title}*`,
        embed.description,
        ...(embed.fields?.map((f) => `*${f.name}:* ${f.value.replace(/\n/g, ', ')}`) ?? []),
    ].join('\n');

    const tasks: Promise<unknown>[] = [];

    // Admin-configured channels (Discord, Slack, Generic): already scoped by getScopedAlertChannels above
    for (const channel of adminChannels) {
        const config = channel.config as Record<string, string>;
        if (!config?.url) continue;

        if (channel.type === 'DISCORD_WEBHOOK') {
            tasks.push(fireDiscordWebhook(config.url, discordEmbed));
        } else if (channel.type === 'SLACK_WEBHOOK') {
            tasks.push(
                fetch(config.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: slackText }),
                }),
            );
        } else if (channel.type === 'GENERIC_WEBHOOK') {
            tasks.push(
                fetch(config.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(embed),
                }),
            );
        }
    }

    // Public Discord webhook subscribers, scoped to this event/components
    for (const sub of publicSubscribers) {
        tasks.push(fireDiscordWebhook(sub.webhookUrl, discordEmbed));
    }

    await Promise.allSettled(tasks);
}

// ── Public notification functions ───────────────────────────────────────────
// componentIds scopes the notification to subscribers who picked one of these
// components (or their parent group), plus subscribers with no scope selected
// (global). Pass an empty array when the affected components aren't known
// (e.g. external webhook sources): only global subscribers will be notified.

export async function notifyIncidentCreated(incidentName: string, impact: string, componentIds: string[] = []) {
    const impactColors: Record<string, number> = {
        critical: 0xdc2626,
        major: 0xea580c,
        minor: 0xca8a04,
        maintenance: 0x2563eb,
    };
    const affected = await describeAffected(componentIds);

    await Promise.allSettled([
        broadcastToSubscribers('INCIDENT_CREATED', componentIds, (unsubUrl) => {
            const t = emailTemplates.statusIncidentCreated(incidentName, impact, STATUS_URL, unsubUrl);
            return { subject: t.subject, html: t.html!, text: t.text };
        }),
        broadcastToWebhooks('INCIDENT_CREATED', componentIds, {
            title: `🔴 New Incident: ${incidentName}`,
            description: 'Our team is investigating.',
            color: impactColors[impact] ?? 0x6b7280,
            url: STATUS_URL,
            fields: [
                { name: 'Impact', value: impact.charAt(0).toUpperCase() + impact.slice(1), inline: true },
                ...(affected ? [{ name: 'Affected', value: affected, inline: true }] : []),
            ],
        }),
    ]);
}

export async function notifyIncidentUpdated(incidentName: string, updateBody: string, componentIds: string[] = []) {
    const affected = await describeAffected(componentIds);

    await Promise.allSettled([
        broadcastToSubscribers('INCIDENT_UPDATED', componentIds, (unsubUrl) => {
            const t = emailTemplates.statusIncidentUpdated(incidentName, updateBody, STATUS_URL, unsubUrl);
            return { subject: t.subject, html: t.html!, text: t.text };
        }),
        broadcastToWebhooks('INCIDENT_UPDATED', componentIds, {
            title: `🟡 Incident Update: ${incidentName}`,
            description: updateBody,
            color: 0xca8a04,
            url: STATUS_URL,
            fields: affected ? [{ name: 'Affected', value: affected, inline: false }] : undefined,
        }),
    ]);
}

export async function notifyIncidentResolved(incidentName: string, componentIds: string[] = []) {
    const affected = await describeAffected(componentIds);

    await Promise.allSettled([
        broadcastToSubscribers('INCIDENT_RESOLVED', componentIds, (unsubUrl) => {
            const t = emailTemplates.statusIncidentResolved(incidentName, STATUS_URL, unsubUrl);
            return { subject: t.subject, html: t.html!, text: t.text };
        }),
        broadcastToWebhooks('INCIDENT_RESOLVED', componentIds, {
            title: `✅ Incident Resolved: ${incidentName}`,
            description: 'This incident has been resolved. All systems are operational.',
            color: 0x16a34a,
            url: STATUS_URL,
            fields: affected ? [{ name: 'Affected', value: affected, inline: false }] : undefined,
        }),
    ]);
}

export async function notifyMaintenanceScheduled(
    title: string,
    scheduledStart: string,
    scheduledEnd: string,
    componentIds: string[] = [],
) {
    const affected = await describeAffected(componentIds);
    const window = scheduledEnd ? `${formatDateTime(scheduledStart)} → ${formatDateTime(scheduledEnd)}` : formatDateTime(scheduledStart);

    await Promise.allSettled([
        broadcastToSubscribers('MAINTENANCE_SCHEDULED', componentIds, (unsubUrl) => {
            const t = emailTemplates.statusMaintenanceScheduled(title, scheduledStart, STATUS_URL, unsubUrl);
            return { subject: t.subject, html: t.html!, text: t.text };
        }),
        broadcastToWebhooks('MAINTENANCE_SCHEDULED', componentIds, {
            title: `🔧 Maintenance Scheduled: ${title}`,
            description: 'Some services may be temporarily unavailable during this window.',
            color: 0x2563eb,
            url: STATUS_URL,
            fields: [
                { name: 'Window', value: window, inline: false },
                ...(affected ? [{ name: 'Affected', value: affected, inline: false }] : []),
            ],
        }),
    ]);
}

export async function notifyMaintenanceUpdated(title: string, updateMessage: string, componentIds: string[] = []) {
    const affected = await describeAffected(componentIds);

    await Promise.allSettled([
        broadcastToSubscribers('MAINTENANCE_UPDATED', componentIds, (unsubUrl) => {
            const t = emailTemplates.statusMaintenanceUpdated(title, updateMessage, STATUS_URL, unsubUrl);
            return { subject: t.subject, html: t.html!, text: t.text };
        }),
        broadcastToWebhooks('MAINTENANCE_UPDATED', componentIds, {
            title: `🔧 Maintenance Update: ${title}`,
            description: updateMessage,
            color: 0x2563eb,
            url: STATUS_URL,
            fields: affected ? [{ name: 'Affected', value: affected, inline: false }] : undefined,
        }),
    ]);
}

// Status transitions (start/complete) reuse the MAINTENANCE_UPDATED subscriber
// event rather than adding new enum values: they're still meaningfully
// distinct notifications (title/color/message), just filed under the same
// subscription toggle as other maintenance progress updates.

export async function notifyMaintenanceStarted(title: string, componentIds: string[] = []) {
    const affected = await describeAffected(componentIds);
    const message = 'This maintenance window is now in progress.';

    await Promise.allSettled([
        broadcastToSubscribers('MAINTENANCE_UPDATED', componentIds, (unsubUrl) => {
            const t = emailTemplates.statusMaintenanceUpdated(title, message, STATUS_URL, unsubUrl);
            return { subject: t.subject, html: t.html!, text: t.text };
        }),
        broadcastToWebhooks('MAINTENANCE_UPDATED', componentIds, {
            title: `🔧 Maintenance Started: ${title}`,
            description: message,
            color: 0x2563eb,
            url: STATUS_URL,
            fields: affected ? [{ name: 'Affected', value: affected, inline: false }] : undefined,
        }),
    ]);
}

export async function notifyMaintenanceCompleted(title: string, componentIds: string[] = []) {
    const affected = await describeAffected(componentIds);
    const message = 'This maintenance window has been completed. All affected services are operational.';

    await Promise.allSettled([
        broadcastToSubscribers('MAINTENANCE_UPDATED', componentIds, (unsubUrl) => {
            const t = emailTemplates.statusMaintenanceUpdated(title, message, STATUS_URL, unsubUrl);
            return { subject: t.subject, html: t.html!, text: t.text };
        }),
        broadcastToWebhooks('MAINTENANCE_UPDATED', componentIds, {
            title: `✅ Maintenance Completed: ${title}`,
            description: message,
            color: 0x16a34a,
            url: STATUS_URL,
            fields: affected ? [{ name: 'Affected', value: affected, inline: false }] : undefined,
        }),
    ]);
}
