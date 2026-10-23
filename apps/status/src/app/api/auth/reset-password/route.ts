import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/hashing';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const { email, token, password } = await req.json();
    if (!email || !token || !password) {
        return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
    }
    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record || record.identifier !== email || record.expires < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 });
    }
    // Update password
    await prisma.user.update({
        where: { email },
        data: { hashedPassword: await hashPassword(password) },
    });
    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.json({ success: true });
}
