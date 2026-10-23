import { NextResponse } from 'next/server';
import { SITE } from '@/lib/site';
import { GET as getFullStatus, type StatusSummary } from '../route';

export const revalidate = 0;

/**
 * GET /api/status/summary: a small, cacheable snapshot for embedding the
 * current status elsewhere (the Emberly site footer, badges, bots).
 *
 * Built from the full /api/status payload so the indicator always matches
 * what the status page itself shows.
 */
export interface StatusSummaryLite {
    page: { name: string; url: string };
    status: {
        indicator: 'NONE' | 'MINOR' | 'MAJOR' | 'CRITICAL';
        description: string;
        /** True while any maintenance window is in progress */
        maintenance: boolean;
    };
    incidents: { id: string; name: string; status: string; impact: string; url: string; startedAt: string }[];
    maintenances: {
        id: string;
        name: string;
        status: string;
        url: string;
        scheduledStart: string;
        scheduledEnd: string;
    }[];
    updatedAt: string;
}

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const CACHE_MS = 30_000;
let cached: { at: number; body: StatusSummaryLite } | null = null;

export function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS });
}

export async function GET() {
    if (cached && Date.now() - cached.at < CACHE_MS) {
        return respond(cached.body);
    }

    const res = await getFullStatus();
    if (!res.ok) {
        return NextResponse.json(
            { error: 'Status unavailable' },
            { status: 503, headers: { ...CORS, 'Cache-Control': 'no-store' } },
        );
    }
    const full = (await res.json()) as StatusSummary;

    const body: StatusSummaryLite = {
        page: { name: SITE.statusName, url: SITE.statusUrl },
        status: {
            ...full.status,
            maintenance: full.maintenances.some((m) => m.status === 'IN_PROGRESS'),
        },
        incidents: full.incidents.map((i) => ({
            id: i.id,
            name: i.name,
            status: i.status,
            impact: i.impact,
            url: `${SITE.statusUrl}/incidents/${i.id}`,
            startedAt: i.startedAt,
        })),
        maintenances: full.maintenances.map((m) => ({
            id: m.id,
            name: m.name,
            status: m.status,
            url: `${SITE.statusUrl}/maintenances/${m.id}`,
            scheduledStart: m.scheduledStart,
            scheduledEnd: m.scheduledEnd,
        })),
        updatedAt: new Date().toISOString(),
    };

    cached = { at: Date.now(), body };
    return respond(body);
}

function respond(body: StatusSummaryLite) {
    return NextResponse.json(body, {
        headers: {
            ...CORS,
            'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60',
        },
    });
}
