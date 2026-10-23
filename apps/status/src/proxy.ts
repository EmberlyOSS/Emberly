import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/admin')) {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
        const role = token?.role as string | undefined;
        if (!role || !['SUPER_ADMIN', 'ADMINISTRATOR'].includes(role)) {
            return NextResponse.redirect(new URL('/auth/signin', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};