import { NextResponse } from 'next/server';
import { emailClient } from '@/emails/client';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const { email, token } = await req.json();
    if (!email || !token) {
        return NextResponse.json({ error: 'Missing email or token.' }, { status: 400 });
    }
    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record || record.identifier !== email || record.expires < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 });
    }
    const user = await prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
    });
    await prisma.verificationToken.delete({ where: { token } });
    // Send welcome email
    await emailClient.sendTemplate(user.email!, emailClient.emailTemplates.welcome(user.name || 'User', user.email!));
    return NextResponse.json({ success: true });
}
