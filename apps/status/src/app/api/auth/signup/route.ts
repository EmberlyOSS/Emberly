import { NextResponse } from 'next/server';
import { z } from 'zod';
import { emailTemplates, sendEmail } from '@/emails/client';
import { hashPassword } from '@/lib/hashing';
import { prisma } from '@/lib/prisma';

const singupSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    username: z.string().min(1, 'Username is required'),
    email: z.string().email(),
    password: z.string().min(8, 'Password must be atleast 8 characters'),
});

export async function POST(req: Request) {
    const body = await req.json();
    const parsed = singupSchema.safeParse(body);

    if (!parsed.success) {
        const first = parsed.error.issues[0];

        return NextResponse.json(
            {
                error: first.message,
            },
            {
                status: 400,
            }
        );
    }

    const { email, password, name, username } = parsed.data;
    const normalized = username.trim().toLowerCase();

    // Advanced username requirements (with Zod refinement)
    const reservedUsernames = [
        'admin',
        'superadmin',
        'administrator',
        'support',
        'root',
        'system',
        'emberly',
        'owner',
        'staff',
        'test',
        'null',
        'undefined',
    ];
    if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
        return NextResponse.json(
            { error: 'Username must be 3-30 characters, lowercase letters, numbers or underscore.' },
            { status: 400 }
        );
    }
    if (/__/.test(normalized)) {
        return NextResponse.json({ error: 'Username cannot contain consecutive underscores.' }, { status: 400 });
    }
    if (/^_/.test(normalized) || /_$/.test(normalized)) {
        return NextResponse.json({ error: 'Username cannot start or end with an underscore.' }, { status: 400 });
    }
    if (/^[0-9]+$/.test(normalized)) {
        return NextResponse.json({ error: 'Username cannot be purely numeric.' }, { status: 400 });
    }
    if (reservedUsernames.includes(normalized)) {
        return NextResponse.json({ error: 'This username is reserved. Please choose another.' }, { status: 400 });
    }
    if (/(.)\1{4,}/.test(normalized)) {
        return NextResponse.json(
            { error: 'Username cannot contain the same character more than 5 times in a row.' },
            { status: 400 }
        );
    }

    // Check for existing email and username
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return NextResponse.json({ error: 'Email already in use.' }, { status: 400 });
    }
    const existingUsername = await prisma.user.findUnique({ where: { username: normalized } });
    if (existingUsername) {
        return NextResponse.json({ error: 'Username already in use.' }, { status: 400 });
    }

    // Password strength check (Zod already checks min length, add custom check)
    const passwordStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
        password
    );
    if (!passwordStrong) {
        return NextResponse.json(
            {
                error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
            },
            { status: 400 }
        );
    }

    const hashedPassword = await hashPassword(password);
    const userCount = await prisma.user.count();
    // First signup ever becomes SUPER_ADMIN: sign up immediately after deploy,
    // before sharing the link, so this doesn't hand the role to a stranger.
    const isFirstUser = userCount === 0;
    const role = isFirstUser ? 'SUPER_ADMIN' : 'BASE_USER';

    // Generate a verification token
    const crypto = require('node:crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    try {
        const template = emailTemplates.verification(email, verificationToken);
        // sendEmail reports failure in its result rather than throwing
        const sent = await sendEmail({
            to: email,
            subject: template.subject,
            text: template.text,
            html: template.html,
        });
        if (!sent.success) throw new Error(sent.error);
    } catch (_err: unknown) {
        return NextResponse.json(
            {
                error: 'Failed to send verification email. Please try again later.',
            },
            { status: 500 }
        );
    }

    // Only create user and token if email send succeeded
    const user = await prisma.user.create({
        data: {
            email,
            name,
            username: normalized,
            hashedPassword,
            role,
            emailVerified: null,
        },
    });

    await prisma.verificationToken.create({
        data: {
            identifier: user.email!,
            token: verificationToken,
            expires,
        },
    });

    return NextResponse.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
        },
    });
}
