import { events } from '@/packages/lib/events'
import { NextResponse } from 'next/server'

// POST /api/errors/report
// Receives client-side errors and forwards to admin Discord via event system.
// No auth required — errors can happen before auth loads.
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null)

        const message = typeof body?.message === 'string' ? body.message.slice(0, 500) : null
        const url = typeof body?.url === 'string' ? body.url.slice(0, 500) : null
        const type = body?.type === 'client' || body?.type === 'server' ? body.type : null
        const stack = typeof body?.stack === 'string' ? body.stack.slice(0, 2000) : undefined
        const userId = typeof body?.userId === 'string' ? body.userId : undefined
        const userAgent = typeof body?.userAgent === 'string' ? body.userAgent.slice(0, 500) : undefined

        if (!message || !url || !type) {
            return new NextResponse(null, { status: 204 })
        }

        if (type === 'client') {
            void events.emit('system.client-error', {
                message,
                url,
                stack,
                userId,
                userAgent,
            }).catch(() => {})
        } else {
            void events.emit('system.server-error', {
                message,
                url,
                stack,
                userId,
            }).catch(() => {})
        }
    } catch {
        // Intentionally swallow all errors — never leak info from this endpoint
    }

    return new NextResponse(null, { status: 204 })
}
