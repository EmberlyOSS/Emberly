import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/hashing';
import { prisma } from '@/lib/prisma';

const PASSWORD_STRENGTH_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 });
    }

    if (!PASSWORD_STRENGTH_RE.test(newPassword)) {
        return NextResponse.json(
            { error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' },
            { status: 400 },
        );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.hashedPassword) {
        return NextResponse.json({ error: 'No password set for this account.' }, { status: 400 });
    }

    const valid = await verifyPassword(currentPassword, user.hashedPassword);
    if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { hashedPassword: await hashPassword(newPassword) },
    });

    return NextResponse.json({ success: true });
}
