import { NextResponse } from "next/server"

import { rateLimiter } from "@/packages/lib/cache/rate-limit"
import { BasicEmail, sendTemplateEmail } from "@/packages/lib/emails"
import { notifyDiscord } from '@/packages/lib/events/utils/discord-webhook'

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

        const safeName = String(name).slice(0, 200)
        const safeEmail = String(email).slice(0, 200)
        const safeSubject = subject ? String(subject).slice(0, 200) : "(no subject)"
        const safeMessage = String(message).slice(0, 2000)

        // Admin Discord alert (admin-facing, system channel — fire-and-forget)
        const adminWebhookUrl = process.env.DISCORD_WEBHOOK_URL
        if (adminWebhookUrl) {
            notifyDiscord({
                webhookUrl: adminWebhookUrl,
                embeds: [{
                    title: '📬 New Contact Form Submission',
                    color: 0x6366f1,
                    fields: [
                        { name: 'Name', value: safeName, inline: true },
                        { name: 'Email', value: safeEmail, inline: true },
                        { name: 'Subject', value: safeSubject, inline: false },
                        { name: 'Message', value: safeMessage.slice(0, 1024), inline: false },
                    ],
                }],
            }).catch(() => { /* non-critical */ })
        }

        // Auto-reply confirmation to the submitter (fire-and-forget)
        sendTemplateEmail({
            to: safeEmail,
            subject: "We received your message — Emberly",
            template: BasicEmail,
            props: {
                title: "We received your message",
                headline: `Hi ${safeName}, thanks for reaching out!`,
                body: [
                    "We've received your message and will get back to you as soon as possible.",
                    `Your message: "${safeMessage.slice(0, 200)}${safeMessage.length > 200 ? '…' : ''}"`,
                ],
                footerNote: "If you didn't submit this form, you can safely ignore this email.",
            },
        }).catch(() => { /* non-critical */ })

        return NextResponse.json({ ok: true })
    } catch (err: any) {
        console.error("/api/contact error", err)
        return NextResponse.json({ message: err?.message || "Server error" }, { status: 500 })
    }
}
