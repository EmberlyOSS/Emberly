import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getRecentActivity } from '@/lib/activity';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isAdmin(session.user?.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const activities = await getRecentActivity(15);

        return NextResponse.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
