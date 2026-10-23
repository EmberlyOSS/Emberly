/**
 * Seeds the Emberly status page with the groups, components and monitors
 * described in docs/emberly-setup.md.
 *
 * Idempotent: everything is matched by name, so re-running only fills in
 * what's missing and never duplicates or overwrites your edits.
 *
 * Usage: bun --env-file=.env scripts/seed-emberly.ts
 */
import type { MonitorBodyMatchType } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

const APP_URL = (process.env.NEXT_PUBLIC_EMBERLY_URL || 'https://embrly.ca').replace(/\/$/, '');
const DOCS_URL = 'https://docs.embrly.ca';
const HEALTH_URL = `${APP_URL}/api/health`;

interface MonitorSpec {
    name: string;
    target: string;
    bodyMatchType?: MonitorBodyMatchType;
    path?: string;
    expected?: string;
}

interface ComponentSpec {
    name: string;
    description?: string;
    showUptime?: boolean;
    monitor?: MonitorSpec;
}

interface GroupSpec {
    name: string;
    defaultOpen?: boolean;
    components: ComponentSpec[];
}

const health = (name: string, path: string, expected: string): MonitorSpec => ({
    name,
    target: HEALTH_URL,
    bodyMatchType: 'JSON_PATH',
    path,
    expected,
});

const GROUPS: GroupSpec[] = [
    {
        name: 'Website',
        components: [
            {
                name: 'Website & dashboard',
                description: 'embrly.ca, sign-in and the dashboard',
                monitor: { name: 'Website', target: APP_URL },
            },
            {
                name: 'API',
                description: 'The Emberly REST API and ShareX/Flameshot uploads',
                // HTTP status only: /api/health returns 503 just when the database is down
                monitor: { name: 'API', target: HEALTH_URL },
            },
        ],
    },
    {
        name: 'Files',
        components: [
            {
                name: 'Uploads & storage',
                description: 'Uploading, storing and deleting files',
                monitor: health('Storage', 'data.checks.storage.status', 'up'),
            },
            // Needs a public canary file and a Cloudflare cache bypass first (see the guide)
            { name: 'File delivery', description: 'Viewing and downloading shared files' },
        ],
    },
    {
        name: 'Links',
        components: [
            // Needs a short link to monitor (see the guide)
            { name: 'Short links', description: 'URL shortener redirects' },
            // Needs a connected test domain to monitor (see the guide)
            { name: 'Custom domains', description: 'Files and links served on your own domain' },
        ],
    },
    {
        name: 'Platform',
        defaultOpen: false,
        components: [
            { name: 'Database', monitor: health('Database', 'data.checks.database.status', 'up') },
            {
                name: 'Cache',
                description: 'Sessions, rate limiting and the job queue',
                monitor: health('Redis', 'data.checks.redis.status', 'up'),
            },
            {
                name: 'Background jobs',
                description: 'Expiring files, emails and notifications',
                monitor: health('Background jobs', 'data.checks.eventQueue.status', 'up'),
            },
        ],
    },
    {
        name: 'Other',
        components: [
            {
                name: 'Documentation',
                description: 'docs.embrly.ca',
                monitor: { name: 'Docs', target: DOCS_URL },
            },
            // No automated check; update by hand or via incidents
            { name: 'Discord bot', showUptime: false },
        ],
    },
];

// Not linked to a component: any degraded subsystem trips it, so it's for alerting only
const STANDALONE_MONITORS: MonitorSpec[] = [health('Overall health', 'data.status', 'ok')];

const MONITOR_DEFAULTS = { type: 'HTTP' as const, interval: 60, timeout: 10, downThreshold: 2 };

async function ensureMonitor(spec: MonitorSpec, componentId: string | null) {
    const existing = await prisma.monitor.findFirst({ where: { name: spec.name, status: { not: 'DELETED' } } });
    if (existing) return 'kept';
    await prisma.monitor.create({
        data: {
            ...MONITOR_DEFAULTS,
            name: spec.name,
            target: spec.target,
            componentId,
            bodyMatchType: spec.bodyMatchType ?? 'NONE',
            expectedBodyContains: spec.path ?? null,
            expectedBodyValue: spec.expected ?? null,
        },
    });
    return 'created';
}

async function main() {
    const log: string[] = [];

    await prisma.statusPageSettings.upsert({
        where: { id: 'singleton' },
        update: {},
        create: { id: 'singleton', homePageDisplay: 'BOTH', showRecentHistory: true, recentHistoryDays: 14 },
    });

    for (const [gi, g] of GROUPS.entries()) {
        let group = await prisma.statusGroup.findFirst({ where: { name: g.name, parentId: null } });
        if (!group) {
            group = await prisma.statusGroup.create({
                data: { name: g.name, order: gi, defaultOpen: g.defaultOpen ?? true },
            });
            log.push(`group      + ${g.name}`);
        }

        for (const [ci, c] of g.components.entries()) {
            let component = await prisma.statusComponent.findFirst({ where: { name: c.name, groupId: group.id } });
            if (!component) {
                component = await prisma.statusComponent.create({
                    data: {
                        name: c.name,
                        description: c.description ?? null,
                        groupId: group.id,
                        order: ci,
                        showUptime: c.showUptime ?? true,
                    },
                });
                log.push(`component  + ${g.name} · ${c.name}`);
            }
            if (c.monitor) {
                // A component can only have one monitor; don't steal an existing link
                const linked = await prisma.monitor.findUnique({ where: { componentId: component.id } });
                const result = await ensureMonitor(c.monitor, linked ? null : component.id);
                if (result === 'created') log.push(`monitor    + ${c.monitor.name} → ${c.name}`);
            }
        }
    }

    for (const m of STANDALONE_MONITORS) {
        if ((await ensureMonitor(m, null)) === 'created') log.push(`monitor    + ${m.name} (alerts only)`);
    }

    console.log(log.length ? log.join('\n') : 'Nothing to do: everything already exists.');
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
