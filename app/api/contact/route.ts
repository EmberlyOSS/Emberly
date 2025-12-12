import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
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
