import { NextResponse } from 'next/server'

import { getStorageProvider } from '@/lib/storage'

function mapAwsErrorToStatus(errAny: any): number | null {
    try {
        const status = errAny?.$metadata?.httpStatusCode
        if (status === 403) return 403
        if (status === 404) return 404
        if (status && status >= 500 && status < 600) return 502
    } catch { }
    return null
}

export async function GET(req: Request) {
    const url = new URL(req.url)
    const key = url.searchParams.get('key')

    if (!key) {
        return NextResponse.json({ error: 'Missing key query parameter' }, { status: 400 })
    }

    try {
        const storageProvider = await getStorageProvider()

        try {
            const size = await storageProvider.getFileSize(key)
            return NextResponse.json({ exists: true, size, provider: storageProvider.constructor.name })
        } catch (err) {
            const status = mapAwsErrorToStatus(err as any)
            const awsMetadata = (err as any)?.$metadata
            const message = (err as any)?.message || String(err)
            const payload: any = { exists: false, message }
            if (awsMetadata) payload.awsMetadata = awsMetadata
            if (status) return NextResponse.json(payload, { status })
            return NextResponse.json(payload, { status: 502 })
        }
    } catch (error) {
        return NextResponse.json({ error: 'Storage initialization failed', message: (error as any)?.message || String(error) }, { status: 500 })
    }
}
