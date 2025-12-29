import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const res = await fetch('https://status.emberly.site/summary.json', {
            // prevent Vercel/Next caching
            cache: 'no-store',
        })

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch upstream' }, { status: 500 })
        }

        const data = await res.json()
        return NextResponse.json(data)
    } catch (err) {
        console.error('Error fetching status:', err)
        return NextResponse.json({ error: 'Internal' }, { status: 500 })
    }
}
