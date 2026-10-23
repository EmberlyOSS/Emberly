import { NextResponse } from 'next/server';

export async function PUT() {
    return NextResponse.json({ error: 'Not available on this platform' }, { status: 404 });
}
