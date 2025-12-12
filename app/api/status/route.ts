import { NextResponse } from 'next/server'

// Simple status endpoint. If PROCESS env `STATUS_JSON` is set to a JSON string,
// it will be parsed and returned. Otherwise a static sample is returned.
export async function GET() {
    try {
        const env = process.env.STATUS_JSON
        if (env) {
            try {
                const parsed = JSON.parse(env)
                return NextResponse.json(parsed)
            } catch (err) {
                console.warn('Could not parse STATUS_JSON env, falling back to sample')
            }
        }

        const sample = {
            page: {
                name: 'Emberly',
                url: 'https://status.emberly.site',
                status: 'UP',
            },
            activeIncidents: [],
            activeMaintenances: [],
        }

        return NextResponse.json(sample)
    } catch (err) {
        return NextResponse.json({ error: 'Internal' }, { status: 500 })
    }
}
