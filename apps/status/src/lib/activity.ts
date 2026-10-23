import { prisma } from '@/lib/prisma';

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT';
export type EntityType = 'POSITION' | 'BLOG_POST' | 'USER' | 'REVIEW' | 'NEWSLETTER' | 'EMAIL';

interface LogActivityParams {
    action: ActionType;
    entityType: EntityType;
    entityId?: string;
    entityTitle?: string;
    userId?: string;
    userName?: string;
    details?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
    try {
        await prisma.activityLog.create({
            data: {
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                entityTitle: params.entityTitle,
                userId: params.userId,
                userName: params.userName,
                details: params.details,
            },
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

export async function getRecentActivity(limit: number = 10) {
    return prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}
