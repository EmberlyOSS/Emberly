import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import type { IncidentStatus, ComponentStatus } from '@prisma/client';
import { notifyIncidentResolved } from '@/lib/status-notify';

const VALID_STATUSES: IncidentStatus[] = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'];
const VALID_COMPONENT_STATUSES: ComponentStatus[] = [
    'OPERATIONAL', 'DEGRADED_PERFORMANCE', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE', 'UNDER_MAINTENANCE',
];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    const incident = await prisma.incident.findUnique({
        where: { id },
        include: {
            updates: { orderBy: { createdAt: 'desc' } },
            components: { include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } } },
        },
    });
    if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(incident);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { name, status, impact, affectedComponents, postmortemBody, postmortemPublished } = body as {
        name?: string;
        status?: IncidentStatus;
        impact?: string;
        affectedComponents?: { componentId: string; status: ComponentStatus }[];
        postmortemBody?: string | null;
        // A toggle rather than a raw timestamp: the client shouldn't be
        // trusted to send its own publish time, and "already published,
        // still editing the body" shouldn't reset it.
        postmortemPublished?: boolean;
    };

    if (status && !VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (affectedComponents) {
        for (const ac of affectedComponents) {
            if (!VALID_COMPONENT_STATUSES.includes(ac.status)) {
                return NextResponse.json({ error: `Invalid component status: ${ac.status}` }, { status: 400 });
            }
        }
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (impact !== undefined) data.impact = String(impact).toLowerCase();
    if (status !== undefined) {
        data.status = status;
        if (status === 'RESOLVED') data.resolvedAt = new Date();
    }
    if (postmortemBody !== undefined) data.postmortemBody = postmortemBody ? String(postmortemBody) : null;
    if (postmortemPublished !== undefined) {
        data.postmortemPublishedAt = postmortemPublished ? new Date() : null;
    }

    try {
        // Update incident fields
        const incident = await prisma.incident.update({
            where: { id },
            data,
            include: {
                updates: { orderBy: { createdAt: 'desc' } },
                components: { include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } } },
            },
        });

        // Replace component links if provided
        if (affectedComponents !== undefined) {
            // Delete old links
            await prisma.incidentComponent.deleteMany({ where: { incidentId: id } });
            // Create new links
            if (affectedComponents.length > 0) {
                await prisma.incidentComponent.createMany({
                    data: affectedComponents.map((ac) => ({
                        incidentId: id,
                        componentId: ac.componentId,
                        status: ac.status,
                    })),
                });
                // Apply statuses to components
                await Promise.all(
                    affectedComponents.map((ac) =>
                        prisma.statusComponent.update({ where: { id: ac.componentId }, data: { status: ac.status } }),
                    ),
                );
            }
        }

        // When resolved, revert all linked components to OPERATIONAL
        if (status === 'RESOLVED') {
            const links = await prisma.incidentComponent.findMany({ where: { incidentId: id } });
            if (links.length > 0) {
                await Promise.all(
                    links.map((link) =>
                        prisma.statusComponent.update({ where: { id: link.componentId }, data: { status: 'OPERATIONAL' } }),
                    ),
                );
            }
            notifyIncidentResolved(
                incident.name,
                links.map((link) => link.componentId),
            ).catch((err) => console.error('[incident resolved notify] failed:', err));
        }

        // Re-fetch with updated components
        const updated = await prisma.incident.findUnique({
            where: { id },
            include: {
                updates: { orderBy: { createdAt: 'desc' } },
                components: { include: { component: { select: { id: true, name: true, group: { select: { name: true } } } } } },
            },
        });
        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user?.role, 'canAccessAdmin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    try {
        // Revert component statuses before deleting
        const links = await prisma.incidentComponent.findMany({ where: { incidentId: id } });
        if (links.length > 0) {
            await Promise.all(
                links.map((link) =>
                    prisma.statusComponent.update({ where: { id: link.componentId }, data: { status: 'OPERATIONAL' } }),
                ),
            );
        }
        await prisma.incident.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }
}
