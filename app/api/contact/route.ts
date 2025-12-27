import { NextResponse } from "next/server"

import { rateLimiter } from "@/packages/lib/cache/rate-limit"

export async function POST(req: Request) {
    try {
        // Rate limit: 3 contact submissions per minute per IP
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
        const rateLimit = await rateLimiter.checkFixed(`contact:${ip}`, 3, 60)
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { message: "Too many submissions. Please try again later." },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
                    },
                }
            )
        }

        const data = await req.json()
        const { name, email, subject, message } = data || {}

        if (!name || !email || !message) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
        }

        // TODO: integrate with real mailer or ticketing system.
        // For now, log the submission server-side so it's visible in deploy logs.
        // Keep payload small and safe.
        console.log("/api/contact submission:", {
            name: String(name).slice(0, 200),
            email: String(email).slice(0, 200),
            subject: subject ? String(subject).slice(0, 200) : "",
            message: String(message).slice(0, 2000),
            receivedAt: new Date().toISOString(),
        })

        return NextResponse.json({ ok: true })
    } catch (err: any) {
        console.error("/api/contact error", err)
        return NextResponse.json({ message: err?.message || "Server error" }, { status: 500 })
    }
}
