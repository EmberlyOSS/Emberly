import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
    getStatusPageSettings,
    RECENT_HISTORY_DAY_OPTIONS,
    type StatusPageConfig,
    updateStatusPageSettings,
} from '@/lib/statusPageSettings';

const VALID_DISPLAY = ['COMPONENTS', 'RESPONSE_TIMES', 'BOTH'] as const;

export async function GET() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(await getStatusPageSettings());
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const patch: Partial<StatusPageConfig> = {};

    if (body?.homePageDisplay !== undefined) {
        if (!VALID_DISPLAY.includes(body.homePageDisplay)) {
            return NextResponse.json(
                { error: 'homePageDisplay must be one of COMPONENTS, RESPONSE_TIMES, BOTH.' },
                { status: 400 },
            );
        }
        patch.homePageDisplay = body.homePageDisplay;
    }
    if (body?.showRecentHistory !== undefined) {
        if (typeof body.showRecentHistory !== 'boolean') {
            return NextResponse.json({ error: 'showRecentHistory must be a boolean.' }, { status: 400 });
        }
        patch.showRecentHistory = body.showRecentHistory;
    }
    if (body?.recentHistoryDays !== undefined) {
        if (!(RECENT_HISTORY_DAY_OPTIONS as readonly number[]).includes(body.recentHistoryDays)) {
            return NextResponse.json(
                { error: `recentHistoryDays must be one of ${RECENT_HISTORY_DAY_OPTIONS.join(', ')}.` },
                { status: 400 },
            );
        }
        patch.recentHistoryDays = body.recentHistoryDays;
    }
    if (!Object.keys(patch).length) {
        return NextResponse.json({ error: 'No valid settings provided.' }, { status: 400 });
    }

    return NextResponse.json(await updateStatusPageSettings(patch));
}
