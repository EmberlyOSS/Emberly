import { NextResponse } from 'next/server';
import { getConfigStatus } from '@/lib/config-check';

export const revalidate = 0;

// Only the raw error/warning strings are sensitive here (they can include
// things like a database driver's connection-failure message): the coarse
// booleans (authEnabled etc.) are relied on site-wide by SiteConfigProvider
// to decide whether to show auth UI at all, so those still need to be public
// on every request, not just local ones.
//
// Gated on the Host header nginx forwards (proxy_set_header Host $host),
// not the TCP peer address: behind a reverse proxy every request's peer is
// 127.0.0.1 regardless of who the real client is, so checking that would
// let anyone through.
function isLocalRequest(request: Request): boolean {
    const host = request.headers.get('host') ?? '';
    return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}

export async function GET(request: Request) {
    const local = isLocalRequest(request);

    try {
        const status = await getConfigStatus();

        return NextResponse.json(
            {
                status: status.overall.healthy ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                authEnabled: status.overall.authEnabled,
                database: { connected: status.database.connected },
                auth: {
                    enabled: status.auth.enabled,
                    configured: status.auth.hasSecret && status.auth.hasNextAuthUrl,
                },
                email: { configured: status.email.configured },
                // Only local requests get the raw diagnostic detail: a
                // public caller only ever needs the booleans above.
                internal: local,
                errors: local ? status.overall.errors : [],
                warnings: local ? status.overall.warnings : [],
            },
            { status: status.overall.healthy ? 200 : 503 }
        );
    } catch (error) {
        if (local) {
            console.error('[Health Check] Error:', error);
        }
        return NextResponse.json(
            {
                status: 'error',
                timestamp: new Date().toISOString(),
                authEnabled: false,
                database: { connected: false },
                auth: { enabled: false, configured: false },
                email: { configured: false },
                internal: local,
                errors: local ? [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`] : [],
                warnings: [],
            },
            { status: 500 }
        );
    }
}
