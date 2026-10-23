import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { emailClient } from '@/emails/client';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const { email } = await req.json();
    if (!email) {
        return NextResponse.json({ error: 'Email required.' }, { status: 400 });
    }
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        // Don't reveal if user exists
        return NextResponse.json({ success: true });
    }
    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min expiry
    await prisma.verificationToken.create({
        data: {
            identifier: email,
            token,
            expires,
        },
    });
    // Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    await emailClient.sendTemplate(email, emailClient.emailTemplates.resetPassword(email, resetUrl));
    return NextResponse.json({ success: true });
}
