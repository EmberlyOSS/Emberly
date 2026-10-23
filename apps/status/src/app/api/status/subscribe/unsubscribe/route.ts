import { prisma } from '@/lib/prisma';
import { SITE } from '@/lib/site';
import { NextResponse } from 'next/server';

const APP_URL = SITE.statusUrl;

// GET /api/status/subscribe/unsubscribe?token=...: the one-click link sent
// in every notification email, so it works without needing to be signed in.
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(`${APP_URL}/status?unsubscribed=error`);
    }

    const subscriber = await prisma.statusSubscriber.findUnique({ where: { token } });

    if (!subscriber) {
        return NextResponse.redirect(`${APP_URL}/status?unsubscribed=error`);
    }

    await prisma.statusSubscriber.delete({ where: { token } });

    return NextResponse.redirect(`${APP_URL}/?unsubscribed=true`);
}
