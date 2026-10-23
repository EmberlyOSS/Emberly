import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'OK',
        message: 'Welcome to the Emberly Status API.',
        code: 200,
    });
}
