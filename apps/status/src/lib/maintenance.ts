import { prisma } from '@/lib/prisma';
import { notifyMaintenanceCompleted, notifyMaintenanceStarted } from '@/lib/status-notify';
import type { MaintenanceComponent } from '@prisma/client';

/**
 * Syncs every component linked to a maintenance window to the status that
 * corresponds to IN_PROGRESS/COMPLETED, idempotently: safe to call even if
 * the components are already in that state. Shared between the admin PATCH
 * route and the cron auto-transition check so both apply the exact same
 * side effect.
 */
export async function syncMaintenanceComponentsForStatus(
    maintenanceId: string,
    status: 'IN_PROGRESS' | 'COMPLETED',
): Promise<MaintenanceComponent[]> {
    const links = await prisma.maintenanceComponent.findMany({ where: { maintenanceId } });
    const componentStatus = status === 'IN_PROGRESS' ? 'UNDER_MAINTENANCE' : 'OPERATIONAL';

    await Promise.all(
        links.map((link) =>
            prisma.statusComponent.update({ where: { id: link.componentId }, data: { status: componentStatus } }),
        ),
    );

    return links;
}

/**
 * Starts any NOT_STARTED_YET maintenance whose scheduledStart has passed,
 * and completes any IN_PROGRESS maintenance whose scheduledEnd has passed.
 * Runs at the top of every run-monitors cron tick, before that tick's
 * monitor checks, so a maintenance starting exactly this tick is already
 * IN_PROGRESS by the time down-alert suppression checks for it.
 */
export async function autoTransitionMaintenances(now: Date = new Date()) {
    const toStart = await prisma.scheduledMaintenance.findMany({
        where: { status: 'NOT_STARTED_YET', scheduledStart: { lte: now } },
    });

    for (const m of toStart) {
        await prisma.scheduledMaintenance.update({ where: { id: m.id }, data: { status: 'IN_PROGRESS' } });
        const links = await syncMaintenanceComponentsForStatus(m.id, 'IN_PROGRESS');
        notifyMaintenanceStarted(m.name, links.map((l) => l.componentId))
            .catch((err) => console.error('[maintenance auto-start notify] failed:', err));
    }

    const toComplete = await prisma.scheduledMaintenance.findMany({
        where: { status: 'IN_PROGRESS', scheduledEnd: { lte: now } },
    });

    for (const m of toComplete) {
        await prisma.scheduledMaintenance.update({ where: { id: m.id }, data: { status: 'COMPLETED' } });
        const links = await syncMaintenanceComponentsForStatus(m.id, 'COMPLETED');
        notifyMaintenanceCompleted(m.name, links.map((l) => l.componentId))
            .catch((err) => console.error('[maintenance auto-complete notify] failed:', err));
    }

    return { started: toStart.length, completed: toComplete.length };
}
