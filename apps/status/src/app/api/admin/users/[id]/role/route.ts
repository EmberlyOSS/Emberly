import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only SUPER_ADMIN can update user roles
        if (!isSuperAdmin(session.user?.role)) {
            return NextResponse.json({ error: 'Forbidden - Only Super Admins can modify user roles' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { role } = body;

        // Validate role
        if (!['BASE_USER', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Prevent user from changing their own role
        const user = await prisma.user.findUnique({
            where: { id },
            select: { email: true },
        });

        if (user?.email === session.user?.email) {
            return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 });
        }

        // Update user role
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user role:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
