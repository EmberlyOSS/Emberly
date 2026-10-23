import { notifyIncidentCreated, notifyIncidentUpdated, notifyIncidentResolved, notifyMaintenanceScheduled } from '@/lib/status-notify';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';

/**
 * POST /api/admin/status-notify
 * Body: { type: 'incident_created'|'incident_updated'|'incident_resolved'|'maintenance_scheduled', ...fields }
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let body: Record<string, string>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { type } = body;

    try {
        if (type === 'incident_created') {
            await notifyIncidentCreated(body.name, body.impact ?? 'minor');
        } else if (type === 'incident_updated') {
            await notifyIncidentUpdated(body.name, body.updateBody ?? '');
        } else if (type === 'incident_resolved') {
            await notifyIncidentResolved(body.name);
        } else if (type === 'maintenance_scheduled') {
            await notifyMaintenanceScheduled(body.title, body.scheduledAt ?? '', body.scheduledEnd ?? '');
        } else {
            return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[admin/status-notify] Error:', err);
        return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
    }
}
