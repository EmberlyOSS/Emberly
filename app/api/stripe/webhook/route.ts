import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET || "", {
    apiVersion: "2022-11-15",
})

async function notifyDiscord(content: string) {
    const url = process.env.DISCORD_WEBHOOK_URL
    if (!url) return

    try {
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        })
    } catch (err) {
        console.error("Failed to post to Discord webhook", err)
    }
}

export async function POST(req: Request) {
    const sig = req.headers.get("stripe-signature") || ""
    const body = await req.text()

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK || "")
    } catch (err: any) {
        console.error("Stripe webhook signature verification failed:", err?.message || err)
        return new Response("Invalid signature", { status: 400 })
    }

    try {
        // Handle a few useful events; extend as needed.
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session
                const customer = session.customer_details?.email || session.customer || "unknown"
                const amount = (session.amount_total != null) ? `${(Number(session.amount_total) / 100).toFixed(2)}` : "n/a"
                await notifyDiscord(`✅ Checkout completed — Customer: ${customer} — Amount: $${amount} — Session: ${session.id}`)
                break
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice
                const amt = invoice.amount_paid != null ? `${(Number(invoice.amount_paid) / 100).toFixed(2)}` : "n/a"
                await notifyDiscord(`💸 Invoice paid — Customer: ${invoice.customer} — Amount: $${amt} — Invoice: ${invoice.id}`)
                break
            }

            case "payment_intent.succeeded": {
                const pi = event.data.object as Stripe.PaymentIntent
                const amt = pi.amount != null ? `${(Number(pi.amount) / 100).toFixed(2)}` : "n/a"
                await notifyDiscord(`💳 PaymentIntent succeeded — Amount: $${amt} — ID: ${pi.id}`)
                break
            }

            default:
                // For other events, optionally log or ignore.
                console.log(`Unhandled Stripe event type: ${event.type}`)
        }
    } catch (err) {
        console.error("Webhook handler error:", err)
        return new Response("Handler error", { status: 500 })
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
}
